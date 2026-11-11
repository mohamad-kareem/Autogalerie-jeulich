const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const PRICE_STATUSES = ["IM_LIMIT", "UEBER_LIMIT", "KEIN_SPIELRAUM", "UNBEKANNT"];

export function purchasePriceStatus(limit, askingPrice) {
  if (!Number.isFinite(limit) || !Number.isFinite(askingPrice) || askingPrice <= 0) return "UNBEKANNT";
  if (limit <= 0) return "KEIN_SPIELRAUM";
  return askingPrice > limit ? "UEBER_LIMIT" : "IM_LIMIT";
}

export function purchasePriceNote(limit, askingPrice) {
  const status = purchasePriceStatus(limit, askingPrice);
  if (status === "UNBEKANNT" || status === "KEIN_SPIELRAUM") return null;
  const gap = askingPrice - limit;
  const price = `Der geprüfte Kaufpreis von ${euro.format(askingPrice)}`;
  if (gap === 0) return `${price} entspricht dem Einkaufslimit.`;
  return `${price} liegt ${euro.format(Math.abs(gap))} ${gap > 0 ? "über" : "unter"} dem Einkaufslimit von ${euro.format(limit)}.`;
}

export function decisionBasis(dealer) {
  return {
    askingPrice: dealer?.askingPrice ?? null,
    maximumPurchasePrice: dealer?.maximumPurchasePrice ?? null,
    targetProfit: dealer?.targetProfit ?? null,
    expectedProfit: dealer?.expectedProfit ?? null,
  };
}

// Older reports have only prose. Recognize direct claims about the limit.
const aboveLimitClaim = /(?<![\p{L}\p{N}])(?:über|oberhalb)\s+(?:(?:dem|des|das)\s+)?(?:(?:berechneten|verbindlichen|gesetzten)\s+)?(?:einkaufs[- ]?)?limits?\b/iu;

export function guardPurchaseDecision(action, limit, askingPrice, { review, reviewedBasis, currentBasis } = {}) {
  if (!["KAUFEN", "VERHANDELN", "PRUEFEN", "NICHT_KAUFEN"].includes(action)) {
    return { action, note: null };
  }

  const status = purchasePriceStatus(limit, askingPrice);
  if (action === "KAUFEN" && status === "UNBEKANNT") {
    return { action: "PRUEFEN", note: "Für eine Kaufempfehlung fehlen ein Einkaufspreis oder ein berechnetes Einkaufslimit." };
  }
  if (action === "KAUFEN" && status === "KEIN_SPIELRAUM") {
    return { action: "PRUEFEN", note: "Die Kalkulation ergibt keinen positiven Einkaufsspielraum." };
  }
  if (action === "KAUFEN" && status === "UEBER_LIMIT") {
    return { action: "PRUEFEN", note: purchasePriceNote(limit, askingPrice) };
  }

  if (reviewedBasis && currentBasis &&
    Object.entries(currentBasis).some(([key, value]) => reviewedBasis[key] !== value)) {
    return {
      action: "PRUEFEN",
      note: "Die Einkaufskonditionen haben sich seit der KI-Bewertung geändert.",
    };
  }

  const reasons = Array.isArray(review?.reasons) ? review.reasons : [];
  const reviewText = [review?.headline, review?.summary, ...reasons].join(" ");
  const wrongStatus = review?.priceStatus && review.priceStatus !== status;
  const falsePriceRejection = status === "IM_LIMIT" && action === "NICHT_KAUFEN" &&
    (review?.reasonType === "PREIS" ||
      (review?.priceStatus && !["FAHRZEUG", "DATENLAGE"].includes(review.reasonType)) ||
      aboveLimitClaim.test(reviewText));
  if (wrongStatus || falsePriceRejection) {
    return {
      action: "PRUEFEN",
      note: "Die Preisbegründung der KI widerspricht der aktuellen Kalkulation.",
    };
  }
  return { action, note: null };
}
