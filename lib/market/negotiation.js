/**
 * Verhandlung — three prices to take into the phone call, each with the profit
 * it leaves.
 *
 *   Einstieg   where to open: below the asking price, by how hard the seller's
 *              position lets you push (stance, read from the data in insights.js).
 *   Ziel       the price with the full target margin when that is within
 *              reach, otherwise the middle between opening and asking price.
 *   Höchstens  the asking price — never more.
 *
 * When the asking price already means a loss, the steps follow the money
 * instead: open at the full-margin price, at most the price where the profit
 * is 0, and say how far the seller is from it.
 *
 * Whether to buy at all is not decided here: that is the AI's decision
 * (normal or deep analysis). Only when it says "Nicht kaufen" is there no plan.
 * No fixed percentage turns a plan into "no offer".
 *
 * Pure and dependency-free, so the page can recompute it while the buyer
 * edits the calculation.
 */

export const STANCES = {
  FIRM: { label: "Hart verhandeln", openingDiscount: 0.15 },
  NORMAL: { label: "Normal verhandeln", openingDiscount: 0.11 },
  SOFT: { label: "Zügig zusagen", openingDiscount: 0.06 },
};

const floor100 = (value) => Math.floor(value / 100) * 100;
const round50 = (value) => Math.round(value / 50) * 50;

/**
 * @param {object} input
 * @param {number} input.limit           price with the full target margin (Einkaufslimit)
 * @param {number} input.askingPrice     what the seller currently asks
 * @param {string} [input.stance]        FIRM | NORMAL | SOFT
 * @param {string} [input.decision]      the AI's decision (KAUFEN, VERHANDELN, PRUEFEN, NICHT_KAUFEN)
 * @param {number} [input.profitAtAsking] profit if bought at the asking price
 * @returns {object|null}
 */
export function negotiationPlan({ limit, askingPrice, stance = "NORMAL", decision = null, profitAtAsking = null }) {
  if (!Number.isFinite(askingPrice) || askingPrice <= 0) return null;

  const mode = STANCES[stance] ? stance : "NORMAL";
  const fullMargin = Number.isFinite(limit) && limit > 0 ? Math.min(limit, askingPrice) : null;
  const profitAt = (price) =>
    Number.isFinite(profitAtAsking) && Number.isFinite(price)
      ? Math.round(profitAtAsking + (askingPrice - price))
      : null;

  if (decision === "NICHT_KAUFEN") {
    return {
      stance: mode,
      mode: "NO_BUY",
      stanceLabel: "Nicht kaufen",
      opening: null,
      target: null,
      walkAway: null,
      fullMarginPrice: fullMargin,
      profit: { opening: null, target: null, walkAway: profitAt(askingPrice) },
    };
  }

  // The asking price already means a loss: steps below the asking price would
  // all lose money too. Then the plan follows the economics — open at the
  // full-margin price, and never go above the price where the profit is 0.
  const breakEven = Number.isFinite(profitAtAsking) ? askingPrice - Math.max(0, -profitAtAsking) : null;
  if (Number.isFinite(profitAtAsking) && profitAtAsking <= 0 && breakEven > 0) {
    const ceiling = Math.max(100, floor100(breakEven));
    const opening = fullMargin !== null && fullMargin > 0 && fullMargin < ceiling ? floor100(fullMargin) : Math.max(100, floor100(ceiling * 0.9));
    const target = ceiling - opening < 200 ? ceiling : round50((opening + ceiling) / 2);
    return {
      stance: mode,
      mode: "LOSS",
      stanceLabel: STANCES[mode].label,
      opening,
      target,
      walkAway: ceiling,
      fullMarginPrice: fullMargin,
      // How far the seller is from the price where anything is earned at all.
      gapPercent: Math.round(((askingPrice - ceiling) / askingPrice) * 100),
      loss: Math.round(-profitAtAsking),
      profit: { opening: profitAt(opening), target: profitAt(target), walkAway: profitAt(ceiling) },
    };
  }

  const walkAway = askingPrice;
  const opening = Math.max(100, floor100(askingPrice * (1 - STANCES[mode].openingDiscount)));
  const target =
    fullMargin !== null && fullMargin > opening && fullMargin < askingPrice
      ? round50(fullMargin)
      : walkAway - opening < 200
        ? walkAway
        : round50((opening + walkAway) / 2);

  return {
    stance: mode,
    mode: "STEPS",
    stanceLabel: STANCES[mode].label,
    opening,
    target,
    walkAway,
    // The price with the full target margin — shown when it lies below the
    // opening, so the buyer sees how far the target margin is away.
    fullMarginPrice: fullMargin,
    profit: { opening: profitAt(opening), target: profitAt(target), walkAway: profitAt(walkAway) },
  };
}
