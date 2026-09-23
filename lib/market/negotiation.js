/**
 * Verhandlung — three prices to take into the phone call.
 *
 *   Einstiegsangebot  where to open. Low enough to leave room, not so low that
 *                     the seller hangs up.
 *   Zielpreis         where a fair deal should land.
 *   Schmerzgrenze     the most to pay: the purchase limit, or the asking price
 *                     when that is already lower. Above it, walk away.
 *
 * How hard to open depends on the seller's position, which the analysis reads
 * from the data (see insights.js): a car that has been online for two months at
 * an above-market price leaves room; a fresh ad at a good price with thirty
 * people watching does not.
 *
 * One case is different in kind. When the seller would have to come down by
 * more than about an eighth to reach the limit, haggling in steps is pointless —
 * an opening offer 30 % under the ask ends the call. Then the plan is a single
 * limit offer, and watching the ad for a price drop.
 *
 * Pure and dependency-free, so the page can recompute it while the buyer
 * edits the calculation — the prices always follow the current limit.
 */

export const STANCES = {
  FIRM: { label: "Hart verhandeln", openingShare: 0.85, maxOpeningDiscount: 0.16 },
  NORMAL: { label: "Normal verhandeln", openingShare: 0.89, maxOpeningDiscount: 0.12 },
  SOFT: { label: "Zügig zusagen", openingShare: 0.93, maxOpeningDiscount: 0.07 },
};

/** Beyond this share of the asking price, no stepwise negotiation is realistic. */
export const LIMIT_OFFER_GAP = 0.12;

/**
 * Beyond this, even a single limit offer is pointless: asking a seller to give
 * up more than 40 % of his price (or offering next to nothing) only ends the
 * conversation. Save the ad and watch the price instead.
 */
export const NO_OFFER_GAP = 0.4;

const floor100 = (value) => Math.floor(value / 100) * 100;
const round50 = (value) => Math.round(value / 50) * 50;

/**
 * @param {object} input
 * @param {number} input.limit        the purchase limit (Einkaufslimit)
 * @param {number} input.askingPrice  what the seller currently asks
 * @param {string} [input.stance]     FIRM | NORMAL | SOFT
 * @returns {object|null} null when there is nothing sensible to offer
 */
export function negotiationPlan({ limit, askingPrice, stance = "NORMAL" }) {
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) return null;
  if (!Number.isFinite(limit)) return null;
  // A limit at or below zero: the car cannot be bought profitably at any price.
  if (limit <= 0) {
    return {
      stance: STANCES[stance] ? stance : "NORMAL",
      walkAway: 0,
      gapPercent: 100,
      askingWithinLimit: false,
      mode: "NO_OFFER",
      stanceLabel: "Kein Angebot",
      opening: null,
      target: null,
      discountToTarget: askingPrice,
      discountToTargetPercent: 100,
    };
  }

  const mode = STANCES[stance] ? stance : "NORMAL";
  const { openingShare, maxOpeningDiscount } = STANCES[mode];

  // Never pay more than asked, even when the limit would allow it.
  const walkAway = Math.min(limit, askingPrice);
  const gap = (askingPrice - limit) / askingPrice;

  const common = {
    stance: mode,
    walkAway,
    // How far the seller is from the limit, in percent of his price.
    gapPercent: gap > 0 ? Math.round(gap * 1000) / 10 : 0,
    askingWithinLimit: askingPrice <= limit,
  };

  if (gap > NO_OFFER_GAP || (gap > LIMIT_OFFER_GAP && floor100(limit * 0.97) < 100)) {
    return {
      ...common,
      mode: "NO_OFFER",
      stanceLabel: "Kein Angebot",
      opening: null,
      target: null,
      discountToTarget: askingPrice - walkAway,
      discountToTargetPercent: Math.round(gap * 1000) / 10,
    };
  }

  if (gap > LIMIT_OFFER_GAP) {
    const opening = floor100(limit * 0.97);
    return {
      ...common,
      mode: "LIMIT_OFFER",
      stanceLabel: "Nur Limit-Angebot",
      opening,
      target: walkAway,
      discountToTarget: askingPrice - walkAway,
      discountToTargetPercent: Math.round(gap * 1000) / 10,
    };
  }

  // Open a fixed share below the ceiling — but never so far below the asking
  // price that the seller stops listening, and never at or above the ceiling.
  const byCeiling = walkAway * openingShare;
  const byAsking = askingPrice * (1 - maxOpeningDiscount);
  const opening = Math.max(
    100,
    floor100(Math.min(walkAway - 100, Math.max(byCeiling, byAsking))),
  );

  const target =
    walkAway - opening < 200
      ? walkAway
      : Math.min(walkAway, round50((opening + walkAway) / 2));

  return {
    ...common,
    mode: "STEPS",
    stanceLabel: STANCES[mode].label,
    opening,
    target,
    // How far the seller must come down from his current price to the target.
    discountToTarget: Math.max(0, askingPrice - target),
    discountToTargetPercent:
      Math.round((Math.max(0, askingPrice - target) / askingPrice) * 1000) / 10,
  };
}
