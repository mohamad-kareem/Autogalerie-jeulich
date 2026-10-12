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
  resolveFromPage,
  resolveTarget,
} from "./sources";
import { parsePastedListing } from "./paste";
import { computePickupCost } from "./pickup";
import { buildInsights } from "./insights";
import { detectMarketplace } from "./sources/urls";
import {
  rejectionReason,
  scoreComparable,
  selectComparables,
} from "./similarity";
import {
  adjustToTarget,
  marketKmRate,
  collectWarnings,
  computeConfidence,
  computeDealerCase,
  computeMarketValue,
  determineVerdict,
  verdictFromDecision,
} from "./valuation";
import { missingCoreFields, missingDetailFields } from "./vehicle";

/** Which portal a copied ad came from, read from the portal's own wording. */
function marketplaceFromText(text) {
  const haystack = String(text || "");
  if (/mobile\.de|dieses inserat beanstanden|inserat bereitgestellt von/i.test(haystack)) {
    return detectMarketplace("https://suchen.mobile.de/");
  }
  if (/autoscout24/i.test(haystack)) return detectMarketplace("https://www.autoscout24.de/");
  if (/kleinanzeigen/i.test(haystack)) return detectMarketplace("https://www.kleinanzeigen.de/");
  return null;
}

/**
 * A stable name for an ad that arrived as text without its link, so it can
 * still be saved. Built from what does not change while the ad is online —
 * not the price, which is exactly what we want to watch move.
 */
