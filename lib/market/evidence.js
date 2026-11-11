import { POLICY } from "./config";

/** A small reference list cannot support a resale calculation. */
export function marketEvidenceNote(market) {
  const count = market?.comparableCount;
  if (!Number.isFinite(count) || count >= POLICY.minComparablesForValuation) return null;
  return `Nur ${count} Vergleichsangebote vorhanden; mindestens ${POLICY.minComparablesForValuation} sind für eine Bewertung erforderlich. Marktwert, Verkaufspreis, Einkaufslimit und Gewinn sind damit nicht belastbar berechenbar.`;
}

export function withMarketEvidence(result) {
  const note = marketEvidenceNote(result?.market);
  if (!note) return result;

  // Also apply this to older saved reports, whose derived prices and prose
  // were produced before the minimum sample size was enforced.
  return {
    ...result,
    verdict: "PRUEFEN",
    confidence: Math.min(result.confidence ?? 10, 10),
    market: {
      ...result.market,
      marketValue: null,
      rangeFrom: null,
      rangeTo: null,
      spread: null,
      differenceToAsking: null,
      differenceToAskingPercent: null,
      offerReference: null,
      offerReferenceBasis: null,
      belowReferencePercent: null,
      valuationNote: note,
    },
    dealer: result.dealer ? {
      ...result.dealer,
      available: false,
      sellingPrice: null,
      sellingPriceLow: null,
      sellingPriceHigh: null,
      expectedProfit: null,
      profitMarginPercent: null,
      maximumPurchasePrice: null,
      requiredDiscount: null,
      requiredDiscountPercent: null,
    } : result.dealer,
    recommendation: result.recommendation ? {
      ...result.recommendation,
      decision: "PRUEFEN",
      headline: "Marktdaten reichen nicht aus",
      summary: note,
      reasons: [],
      risks: [],
    } : result.recommendation,
    deep: result.deep ? {
      ...result.deep,
      decision: { action: "PRUEFEN", reasonType: "DATENLAGE" },
      decisionBasis: null,
      decisionNote: note,
    } : result.deep,
    insights: result.insights ? { ...result.insights, negotiation: null } : result.insights,
    warnings: [note],
  };
}
