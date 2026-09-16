/**
 * Central configuration for the dealer market analysis.
 *
 * Everything that steers the result lives here so the behaviour can be tuned
 * without touching the logic. All money values are EUR, all distances km.
 */

/** Vehicle classes we can analyse. */
export const MARKETPLACES = {
  AUTOSCOUT24: {
    id: "AUTOSCOUT24",
    label: "AutoScout24",
    hosts: ["autoscout24.de", "www.autoscout24.de", "m.autoscout24.de"],
    level: "RETAIL",
  },
  MOBILE_DE: {
    id: "MOBILE_DE",
    label: "mobile.de",
    hosts: [
      "mobile.de",
      "www.mobile.de",
      "suchen.mobile.de",
      "home.mobile.de",
      "m.mobile.de",
    ],
    level: "RETAIL",
  },
  KLEINANZEIGEN: {
    id: "KLEINANZEIGEN",
    label: "Kleinanzeigen",
    hosts: ["kleinanzeigen.de", "www.kleinanzeigen.de"],
    level: "PRIVATE",
  },
};

export const POLICY = Object.freeze({
  /* ---------------------------------------------------------------- timing */
  // Hard ceiling for the whole pipeline. Must stay below the route maxDuration.
  pipelineTimeoutMs: 45_000,
  // A single page/API request.
  requestTimeoutMs: 12_000,
  requestRetries: 2,
  // The write-up is a nice-to-have: if the model is slow we ship without it.
  narrativeTimeoutMs: 12_000,

  /* ----------------------------------------------------------- comparables */
  // How many listings we pull per source before filtering.
  perSourceLimit: 50,
  // How many survive into the response.
  maxComparables: 12,
  // Minimum needed for a trustworthy market price.
  minComparablesForValuation: 3,
  minComparablesForHighConfidence: 6,
  // Similarity thresholds, tried in order until enough comparables remain.
  similarityLadder: [80, 72, 64, 56],
  // Hard exclusion windows (a candidate outside these is never comparable).
  maxAgeGapMonths: 42,
  maxMileageGapKm: 90_000,
  maxPowerGapPercent: 0.45,

  /* ------------------------------------------------ price normalisation */
  // Depreciation per month, as a share of the comparable's price.
  monthlyDepreciationRate: 0.0075,
  // Value lost per km, as a share of price (4% per 10.000 km).
  pricePerKmRate: 0.000004,
  // Value per 10 PS difference, as a share of price.
  pricePer10PsRate: 0.006,
  // Private asking prices sit below dealer retail.
  privateToRetailUplift: 0.09,
  // No single adjustment may distort a comparable beyond this.
  maxAdjustmentShare: 0.25,

  /* ------------------------------------------------------ dealer economics */
  // The only deduction applied automatically is the pickup trip (lib/pickup.js).
  // Refurbishment is entered by the user. Nothing else is assumed: no reserves,
  // no warranty provision, no standing-time charge, no VAT arithmetic.

  // Discount between asking price and achieved sale price in the market.
  askingToAchievedFactor: 0.965,

  // Starting profit target by price band; the user can change it per vehicle.
  profitBands: [
    { upTo: 5_000, rate: 0.14, floor: 500 },
    { upTo: 10_000, rate: 0.12, floor: 700 },
    { upTo: 20_000, rate: 0.1, floor: 1_000 },
    { upTo: 35_000, rate: 0.08, floor: 1_800 },
    { upTo: Infinity, rate: 0.07, floor: 2_500 },
  ],
});

/** Model used for the closing write-up. Everything numeric is computed in code. */
export const NARRATIVE_MODEL = process.env.OPENAI_MARKET_MODEL || "gpt-4o-mini";

/**
 * The write-up is the only part of this feature that costs money. Set
 * MARKET_NARRATIVE=off to run entirely free — the German text is then the
 * rule-based one, which is complete and quotes the same numbers. Useful while
 * testing many links.
 */
export function isNarrativeModelEnabled() {
  return process.env.MARKET_NARRATIVE !== "off";
}

/**
 * Optional scraping proxy. Set MARKET_FETCH_PROXY to a template containing
 * {url} (it is inserted URL-encoded), e.g.
 *   https://api.scraperapi.com/?api_key=XYZ&country_code=de&url={url}
 * When unset, pages are fetched directly.
 */
export const FETCH_PROXY_TEMPLATE = process.env.MARKET_FETCH_PROXY || "";

export const MOBILE_CREDENTIALS = {
  get username() {
    return process.env.MOBILEDE_USERNAME || "";
  },
  get password() {
    return process.env.MOBILEDE_PASSWORD || "";
  },
  get enabled() {
    return Boolean(
      process.env.MOBILEDE_USERNAME && process.env.MOBILEDE_PASSWORD,
    );
  },
};

export function isSourceEnabled(sourceId) {
  const flag = process.env[`MARKET_DISABLE_${sourceId}`];
  return flag !== "1" && flag !== "true";
}