function textListingKey(target) {
  const basis = [
    target.make,
    target.model,
    target.firstRegistration,
    target.mileageKm,
    target.powerPs,
    target.location,
  ]
    .map((part) => String(part ?? "").toLowerCase().trim())
    .join("|");

  let hash = 0;
  for (let index = 0; index < basis.length; index += 1) {
    hash = (hash * 31 + basis.charCodeAt(index)) >>> 0;
  }
  return `anzeigentext:${hash.toString(36)}`;
}

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

    // Without a link, the text itself says which portal it came from.
    marketplace = detectMarketplace(url) || marketplaceFromText(options.pastedText);
    // The pasted verdict ("Fairer Preis") belongs to the portal the link names.
    const fields = parsed.fields.portalValuation
      ? {
          ...parsed.fields,
          portalValuation: {
            ...parsed.fields.portalValuation,
            source: parsed.fields.portalValuation.source || marketplace?.label || null,
          },
        }
      : parsed.fields;
    target = buildManualTarget(fields, url);
    if (!url && marketplace) {
      // A Kleinanzeigen ad is the private market, whatever the link field said.
      target = { ...target, source: marketplace.id, sourceLevel: marketplace.level || "RETAIL" };
    }
    if (!target.listingUrl) target = { ...target, listingKey: textListingKey(target) };
    manualEntry = true;
    pasteConfidence = parsed.confidence;
  } else if (options.manualVehicle) {
    // The user filled the form after the portal refused to hand over the ad.
    target = buildManualTarget(options.manualVehicle, url);
    marketplace = detectMarketplace(url);
    manualEntry = true;
  } else {
    // A page sent over by the buyer's browser needs no request to the portal.
    const resolved = options.pageHtml
      ? resolveFromPage(url, options.pageHtml)
      : await resolveTarget(url);

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

  if (missingCore.length) {
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
  const reject = (candidate, reason) =>
    rejected.push({
      title: candidate.title,
      listingUrl: candidate.listingUrl,
      source: candidate.source,
      price: candidate.price,
      reason,
    });

  // The same car listed twice (or on two portals) must count once.
  const { kept: distinct, duplicates } = withoutDuplicates(candidates);
  for (const duplicate of duplicates) reject(duplicate, "Doppelt inseriert (gleicher Preis und Kilometerstand).");

  // An ad's PS figure can simply be wrong ("60 PS" on a 90-PS Venga). When it
  // fits none of the same model's offers, it must not throw them all out.
  const powerDoubt = detectPowerDoubt(distinct, target, options.generations);
  const compareTarget = powerDoubt ? { ...target, powerPs: null, powerKw: null } : target;

  let eligible = [];
  for (const candidate of distinct) {
    const reason = rejectionReason(candidate, compareTarget, options.generations);
    if (reason) reject(candidate, reason);
    else eligible.push(candidate);
  }

  // Kleinanzeigen search results show no gearbox and no PS — an automatic
  // passes as "unknown". The closest of them are opened and read properly.
  const enriched = await settleWithTimeout(
    enrichFromAds(eligible, compareTarget),
    10_000,
    null,
  );
  if (enriched) {
    eligible = [];
    for (const candidate of enriched) {
      const reason = rejectionReason(candidate, compareTarget, options.generations);
      if (reason) reject(candidate, reason);
      else eligible.push(candidate);
    }
  }

  // What a kilometre costs is read from this market when the sample spans
  // enough mileage; otherwise the standard rate applies.
  const kmRate = marketKmRate(eligible, compareTarget);

  for (const candidate of eligible) {
    const { score, differences, weight } = scoreComparable(candidate, compareTarget);
    const { adjustedPrice, adjustments, totalAdjustment } = adjustToTarget(
      candidate,
      compareTarget,
      { kmRate },
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
        reason:
          entry.similarityScore >= threshold
            ? `Weniger ähnlich als die ${POLICY.maxComparablesForValue} besten Vergleiche (${entry.similarityScore} %).`
            : `Übereinstimmung ${entry.similarityScore} % liegt unter der Schwelle von ${threshold} %.`,
      });
    }
  }

  /* 4 ─ market value and the purchase calculation ---------------------- */

  const market = computeMarketValue(accepted, target);
  market.kmRate = {
    per10000KmPercent: Math.round((kmRate ?? POLICY.pricePerKmRate) * 10_000 * 1000) / 10,
    source: kmRate ? "MARKET" : "STANDARD",
  };

  for (const outlier of market.outliers) {
    rejected.push({ ...outlier, source: null, price: null });
  }

  const usedComparables = accepted
    .filter(
      (entry) =>
        !market.outliers.some((outlier) => outlier.listingUrl === entry.listingUrl),
    )
    .sort((a, b) => b.similarityScore - a.similarityScore);

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
      ...(options.settings
        ? {
            origin: options.settings.origin,
            hourlyRate: options.settings.hourlyRate,
            fuelLitresPer100Km: options.settings.fuelLitresPer100Km,
            fuelPricePerLitre: options.settings.fuelPricePerLitre,
          }
        : {}),
    }),
    9_000,
    {
      available: false,
      needsLocation: true,
      note: "Abholkosten konnten nicht berechnet werden – bitte Postleitzahl eintragen.",
    },
  );

  const dealerCase = computeDealerCase(target, market, { ...options, pickup });

  let confidence = computeConfidence({
    market,
    target,
    sourceReport: report,
    threshold,
  });

  /* 4b ─ beyond the price: equipment, usage, position, negotiation ------ */

  const insights = buildInsights({
    target,
    market,
    comparables: usedComparables,
    dealerCase,
    observations: options.observations || [],
  });

  // A portal that prices this exact car from its whole stock is a second
  // opinion worth listening to. Agreement raises confidence a little;
  // clear disagreement lowers it, and says so.
  if (insights.portal.available && insights.portal.agrees !== null) {
    const deviation = Math.abs(insights.portal.agreementPercent);
    if (insights.portal.agrees) confidence = Math.min(95, confidence + 6);
    else if (deviation >= 20) confidence = Math.max(5, confidence - 8);
  }

  // "OPEN" until the AI has decided; INSUFFICIENT_DATA when there is no market value.
  const baseVerdict = determineVerdict({ target, market, dealerCase });

  const warnings = collectWarnings({ target, market, dealerCase, threshold });
  if (powerDoubt) {
    warnings.unshift(
      `PS-Angabe der Anzeige (${powerDoubt.adPs} PS) passt zu keinem Vergleich desselben Modells – dort meist ${powerDoubt.marketPs} PS. Die Leistung wurde beim Vergleich nicht berücksichtigt; Angabe beim Verkäufer prüfen.`,
    );
  }

  if (
    insights.portal.available &&
    insights.portal.agrees === false &&
    Math.abs(insights.portal.agreementPercent) >= 15
  ) {
    warnings.push(
      `${insights.portal.source} sieht den Marktpreis bei ${insights.portal.median.toLocaleString("de-DE")} € – unser Marktwert weicht um ${Math.abs(insights.portal.agreementPercent).toLocaleString("de-DE")} % davon ab. Vergleichsliste prüfen.`,
    );
  }

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
    verdict: baseVerdict,
    confidence,
    insights,
    skipModel: options.skipModel,
  });

  // The decision is the AI's. Without the AI the case stays open — the
  // numbers are shown, no formula pretends to judge.
  const verdict =
    baseVerdict === "INSUFFICIENT_DATA"
      ? baseVerdict
      : verdictFromDecision(recommendation?.decision, "OPEN");

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
    insights,

    meta: {
      analyzedAt: new Date().toISOString(),
      durationMs: elapsed(),
      similarityThreshold: threshold,
      manualEntry,
      pasteConfidence,
      candidatesFound: candidates.length,
      powerDoubt: powerDoubt || null,
      candidatesAccepted: usedComparables.length,
      sources: report,
    },
  };
}

