/**
 * The pipeline, end to end.
 *
 *   link -> target vehicle -> comparables -> scoring -> market value
 *        -> dealer calculation -> verdict -> write-up
 *
 * Each stage is deterministic and independently testable; the only stage that
 * talks to a model is the write-up, and it cannot change a number.
 */

import { POLICY } from "./config";
import { settleWithTimeout } from "./utils";
import { buildNarrative } from "./narrative";
import {
  buildManualTarget,
  gatherComparables,
  resolveTarget,
} from "./sources";
import { parsePastedListing } from "./paste";
import { computePickupCost } from "./pickup";
import { detectMarketplace } from "./sources/urls";
import {
  rejectionReason,
  scoreComparable,
  selectComparables,
} from "./similarity";
import {
  adjustToTarget,
  collectWarnings,
  computeConfidence,
  computeDealerCase,
  computeMarketValue,
  determineVerdict,
} from "./valuation";
import { missingCoreFields, missingDetailFields } from "./vehicle";

export class AnalysisError extends Error {
  constructor(message, { status = 422, hint = null, code = null, details = null } = {}) {
    super(message);
    this.name = "AnalysisError";
    this.status = status;
    this.hint = hint;
    // `code` lets the UI react: TARGET_UNREADABLE offers manual entry.
    this.code = code;
    this.details = details;
  }
}

/**
 * @param {string} url  the pasted marketplace link
 * @param {object} [options] { targetMarginOverride, daysToSellOverride, skipModel }
 */
