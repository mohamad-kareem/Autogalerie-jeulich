/**
 * The dealer maths. Everything here is deterministic — no model ever touches
 * a number. Two stages:
 *
 *   1. market value  — what comparable cars actually fetch, normalised to the
 *                      target's age, mileage, power and seller level.
 *   2. dealer case   — what the car may cost in purchase, given only the
 *                      pickup trip and any refurbishment the buyer enters.
 */

import { POLICY } from "./config";
import {
  clamp,
  dispersionRatio,
  mean,
  median,
  outlierBounds,
  percentile,
  round,
  roundTo,
  standardDeviation,
  weightedMedian,
} from "./utils";

/* ------------------------------------------------------- price adjustment */

/**
 * Normalises a comparable's asking price to the target's specification.
 * Adjustments are proportional to the comparable's own price, so the same
 * logic works for a 3.000 € Polo and an 80.000 € Cayenne.
 */
export function adjustToTarget(candidate, target) {
  const base = candidate.price;
  if (!Number.isFinite(base)) {
    return { adjustedPrice: null, adjustments: [], totalAdjustment: 0 };
  }

  const adjustments = [];
  let delta = 0;

  if (
    Number.isFinite(candidate.registrationMonths) &&
    Number.isFinite(target.registrationMonths)
  ) {
    const monthsNewer = target.registrationMonths - candidate.registrationMonths;
    const amount = monthsNewer * POLICY.monthlyDepreciationRate * base;
    if (Math.abs(amount) >= base * 0.005) {
      delta += amount;
      adjustments.push({
        label: monthsNewer > 0 ? "Zielfahrzeug jünger" : "Zielfahrzeug älter",
        amount: roundTo(amount, 10),
      });
    }
  }

  if (Number.isFinite(candidate.mileageKm) && Number.isFinite(target.mileageKm)) {
    // Fewer km on the target than on the comparable -> the target is worth more.
    const amount =
      (candidate.mileageKm - target.mileageKm) * POLICY.pricePerKmRate * base;
    if (Math.abs(amount) >= base * 0.005) {
      delta += amount;
      adjustments.push({
        label:
          amount > 0 ? "Vergleich hat mehr Kilometer" : "Vergleich hat weniger Kilometer",
        amount: roundTo(amount, 10),
      });
    }
  }

  if (Number.isFinite(candidate.powerPs) && Number.isFinite(target.powerPs)) {
    const amount =
      ((target.powerPs - candidate.powerPs) / 10) * POLICY.pricePer10PsRate * base;
    if (Math.abs(amount) >= base * 0.004) {
      delta += amount;
      adjustments.push({
        label: amount > 0 ? "Zielfahrzeug stärker" : "Vergleich stärker",
        amount: roundTo(amount, 10),
      });
    }
  }

  // A private asking price is below dealer retail — lift it to the same level.
  if (candidate.sourceLevel === "PRIVATE" || candidate.sellerType === "PRIVATE") {
    const amount = base * POLICY.privateToRetailUplift;
    delta += amount;
    adjustments.push({
      label: "Privatangebot auf Händlerniveau gehoben",
      amount: roundTo(amount, 10),
    });
  }

  if (candidate.condition === "REPAIRED_DAMAGE" && target.condition !== "REPAIRED_DAMAGE") {
    const amount = base * 0.05;
    delta += amount;
    adjustments.push({ label: "Vergleich mit Vorschaden", amount: roundTo(amount, 10) });
  }

  const cap = base * POLICY.maxAdjustmentShare;
  delta = clamp(delta, -cap, cap);

  return {
    adjustedPrice: roundTo(base + delta, 10),
    adjustments,
    totalAdjustment: roundTo(delta, 10),
  };
}

/* ------------------------------------------------------------ market value */

/**
 * Robust market value from the accepted comparables.
 * Uses a weighted median (resistant to one silly ad) blended with the plain
 * median, after Tukey-fence outlier removal.
 */
