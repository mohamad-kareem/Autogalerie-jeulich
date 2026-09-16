/**
 * The live calculation — the figures the user can still change after an
 * analysis has run: the negotiated price, refurbishment, the target profit and
 * each leg of the pickup trip.
 *
 * It lives beside the server maths rather than inside the page so the two can
 * be tested against one another. They use the same formulas; if they ever drift
 * apart, the ledger and the sticky strip start telling the buyer different
 * things about the same car.
 */

export const round50 = (value) => Math.round(value / 50) * 50;

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function recalculate(result, adjust) {
  const dealer = result?.dealer;
  if (!dealer?.available) return null;

  const pickup = dealer.pickup;

  const totalMinutes = pickup?.available
    ? toNumber(adjust.inbound) + toNumber(adjust.onSite) + (pickup.returnMinutes || 0)
    : 0;
  const labourCost = pickup?.available
    ? Math.round((totalMinutes / 60) * (pickup.hourlyRate || 0))
    : 0;
  const pickupCost = pickup?.available
    ? labourCost + toNumber(adjust.fuel) + toNumber(adjust.ticket)
    : 0;

  const refurbishment = Math.max(0, toNumber(adjust.refurbishment));
  const targetProfit = Math.max(0, toNumber(adjust.profit));

  // The advertised price stays on record; the negotiated one, once there is
  // one, is what the whole calculation runs on.
  const listPrice = Number.isFinite(dealer.listPrice)
    ? dealer.listPrice
    : Number.isFinite(result.target.price)
      ? result.target.price
      : null;

  const typed = Number(adjust.negotiated);
  const negotiated = Number.isFinite(typed) && typed > 0 ? Math.round(typed) : null;
  const askingPrice = negotiated ?? listPrice;

  const limit = round50(dealer.sellingPrice - pickupCost - refurbishment - targetProfit);

  const expected =
    askingPrice === null
      ? null
      : Math.round(dealer.sellingPrice - askingPrice - pickupCost - refurbishment);

  // Rounded to 10 €, exactly as the server does it — a discount quoted to the
  // euro would only pretend to a precision this calculation does not have.
  const discount =
    askingPrice !== null && askingPrice > limit
      ? Math.round((askingPrice - limit) / 10) * 10
      : 0;

  return {
    totalMinutes,
    labourCost,
    pickupCost,
    refurbishment,
    targetProfit,

    listPrice,
    negotiated,
    askingPrice,
    savings: negotiated !== null && listPrice !== null ? listPrice - negotiated : 0,

    limit,
    expected,
    discount,
    verdict: liveVerdict(result, limit, askingPrice),
  };
}

/**
 * Mirrors determineVerdict on the server, so the badge follows the edits
 * instead of freezing on whatever the first run decided.
 *
 * Data quality is not re-judged here — only the price against the limit. If the
 * server said the sample was too thin, no amount of haggling changes that.
 */
export function liveVerdict(result, limit, askingPrice) {
  if (result.verdict === "INSUFFICIENT_DATA") return "INSUFFICIENT_DATA";
  if (!Number.isFinite(limit) || limit <= 0 || askingPrice === null) return "TOO_EXPENSIVE";

  if (askingPrice <= limit * 0.9) return "EXCELLENT";
  if (askingPrice <= limit) return "GOOD";
  if (askingPrice <= limit * 1.1) return "NEGOTIABLE";
  return "TOO_EXPENSIVE";
}

/** The editable figures, as the server first delivered them. */
export function initialAdjust(result) {
  const dealer = result?.dealer;
  const pickup = dealer?.pickup;

  return {
    negotiated: dealer?.negotiatedPrice ?? "",
    refurbishment: dealer?.refurbishmentCost ?? 0,
    profit: dealer?.targetProfit ?? 0,
    inbound: pickup?.inboundMinutes ?? 0,
    onSite: pickup?.onSiteMinutes ?? 60,
    ticket: pickup?.ticketCost ?? 0,
    fuel: pickup?.fuelCost ?? 0,
  };
}
