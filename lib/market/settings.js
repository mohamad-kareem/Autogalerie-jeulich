/**
 * Company settings for the purchase analysis — the values a dealer sets once
 * and every analysis starts from: margin per price class, the yard's location
 * for the pickup, the pickup's cost rates, the sale discount and the default
 * analysis depth.
 *
 * Everything is a starting value. Each car can still be changed in the
 * Kalkulation, and the deep analysis may argue a different margin.
 */

// No imports: the settings window (client side) uses this file too.

export const SETTINGS_DEFAULTS = Object.freeze({
  // Empty = the system's built-in margin per price class.
  profitBands: [],
  origin: { label: "Jülich", postcode: "52428", latitude: 50.9225, longitude: 6.3611 },
  inboundMode: "TRAIN",
  hourlyRate: 12,
  onSiteMinutes: 60,
  fuelLitresPer100Km: 8,
  fuelPricePerLitre: 1.75,
  // Same as POLICY.askingToAchievedFactor (0.965) in config.js.
  saleDiscountPercent: 3.5,
  defaultDepth: "NORMAL",
});

/** The built-in margin per price class, as rows for the settings window. */
export const STANDARD_BAND_ROWS = [
  { upTo: 5000, value: 14, unit: "PERCENT" },
  { upTo: 10000, value: 12, unit: "PERCENT" },
  { upTo: 20000, value: 10, unit: "PERCENT" },
  { upTo: 35000, value: 8, unit: "PERCENT" },
  { upTo: null, value: 7, unit: "PERCENT" },
];

const num = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, number));
};

const euroLabel = (value) => `${Math.round(value).toLocaleString("de-DE")} €`;

/**
 * Rows from the window → stored bands. A row is { upTo, value, unit }:
 * "up to 5.000 € selling price: 800 €" or "…: 12 %". The last row has no upper
 * end ("darüber").
 */
export function rowsToBands(rows) {
  const clean = (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      upTo: row?.upTo === null || row?.upTo === "" || row?.upTo === undefined ? null : num(row.upTo, 1, 10_000_000),
      value: num(row?.value, 0, row?.unit === "PERCENT" ? 100 : 1_000_000),
      unit: row?.unit === "PERCENT" ? "PERCENT" : "EURO",
    }))
    .filter((row) => row.value !== null && row.value > 0);

  const bounded = clean.filter((row) => row.upTo !== null).sort((a, b) => a.upTo - b.upTo);
  const open = clean.find((row) => row.upTo === null);

  const bands = [];
  let from = 0;
  for (const row of bounded) {
    if (row.upTo <= from) continue;
    bands.push({ from, to: row.upTo, ...amountOf(row) });
    from = row.upTo;
  }
  if (open) bands.push({ from, to: null, ...amountOf(open) });
  return bands;
}

function amountOf(row) {
  return row.unit === "PERCENT"
    ? { amount: null, rate: row.value / 100 }
    : { amount: Math.round(row.value), rate: null };
}

/** Stored bands → rows for the window. */
export function bandsToRows(bands) {
  return (Array.isArray(bands) ? bands : []).map((band) => ({
    upTo: band.to ?? null,
    value: band.rate !== null && band.rate !== undefined ? Math.round(band.rate * 1000) / 10 : band.amount,
    unit: band.rate !== null && band.rate !== undefined ? "PERCENT" : "EURO",
  }));
}

/** Stored bands → the shape the calculation reads (profitFromBands). */
export function bandsForCalculation(bands) {
  const list = (Array.isArray(bands) ? bands : []).map((band) => ({
    from: band.from,
    to: band.to === null || band.to === undefined ? Infinity : band.to,
    amount: band.amount ?? null,
    rate: band.rate ?? null,
    label:
      band.to === null || band.to === undefined
        ? `über ${euroLabel(band.from)}`
        : band.from > 0
          ? `${euroLabel(band.from)}–${euroLabel(band.to)}`
          : `bis ${euroLabel(band.to)}`,
  }));
  return list.length ? list : [];
}

/** Anything from the database or a request → complete, valid settings. */
export function normalizeSettings(raw = {}) {
  const d = SETTINGS_DEFAULTS;
  const origin = raw.origin && Number.isFinite(Number(raw.origin.latitude)) && Number.isFinite(Number(raw.origin.longitude))
    ? {
        label: String(raw.origin.label || "").slice(0, 120) || d.origin.label,
        postcode: String(raw.origin.postcode || "").slice(0, 10),
        latitude: Number(raw.origin.latitude),
        longitude: Number(raw.origin.longitude),
      }
    : { ...d.origin };

  return {
    profitBands: Array.isArray(raw.profitBands) ? raw.profitBands : [],
    origin,
    inboundMode: raw.inboundMode === "CAR" ? "CAR" : "TRAIN",
    hourlyRate: num(raw.hourlyRate, 0, 200) ?? d.hourlyRate,
    onSiteMinutes: num(raw.onSiteMinutes, 0, 600) ?? d.onSiteMinutes,
    fuelLitresPer100Km: num(raw.fuelLitresPer100Km, 1, 40) ?? d.fuelLitresPer100Km,
    fuelPricePerLitre: num(raw.fuelPricePerLitre, 0.5, 5) ?? d.fuelPricePerLitre,
    saleDiscountPercent: num(raw.saleDiscountPercent, 0, 30) ?? d.saleDiscountPercent,
    defaultDepth: raw.defaultDepth === "DEEP" ? "DEEP" : "NORMAL",
  };
}