export function computeMarketValue(comparables, target) {
  const priced = comparables.filter((entry) => Number.isFinite(entry.adjustedPrice));

  const bounds = outlierBounds(priced.map((entry) => entry.adjustedPrice));
  const kept = [];
  const outliers = [];

  for (const entry of priced) {
    if (entry.adjustedPrice < bounds.lower || entry.adjustedPrice > bounds.upper) {
      outliers.push({
        title: entry.title,
        listingUrl: entry.listingUrl,
        reason: "Preis liegt außerhalb der robusten Marktspanne.",
      });
    } else {
      kept.push(entry);
    }
  }

  const retail = kept.filter((entry) => entry.sourceLevel !== "PRIVATE");
  const privateAds = kept.filter((entry) => entry.sourceLevel === "PRIVATE");

  const adjusted = kept.map((entry) => entry.adjustedPrice);
  const rawPrices = kept.map((entry) => entry.price).filter(Number.isFinite);

  const weighted = weightedMedian(
    kept.map((entry) => ({ value: entry.adjustedPrice, weight: entry.valuationWeight })),
  );
  const plain = median(adjusted);

  const marketValue =
    weighted !== null && plain !== null
      ? roundTo(weighted * 0.6 + plain * 0.4, 50)
      : roundTo(weighted ?? plain, 50);

  const deviation = standardDeviation(adjusted);

  // Measured on the sample BEFORE outlier removal. Cleaning hides the very
  // thing this number exists to reveal: that the "comparables" were never
  // comparable. A set running 390 € to 2.230 € is not a market, even if the
  // two extremes get filtered out afterwards.
  const dispersion = dispersionRatio(priced.map((entry) => entry.adjustedPrice));
  const q1 = percentile(adjusted, 0.25);
  const q3 = percentile(adjusted, 0.75);

  // Half the interquartile range, floored so the band never looks fake-precise.
  const spread =
    marketValue === null
      ? null
      : roundTo(
          clamp(
            Number.isFinite(q1) && Number.isFinite(q3) ? (q3 - q1) / 2 : deviation || 0,
            Math.max(300, marketValue * 0.025),
            Math.max(900, marketValue * 0.09),
          ),
          50,
        );

  const askingPrice = Number.isFinite(target.price) ? target.price : null;

  return {
    marketValue,
    rangeFrom: marketValue === null ? null : roundTo(marketValue - spread, 50),
    rangeTo: marketValue === null ? null : roundTo(marketValue + spread, 50),
    spread,

    comparableCount: kept.length,
    retailCount: retail.length,
    privateCount: privateAds.length,

    privateMarketLevel: privateAds.length
      ? roundTo(median(privateAds.map((entry) => entry.price)), 50)
      : null,
    retailAskingMedian: retail.length
      ? roundTo(median(retail.map((entry) => entry.price)), 50)
      : null,

    minimumPrice: rawPrices.length ? Math.min(...rawPrices) : null,
    maximumPrice: rawPrices.length ? Math.max(...rawPrices) : null,
    medianPrice: roundTo(median(rawPrices), 50),
    averagePrice: roundTo(mean(rawPrices), 50),
    priceStandardDeviation: roundTo(deviation, 10),
    // Dearest divided by cheapest across the raw sample. Above ~3 the
    // candidates are not really comparable to one another.
    dispersionRatio: round(dispersion, 2),
    droppedAsOutliers: outliers.length,

    averageSimilarity: kept.length
      ? Math.round(mean(kept.map((entry) => entry.similarityScore)))
      : null,

    differenceToAsking:
      marketValue !== null && askingPrice !== null
        ? roundTo(marketValue - askingPrice, 10)
        : null,
    differenceToAskingPercent:
      marketValue !== null && askingPrice
        ? round(((marketValue - askingPrice) / askingPrice) * 100, 1)
        : null,

    outliers,
  };
}

/* --------------------------------------------------------- dealer case */

