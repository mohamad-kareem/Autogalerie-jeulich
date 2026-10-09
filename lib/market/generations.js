/**
 * Model generations — so a 2015 Mazda2 (DJ) is not priced against a 2014
 * Mazda2 (DE), or a Golf VII against a Golf VI. Same name, different car.
 *
 * The generations come from the Marktwissen answer S01, one line per
 * generation:
 *
 *   Marke | Modell | Generation (Code) | Baujahre | Facelift ab | Wertunterschied
 *   Mazda | 2 | DJ | 2015–2023 | 2019 | …
 *
 * A comparable is only rejected when BOTH cars fall clearly into one
 * generation each, and those differ. A year in which two generations were
 * sold side by side decides nothing — then the car stays in.
 */

import { normalizeText } from "./utils";

const MAKE_ALIASES = {
  vw: "volkswagen",
  "mercedes benz": "mercedes",
  "mercedes-benz": "mercedes",
};

function makeKey(value) {
  const text = normalizeText(value);
  return MAKE_ALIASES[text] || text;
}

function modelKey(value) {
  return normalizeText(value).split(" ")[0] || "";
}

/** S01 answer text → [{ make, model, code, from, to }] */
export function parseGenerations(text) {
  const rows = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const fields = raw.split("|").map((field) => field.trim());
    if (fields.length < 4) continue;
    const [make, model, code, years] = fields;
    const span = String(years).match(/((?:19|20)\d{2})\s*(?:[–-]\s*((?:19|20)\d{2})|(\s*[–-]?\s*(heute|jetzt|$)))?/i);
    const ab = /ab\s*(19|20)\d{2}/i.test(years);
    if (!span) continue;
    const from = Number(span[1]);
    const to = span[2] ? Number(span[2]) : ab || span[3] ? 2100 : from;
    if (!make || !model || !Number.isFinite(from)) continue;
    rows.push({ make: makeKey(make), model: modelKey(model), code: code || "?", from, to });
  }
  return rows;
}

/** The single generation a car of this year belongs to, or null if unclear. */
export function generationFor(generations, make, model, year) {
  if (!generations?.length || !Number.isFinite(year)) return null;
  const mk = makeKey(make);
  const md = modelKey(model);
  if (!mk || !md) return null;
  const matches = generations.filter(
    (entry) => entry.make === mk && entry.model === md && year >= entry.from && year <= entry.to,
  );
  return matches.length === 1 ? matches[0] : null;
}

/** Rejection text when the comparable is from another generation, else null. */
export function generationMismatch(generations, candidate, target) {
  if (!generations?.length) return null;
  const yearOf = (car) =>
    Number.isFinite(car.registrationMonths) ? Math.floor(car.registrationMonths / 12) : null;
  const own = generationFor(generations, target.make, target.model, yearOf(target));
  if (!own) return null;
  const other = generationFor(generations, candidate.make || target.make, candidate.model || target.model, yearOf(candidate));
  if (!other || other.code === own.code) return null;
  return `Andere Modellgeneration (${other.code} statt ${own.code}).`;
}
