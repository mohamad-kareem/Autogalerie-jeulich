/**
 * The dealer's own minimum profit per selling price (Expertenwissen A01),
 * read from his free-text answer, e.g.
 *
 *   VK unter 1.500 €: 800 €
 *   VK 1500-4000 €: 1500 €
 *   VK 4.000–8.000 €: 2.000 €
 *   VK über 20.000 €: 18 %
 *
 * These are Richtwerte: the calculation starts from them, and the deep
 * analysis may argue a different figure for a particular car.
 */

const number = (raw) => {
  const text = String(raw || "").replace(/\s/g, "");
  if (!text) return null;
  // German thousands dot ("1.500") or plain ("1500"); a decimal comma for %.
  const value = Number(text.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

const NUM = "(\\d{1,3}(?:[.\\s]\\d{3})+|\\d+(?:,\\d+)?)";

/** @returns {{from:number,to:number,amount:number|null,rate:number|null,label:string}[]} */
export function parseProfitBands(text) {
  const bands = [];
  for (const rawLine of String(text || "").split(/\n|;/)) {
    const line = rawLine.replace(/[–—]/g, "-").trim();
    if (!line) continue;
    const [left, right] = line.split(/:(.*)/s);
    if (!right) continue;

    let from = null;
    let to = null;
    let match;
    if ((match = left.match(new RegExp(`(?:unter|bis|<)\\s*${NUM}`, "i")))) {
      from = 0;
      to = number(match[1]);
    } else if ((match = left.match(new RegExp(`(?:über|ueber|ab|>)\\s*${NUM}`, "i")))) {
      from = number(match[1]);
      to = Infinity;
    } else if ((match = left.match(new RegExp(`${NUM}\\s*€?\\s*-\\s*${NUM}`)))) {
      from = number(match[1]);
      to = number(match[2]);
    }
    if (from === null || to === null || !(to > from)) continue;

    const value = right.match(new RegExp(`${NUM}\\s*(%|€|eur)?`, "i"));
    if (!value) continue;
    const amount = number(value[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const isRate = value[2] === "%";

    bands.push({
      from,
      to,
      amount: isRate ? null : Math.round(amount),
      rate: isRate ? amount / 100 : null,
      label: left.replace(/^\s*vk\s*/i, "").trim(),
    });
  }
  bands.sort((a, b) => a.from - b.from);
  return bands.length >= 2 ? bands : [];
}

/** Minimum profit for a selling price from the bands, or null. */
export function profitFromBands(bands, sellingPrice) {
  if (!Array.isArray(bands) || !bands.length || !Number.isFinite(sellingPrice)) return null;
  const band =
    bands.find((entry) => sellingPrice >= entry.from && sellingPrice < entry.to) ||
    (sellingPrice < bands[0].from ? bands[0] : bands[bands.length - 1]);
  const value = band.rate !== null ? sellingPrice * band.rate : band.amount;
  return Number.isFinite(value) ? { amount: Math.round(value / 50) * 50, band } : null;
}