/**
 * The purchase calculation.
 *
 * Deliberately simple, and deliberately short of assumptions. Only two costs
 * exist: collecting the car, and any refurbishment the buyer enters himself.
 * Nothing is deducted that he did not ask for — no reserves, no warranty
 * provision, no standing-time charge, no VAT arithmetic.
 *
 *   Erwarteter Gewinn = Verkaufspreis − Angebotspreis − Abholkosten − Renovierung
 *   Einkaufslimit     = Verkaufspreis − Abholkosten − Renovierung − Zielgewinn
 *   Nötiger Nachlass  = Angebotspreis − Einkaufslimit   (when positive)
 *
 * @param {object} target
 * @param {object} market      result of computeMarketValue
 * @param {object} [options]
 * @param {object} [options.pickup]            result of computePickupCost
 * @param {number} [options.refurbishmentCost] entered by the user, default 0
 * @param {number} [options.targetProfit]      overrides the default target
 */
export function computeDealerCase(target, market, options = {}) {
  const retail = market.marketValue;
  const asking = Number.isFinite(target.price) ? target.price : null;

  const empty = {
    available: false,
    sellingPrice: null,
    askingPrice: asking,
    pickup: options.pickup || null,
    refurbishmentCost: Math.max(0, Math.round(options.refurbishmentCost || 0)),
    targetProfit: null,
    expectedProfit: null,
    profitMarginPercent: null,
    maximumPurchasePrice: null,
    requiredDiscount: null,
    requiredDiscountPercent: null,
  };

  if (!Number.isFinite(retail) || retail <= 0) return empty;

  // What the car realistically sells for, rather than what it is advertised at.
  const sellingPrice = roundTo(retail * POLICY.askingToAchievedFactor, 50);

  const pickup = options.pickup || null;
  const pickupCost = pickup?.available ? pickup.totalCost : 0;
  const refurbishmentCost = Math.max(0, Math.round(options.refurbishmentCost || 0));

  const targetProfit = Number.isFinite(options.targetProfit)
    ? Math.max(0, Math.round(options.targetProfit))
    : defaultTargetProfit(retail);

  const maximumPurchasePrice = roundTo(
    sellingPrice - pickupCost - refurbishmentCost - targetProfit,
    50,
  );

  const expectedProfit =
    asking === null
      ? null
      : Math.round(sellingPrice - asking - pickupCost - refurbishmentCost);

  return {
    available: true,

    sellingPrice,
    askingPrice: asking,

    pickup,
    pickupCost,
    refurbishmentCost,

    targetProfit,
    expectedProfit,
    profitMarginPercent:
      asking && expectedProfit !== null ? round((expectedProfit / asking) * 100, 1) : null,

    maximumPurchasePrice,

    requiredDiscount:
      asking !== null && asking > maximumPurchasePrice
        ? roundTo(asking - maximumPurchasePrice, 10)
        : 0,
    requiredDiscountPercent:
      asking && asking > maximumPurchasePrice
        ? round(((asking - maximumPurchasePrice) / asking) * 100, 1)
        : 0,

    // True when the pickup leg is still missing, so the UI can ask for it.
    pickupUnknown: Boolean(pickup && !pickup.available),
  };
}

/** A sensible starting profit, scaled to the car's value. The user can change it. */
function defaultTargetProfit(retail) {
  const band =
    POLICY.profitBands.find((entry) => retail <= entry.upTo) ||
    POLICY.profitBands[POLICY.profitBands.length - 1];
  return Math.max(band.floor, roundTo(retail * band.rate, 50));
}

/* --------------------------------------------------------- confidence & verdict */

export function computeConfidence({ market, target, sourceReport, threshold }) {
  if (!Number.isFinite(market.marketValue)) return 10;

  let score = 32;

  score += Math.min(30, market.comparableCount * 4);
  score += Math.round(((market.averageSimilarity || 0) - 60) * 0.45);
  score += market.retailCount >= 4 ? 8 : market.retailCount >= 2 ? 4 : 0;

  // A tight market band means the price is well established.
  if (Number.isFinite(market.spread) && market.marketValue) {
    const relativeSpread = market.spread / market.marketValue;
    if (relativeSpread < 0.05) score += 8;
    else if (relativeSpread > 0.12) score -= 8;
  }

  if (threshold < 72) score -= 6;
  if (threshold < 64) score -= 6;

  const workingSources = sourceReport.filter((entry) => entry.ok).length;
  if (workingSources >= 2) score += 6;
  if (workingSources === 0) score -= 20;

  // A sample spanning 350 € to 2.400 € is not a market. No average of it
  // deserves to be reported with confidence, however many entries it has.
  if (market.dispersionRatio >= 5) score = Math.min(score, 25);
  else if (market.dispersionRatio >= 3.5) score = Math.min(score, 34);
  else if (market.dispersionRatio >= 2.5) score -= 12;

  if (!Number.isFinite(target.mileageKm)) score -= 10;
  if (!Number.isFinite(target.registrationMonths)) score -= 10;
  if (target.fuel === "UNKNOWN") score -= 4;
  if (target.extractedFrom === "html") score -= 3;

  if (market.comparableCount < POLICY.minComparablesForValuation) {
    score = Math.min(score, 38);
  }

  return clamp(Math.round(score), 5, 95);
}