export async function analyzeListing(url, options = {}) {
  const startedAt = Date.now();

  /* 1 ─ the car the dealer is looking at ------------------------------- */

  let target;
  let marketplace = null;
  let manualEntry = false;
  let pasteConfidence = null;

  if (options.pastedText) {
    // The portal refused the server, so the user pasted the ad text instead.
    const parsed = parsePastedListing(options.pastedText);

    if (parsed.missing.length) {
      throw new AnalysisError(
        `Aus dem eingefügten Text fehlen noch: ${parsed.missing.join(", ")}.`,
        {
          status: 422,
          code: "PASTE_INCOMPLETE",
          hint: "Bitte den kompletten Anzeigentext einfügen oder die fehlenden Felder unten ergänzen.",
          details: {
            canRetryManually: true,
            missing: parsed.missing,
            partial: buildManualTarget(parsed.fields, url),
            parsedConfidence: parsed.confidence,
          },
        },
      );
    }

    target = buildManualTarget(parsed.fields, url);
    marketplace = detectMarketplace(url);
    manualEntry = true;
    pasteConfidence = parsed.confidence;
  } else if (options.manualVehicle) {
    // The user filled the form after the portal refused to hand over the ad.
    target = buildManualTarget(options.manualVehicle, url);
    marketplace = detectMarketplace(url);
    manualEntry = true;
  } else {
    const resolved = await resolveTarget(url);

    if (!resolved.ok) {
      throw new AnalysisError(resolved.error, {
        status: 422,
        code: resolved.code || "TARGET_UNREADABLE",
        hint: resolved.canRetryManually
          ? "Anzeigentext einfügen (Strg+A, Strg+C auf der Anzeige) – Marktvergleich und Kalkulation laufen damit vollständig."
          : "Bitte den direkten Link zur Fahrzeuganzeige prüfen.",
        details: {
          canRetryManually: Boolean(resolved.canRetryManually),
          marketplace: resolved.marketplace
            ? { id: resolved.marketplace.id, label: resolved.marketplace.label }
            : null,
          listingUrl: resolved.listingUrl || null,
          debug: resolved.debug || null,
        },
      });
    }

    target = resolved.vehicle;
    marketplace = resolved.marketplace;
  }

  const missingCore = missingCoreFields(target);

  if (missingCore.includes("Preis") || missingCore.includes("Marke")) {
    throw new AnalysisError(
      manualEntry
        ? `Es fehlen noch Pflichtangaben: ${missingCore.join(", ")}.`
        : `Aus der Anzeige liessen sich ${missingCore.join(" und ")} nicht auslesen. Ohne diese Angaben ist keine Bewertung möglich.`,
      {
        status: 422,
        code: "TARGET_INCOMPLETE",
        details: {
          canRetryManually: true,
          missing: missingCore,
          partial: target,
        },
      },
    );
  }

  /* 2 ─ the market ----------------------------------------------------- */

  const elapsed = () => Date.now() - startedAt;
  const searchBudget = Math.max(
    6_000,
    POLICY.pipelineTimeoutMs - elapsed() - POLICY.narrativeTimeoutMs - 3_000,
  );

  const { candidates, report } = await gatherComparables(target, {
    budgetMs: searchBudget,
  });

  /* 3 ─ which of them are actually comparable -------------------------- */

  const scored = [];
  const rejected = [];

  for (const candidate of candidates) {
    const reason = rejectionReason(candidate, target);
    if (reason) {
      rejected.push({
        title: candidate.title,
        listingUrl: candidate.listingUrl,
        source: candidate.source,
        price: candidate.price,
        reason,
      });
      continue;
    }

    const { score, differences, weight } = scoreComparable(candidate, target);
    const { adjustedPrice, adjustments, totalAdjustment } = adjustToTarget(
      candidate,
      target,
    );

    scored.push({
      ...candidate,
      similarityScore: score,
      valuationWeight: weight,
      adjustedPrice,
      priceAdjustment: totalAdjustment,
      adjustments,
      differences,
    });
  }

  const { accepted, threshold } = selectComparables(scored);

  for (const entry of scored) {
    if (!accepted.includes(entry)) {
      rejected.push({
        title: entry.title,
        listingUrl: entry.listingUrl,
        source: entry.source,
        price: entry.price,
        reason: `Übereinstimmung ${entry.similarityScore} % liegt unter der Schwelle von ${threshold} %.`,
      });
    }
  }

  /* 4 ─ market value and the purchase calculation ---------------------- */

  const market = computeMarketValue(accepted, target);

  for (const outlier of market.outliers) {
    rejected.push({ ...outlier, source: null, price: null });
  }

  const usedComparables = accepted
    .filter(
      (entry) =>
        !market.outliers.some((outlier) => outlier.listingUrl === entry.listingUrl),
    )
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, POLICY.maxComparables);

  // The pickup trip is the only automatic cost, and it needs a real route.
  const pickup = await settleWithTimeout(
    computePickupCost({
      location: target.location,
      postcode: options.pickupPostcode || null,
      inboundMode: options.pickupMode,
      inboundMinutes: options.pickupInboundMinutes,
      onSiteMinutes: options.pickupOnSiteMinutes,
      ticketCost: options.pickupTicketCost,
      fuelCost: options.pickupFuelCost,
    }),
    9_000,
    {
      available: false,
      needsLocation: true,
      note: "Abholkosten konnten nicht berechnet werden – bitte Postleitzahl eintragen.",
    },
  );

  const dealerCase = computeDealerCase(target, market, { ...options, pickup });

  const confidence = computeConfidence({
    market,
    target,
    sourceReport: report,
    threshold,
  });

  const verdict = determineVerdict({ target, market, dealerCase, confidence });

  const warnings = collectWarnings({ target, market, dealerCase, threshold });

  if (manualEntry) {
    warnings.unshift(
      pasteConfidence !== null
        ? `Die Fahrzeugdaten stammen aus dem eingefügten Anzeigentext (${pasteConfidence} % der Felder erkannt) – bitte Preis und Kilometerstand kurz gegenprüfen.`
        : "Die Fahrzeugdaten wurden von Hand eingetragen – Marktwert und Kalkulation hängen unmittelbar an diesen Angaben.",
    );
  }

  const detailGaps = missingDetailFields(target);

  /* 5 ─ the write-up --------------------------------------------------- */

  const recommendation = await buildNarrative({
    target,
    market,
    dealerCase,
    verdict,
    confidence,
    skipModel: options.skipModel,
  });

  return {
    target: { ...target, missingFields: detailGaps },
    marketplace: marketplace
      ? { id: marketplace.id, label: marketplace.label }
      : null,

    market,
    dealer: dealerCase,
    comparables: usedComparables,
    rejected: rejected.slice(0, 40),

    verdict,
    confidence,
    recommendation,
    warnings,

    meta: {
      analyzedAt: new Date().toISOString(),
      durationMs: elapsed(),
      similarityThreshold: threshold,
      manualEntry,
      pasteConfidence,
      candidatesFound: candidates.length,
      candidatesAccepted: usedComparables.length,
      sources: report,
    },
  };
}
