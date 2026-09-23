/**
 * Filters for the new-listings feed ("Neue Angebote").
 *
 * One shape, shared by the page and the server: general ranges — price,
 * kilometres, first registration, power — plus fuel, gearbox, body type,
 * seller and an optional make. Every portal gets the same filter translated
 * into its own URL (see sources.js).
 *
 * Pure and dependency-free so the page can import it too.
 */

export const FUELS = [
  { id: "PETROL", label: "Benzin" },
  { id: "DIESEL", label: "Diesel" },
  { id: "HYBRID", label: "Hybrid" },
  { id: "ELECTRIC", label: "Elektro" },
  { id: "LPG", label: "Autogas" },
];

export const GEARBOXES = [
  { id: "ANY", label: "Egal" },
  { id: "MANUAL", label: "Schaltgetriebe" },
  { id: "AUTOMATIC", label: "Automatik" },
];

export const BODIES = [
  { id: "SMALL", label: "Kleinwagen" },
  { id: "SEDAN", label: "Limousine" },
  { id: "ESTATE", label: "Kombi" },
  { id: "SUV", label: "SUV / Geländewagen" },
  { id: "VAN", label: "Van / Bus" },
  { id: "COUPE", label: "Coupé" },
  { id: "CABRIO", label: "Cabrio" },
  { id: "TRANSPORTER", label: "Transporter" },
];

export const SELLERS = [
  { id: "ALL", label: "Alle" },
  { id: "PRIVATE", label: "Nur privat" },
  { id: "DEALER", label: "Nur Händler" },
];

export const SOURCES = [
  { id: "AUTOSCOUT24", label: "AutoScout24", short: "AS24" },
  { id: "KLEINANZEIGEN", label: "Kleinanzeigen", short: "Klein." },
  { id: "MOBILE_DE", label: "mobile.de", short: "mobile" },
];

// Radii both AutoScout24 and Kleinanzeigen accept as they are.
export const RADII = [20, 50, 100, 150, 200];

export const DEFAULT_FILTERS = Object.freeze({
  priceMin: "",
  priceMax: "",
  kmMin: "",
  kmMax: "",
  yearMin: "",
  yearMax: "",
  powerMin: "",
  powerMax: "",
  fuels: [],
  gearbox: "ANY",
  bodies: [],
  make: "",
  seller: "ALL",
  zip: "",
  // 0 = ganz Deutschland; otherwise a radius in km around the postcode.
  radius: 0,
  hideDamaged: true,
  sources: ["AUTOSCOUT24", "KLEINANZEIGEN", "MOBILE_DE"],
});

const int = (value, min, max) => {
  const number = Math.round(Number(String(value ?? "").replace(/[^\d]/g, "")));
  if (!Number.isFinite(number) || String(value ?? "").trim() === "") return null;
  return Math.min(max, Math.max(min, number));
};

const pickList = (value, allowed) =>
  Array.isArray(value) ? [...new Set(value.filter((entry) => allowed.includes(entry)))] : [];

/**
 * Cleans whatever arrives (form state, localStorage, a request body) into
 * numbers or null. Swapped min/max pairs are put right instead of refused.
 */
export function normalizeFilters(input = {}) {
  const pair = (a, b) => (a !== null && b !== null && a > b ? [b, a] : [a, b]);

  const [priceMin, priceMax] = pair(int(input.priceMin, 0, 2_000_000), int(input.priceMax, 0, 2_000_000));
  const [kmMin, kmMax] = pair(int(input.kmMin, 0, 2_000_000), int(input.kmMax, 0, 2_000_000));
  const [yearMin, yearMax] = pair(int(input.yearMin, 1950, 2100), int(input.yearMax, 1950, 2100));
  const [powerMin, powerMax] = pair(int(input.powerMin, 0, 2_000), int(input.powerMax, 0, 2_000));

  // "Ganz Deutschland" (radius 0) ignores the postcode; a radius without a
  // complete postcode is also all of Germany — there is nothing to measure from.
  const radius = RADII.includes(Number(input.radius)) ? Number(input.radius) : 0;
  const typedZip = String(input.zip ?? "").replace(/\D/g, "").slice(0, 5);
  const zip = radius > 0 && typedZip.length === 5 ? typedZip : "";

  const sources = pickList(input.sources, SOURCES.map((source) => source.id));

  return {
    priceMin,
    priceMax,
    kmMin,
    kmMax,
    yearMin,
    yearMax,
    powerMin,
    powerMax,
    fuels: pickList(input.fuels, FUELS.map((fuel) => fuel.id)),
    gearbox: GEARBOXES.some((entry) => entry.id === input.gearbox) ? input.gearbox : "ANY",
    bodies: pickList(input.bodies, BODIES.map((body) => body.id)),
    make: String(input.make ?? "").trim().slice(0, 40),
    seller: SELLERS.some((entry) => entry.id === input.seller) ? input.seller : "ALL",
    zip,
    radius: zip ? radius : 0,
    hideDamaged: input.hideDamaged !== false,
    sources: sources.length ? sources : ["AUTOSCOUT24", "KLEINANZEIGEN"],
  };
}

/**
 * A short, stable name for a filter set. The page keeps "already seen" per
 * filter, so changing the filter starts a fresh baseline instead of flooding
 * the feed with everything that was online all along.
 */
export function filterKey(filters) {
  const f = normalizeFilters(filters);
  const text = JSON.stringify([
    f.priceMin, f.priceMax, f.kmMin, f.kmMax, f.yearMin, f.yearMax, f.powerMin, f.powerMax,
    f.fuels.slice().sort(), f.gearbox, f.bodies.slice().sort(), f.make.toLowerCase(),
    f.seller, f.zip, f.radius, f.hideDamaged,
  ]);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

/** One line for the header: "1.000–8.000 € · bis 180.000 km · EZ 2010–2018 …". */
export function describeFilters(filters) {
  const f = normalizeFilters(filters);
  const n = (value) => value.toLocaleString("de-DE");
  const range = (min, max, unit, prefix = "") => {
    if (min === null && max === null) return null;
    if (min !== null && max !== null) return `${prefix}${n(min)}–${n(max)}${unit}`;
    return min !== null ? `${prefix}ab ${n(min)}${unit}` : `${prefix}bis ${n(max)}${unit}`;
  };
  const years = (min, max) => {
    if (min === null && max === null) return null;
    if (min !== null && max !== null) return `EZ ${min}–${max}`;
    return min !== null ? `EZ ab ${min}` : `EZ bis ${max}`;
  };

  return [
    f.make || null,
    range(f.priceMin, f.priceMax, " €"),
    range(f.kmMin, f.kmMax, " km"),
    years(f.yearMin, f.yearMax),
    range(f.powerMin, f.powerMax, " PS"),
    f.fuels.length ? f.fuels.map((id) => FUELS.find((fuel) => fuel.id === id)?.label).join("/") : null,
    f.gearbox !== "ANY" ? GEARBOXES.find((entry) => entry.id === f.gearbox)?.label : null,
    f.bodies.length ? f.bodies.map((id) => BODIES.find((body) => body.id === id)?.label).join("/") : null,
    f.seller !== "ALL" ? SELLERS.find((entry) => entry.id === f.seller)?.label : null,
    f.zip ? `${f.radius} km um ${f.zip}` : "ganz Deutschland",
  ]
    .filter(Boolean)
    .join(" · ");
}