export function determineVerdict({ target, market, dealerCase, confidence }) {
  if (
    !dealerCase.available ||
    market.comparableCount < POLICY.minComparablesForValuation ||
    !Number.isFinite(target.price)
  ) {
    return "INSUFFICIENT_DATA";
  }

  if (confidence < 35) return "INSUFFICIENT_DATA";

  const asking = target.price;
  const limit = dealerCase.maximumPurchasePrice;

  if (!Number.isFinite(limit) || limit <= 0) return "TOO_EXPENSIVE";

  if (asking <= limit * 0.9) return "EXCELLENT";
  if (asking <= limit) return "GOOD";
  if (asking <= limit * 1.1) return "NEGOTIABLE";
  return "TOO_EXPENSIVE";
}

/** Sanity checks surfaced to the user rather than hidden. */
export function collectWarnings({ target, market, dealerCase, sourceReport, threshold }) {
  const warnings = [];

  if (market.comparableCount < POLICY.minComparablesForValuation) {
    warnings.push(
      `Nur ${market.comparableCount} vergleichbare Fahrzeuge gefunden – der Marktwert ist entsprechend unsicher.`,
    );
  }

  if (threshold < 72) {
    warnings.push(
      `Die Ähnlichkeitsschwelle musste auf ${threshold}% gesenkt werden, um genügend Vergleiche zu finden.`,
    );
  }

  if (market.retailCount === 0 && market.privateCount > 0) {
    warnings.push(
      "Es liegen nur Privatangebote als Vergleich vor; der Händler-Verkaufspreis ist hochgerechnet.",
    );
  }

  if (market.dispersionRatio >= 3) {
    warnings.push(
      `Die Vergleichsangebote reichen von ${Math.round(market.minimumPrice)} € bis ${Math.round(market.maximumPrice)} € – das ist keine belastbare Preisbasis. Meist stecken darin Fahrzeuge in deutlich anderem Zustand. Bitte die Vergleichsliste unten prüfen.`,
    );
  }

  if (dealerCase.pickupUnknown) {
    warnings.push(
      "Standort des Fahrzeugs unbekannt – die Abholkosten fehlen in der Kalkulation. Bitte Postleitzahl eintragen.",
    );
  }

  if (dealerCase.available && dealerCase.maximumPurchasePrice <= 0) {
    warnings.push(
      "Nach Abholkosten und Zielgewinn bleibt kein sinnvoller Einkaufspreis – das Fahrzeug trägt sich gewerblich nicht.",
    );
  }

  if (target.condition === "DAMAGED") {
    warnings.push(
      "Die Anzeige weist auf einen Unfall- oder Motorschaden hin – bitte vor Ort prüfen.",
    );
  }

  for (const entry of sourceReport) {
    if (entry.skipped) continue;
    if (entry.blocked) {
      warnings.push(`${entry.source} hat den Abruf blockiert – diese Quelle fehlt im Vergleich.`);
    } else if (!entry.ok && entry.error) {
      warnings.push(`${entry.source}: ${entry.error}`);
    }
  }

  return warnings;
}

export const VERDICTS = {
  EXCELLENT: "EXCELLENT",
  GOOD: "GOOD",
  NEGOTIABLE: "NEGOTIABLE",
  TOO_EXPENSIVE: "TOO_EXPENSIVE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
};