/* --------------------------------------------------------- comparable helpers */

/**
 * One car listed twice — the same ad on two portals, or re-posted — would
 * count double. Same price, same km (±500) and same first registration year
 * are taken as the same car.
 */
export function withoutDuplicates(candidates) {
  const kept = [];
  const duplicates = [];
  for (const candidate of candidates) {
    const year = Number.isFinite(candidate.registrationMonths) ? Math.floor(candidate.registrationMonths / 12) : null;
    const twin = kept.find(
      (other) =>
        Number.isFinite(candidate.price) &&
        other.price === candidate.price &&
        Number.isFinite(candidate.mileageKm) &&
        Number.isFinite(other.mileageKm) &&
        Math.abs(other.mileageKm - candidate.mileageKm) <= 500 &&
        (year === null ||
          !Number.isFinite(other.registrationMonths) ||
          Math.abs(Math.floor(other.registrationMonths / 12) - year) <= 1),
    );
    if (twin) duplicates.push(candidate);
    else kept.push(candidate);
  }
  return { kept, duplicates };
}

/**
 * The ad's PS is doubtful when at least five offers of the same model (all
 * else comparable) state their power and none is within 12 % of it. Returns
 * the most common power of those offers, or null.
 */
export function detectPowerDoubt(candidates, target, generations = null) {
  if (!Number.isFinite(target.powerPs) || target.powerPs <= 0) return null;
  const blind = { ...target, powerPs: null, powerKw: null };
  const same = candidates.filter(
    (candidate) => Number.isFinite(candidate.powerPs) && !rejectionReason(candidate, blind, generations),
  );
  if (same.length < 5) return null;
  const near = same.filter((candidate) => Math.abs(candidate.powerPs - target.powerPs) / target.powerPs <= 0.12);
  if (near.length) return null;

  const counts = new Map();
  for (const candidate of same) {
    const ps = Math.round(candidate.powerPs);
    counts.set(ps, (counts.get(ps) || 0) + 1);
  }
  const [marketPs] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return { adPs: Math.round(target.powerPs), marketPs, offers: same.length };
}

const ENRICH_FIELDS = ["gearbox", "fuel", "powerPs", "powerKw", "condition", "sellerType", "title"];

/**
 * Opens the closest Kleinanzeigen search results whose gearbox or power is
 * unknown (at most 10, in parallel) and takes those facts from the ad itself.
 * A failed page keeps the search result as it was.
 */
export async function enrichFromAds(candidates, target) {
  const needsDetail = (candidate) =>
    candidate.source === "KLEINANZEIGEN" &&
    candidate.extractedFrom === "search" &&
    candidate.listingUrl &&
    (candidate.gearbox === "UNKNOWN" || !Number.isFinite(candidate.powerPs));
  const distance = (candidate) =>
    (Number.isFinite(candidate.registrationMonths) && Number.isFinite(target.registrationMonths)
      ? Math.abs(candidate.registrationMonths - target.registrationMonths) / 12
      : 2) +
    (Number.isFinite(candidate.mileageKm) && Number.isFinite(target.mileageKm)
      ? Math.abs(candidate.mileageKm - target.mileageKm) / 20_000
      : 2);

  const chosen = candidates.filter(needsDetail).sort((a, b) => distance(a) - distance(b)).slice(0, 10);
  if (!chosen.length) return candidates;

  const { fetchListing } = await import("./sources/kleinanzeigen");
  const details = await Promise.all(
    chosen.map((candidate) =>
      settleWithTimeout(
        fetchListing(candidate.listingUrl).catch(() => null),
        8_000,
        null,
      ),
    ),
  );

  const byUrl = new Map();
  chosen.forEach((candidate, index) => {
    const vehicle = details[index]?.ok ? details[index].vehicle : null;
    if (vehicle) byUrl.set(candidate.listingUrl, vehicle);
  });

  return candidates.map((candidate) => {
    const vehicle = byUrl.get(candidate.listingUrl);
    if (!vehicle) return candidate;
    const merged = { ...candidate, extractedFrom: "search+ad" };
    for (const field of ENRICH_FIELDS) {
      const value = vehicle[field];
      if (value === null || value === undefined || value === "" || value === "UNKNOWN") continue;
      merged[field] = value;
    }
    if (vehicle.sellerType === "DEALER") merged.sourceLevel = "RETAIL";
    return merged;
  });
}
