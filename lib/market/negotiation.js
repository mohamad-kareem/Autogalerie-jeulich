/**
 * Verhandlung — three prices to take into the phone call, each with the profit
 * it leaves.
 *
 * Höchstens is the lower of the purchase limit and the asking price.
 * Einstieg and Ziel are based on that ceiling and the seller's position.
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
  const walkAway = Number.isFinite(limit) && limit > 0 ? Math.min(limit, askingPrice) : null;
  const profitAt = (price) =>
    Number.isFinite(profitAtAsking) && Number.isFinite(price)
      ? Math.round(profitAtAsking + (askingPrice - price))
      : null;

  if (decision === "NICHT_KAUFEN" || walkAway === null) {
    const noBuy = decision === "NICHT_KAUFEN";
    return {
      stance: mode,
      mode: noBuy ? "NO_BUY" : "NO_LIMIT",
      stanceLabel: noBuy ? "Nicht kaufen" : "Kein Einkaufsspielraum",
      opening: null,
      target: null,
      walkAway: null,
      profit: { opening: null, target: null, walkAway: null },
    };
  }

  const opening = Math.min(walkAway, Math.max(100, floor100(walkAway * (1 - STANCES[mode].openingDiscount))));
  const target = walkAway - opening < 200
    ? walkAway
    : Math.min(walkAway, round50((opening + walkAway) / 2));

  return {
    stance: mode,
    mode: "STEPS",
    stanceLabel: mode === "SOFT" && askingPrice > walkAway ? "Nachlass nötig" : STANCES[mode].label,
    opening,
    target,
    walkAway,
    profit: { opening: profitAt(opening), target: profitAt(target), walkAway: profitAt(walkAway) },
  };
}
