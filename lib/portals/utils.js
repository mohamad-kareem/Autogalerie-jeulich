/**
 * Small, dependency-free helpers: number/date parsing for German listings,
 * robust statistics and text similarity.
 */

/* ------------------------------------------------------------------ text */

export function cleanText(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&euro;/gi, "€")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Match a complete model name, including spellings such as i30 and i 30. */
export function containsModelName(value, model) {
  const words = (input) => normalizeText(input).replace(/([a-z])(?=\d)/g, "$1 ");
  const name = words(model);
  return Boolean(name) && ` ${words(value)} `.includes(` ${name} `);
}

export function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "-");
}

/* ---------------------------------------------------------------- numbers */

/**
 * Parses numbers out of German formatted strings:
 * "12.500 €" -> 12500, "1.234,56" -> 1234.56, "89 kW (121 PS)" -> 89
 */
export function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return null;

  const raw = String(value);
  const match = raw.match(/-?\d[\d.\s']*(?:,\d+)?|-?\d+(?:\.\d+)?/);
  if (!match) return null;

  let candidate = match[0].replace(/[\s']/g, "");

  if (candidate.includes(",")) {
    // German decimal comma: dots are thousand separators.
    candidate = candidate.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{3}(?:\D|$)/.test(`${candidate} `)) {
    // Dots used as thousand separators (1.234 / 12.500).
    candidate = candidate.replace(/\./g, "");
  }

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : null;
}

export function round(value, decimals = 0) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/* ------------------------------------------------------------- statistics */

/* ------------------------------------------------------------------ dates */

/** Months since year 0 — a simple comparable scale for registration dates. */
const GERMAN_MONTHS = {
  januar: 0, jan: 0, februar: 1, feb: 1, maerz: 2, mrz: 2, april: 3, apr: 3,
  mai: 4, juni: 5, jun: 5, juli: 6, jul: 6, august: 7, aug: 7, september: 8,
  sep: 8, sept: 8, oktober: 9, okt: 9, november: 10, nov: 10, dezember: 11, dez: 11,
};

export function registrationToMonths(value) {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getFullYear() * 12 + value.getMonth();
  }

  const text = cleanText(value);

  // 2019-03 / 2019-03-15 (ISO, used by the mobile.de API)
  let match = text.match(/\b((?:19|20)\d{2})-(0?[1-9]|1[0-2])\b/);
  if (match) return Number(match[1]) * 12 + (Number(match[2]) - 1);

  // 03/2019 · 03.2019 · 3-2019
  match = text.match(/\b(0?[1-9]|1[0-2])[./-]((?:19|20)\d{2})\b/);
  if (match) return Number(match[2]) * 12 + (Number(match[1]) - 1);

  // 15.03.2019
  match = text.match(/\b\d{1,2}\.(0?[1-9]|1[0-2])\.((?:19|20)\d{2})\b/);
  if (match) return Number(match[2]) * 12 + (Number(match[1]) - 1);

  // "April 2024", "Sept. 2026" — how Kleinanzeigen writes EZ and HU.
  match = text.match(
    /\b(januar|februar|m(?:ä|ae)rz|april|mai|juni|juli|august|september|oktober|november|dezember|jan|feb|mrz|apr|jun|jul|aug|sept?|okt|nov|dez)\.?\s+((?:19|20)\d{2})\b/i,
  );
  if (match) {
    const month = GERMAN_MONTHS[match[1].toLowerCase().replace("ä", "ae")];
    if (month !== undefined) return Number(match[2]) * 12 + month;
  }

  // Bare year — assume mid-year so the error is symmetric.
  match = text.match(/\b((?:19|20)\d{2})\b/);
  if (match) return Number(match[1]) * 12 + 5;

  return null;
}

/** Formats a month index back to the MM/YYYY the German market expects. */
export function monthsToRegistration(months) {
  if (!Number.isFinite(months)) return null;
  const year = Math.floor(months / 12);
  const month = Math.floor(months % 12) + 1;
  return `${String(month).padStart(2, "0")}/${year}`;
}

/* ------------------------------------------------------------------ misc */

export function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Walks a parsed JSON tree and collects every node matching `predicate`.
 * Used to survive layout changes on the marketplaces: we look for objects
 * that *look* like a listing instead of relying on a fixed path.
 */
export function deepCollect(root, predicate, limit = 200) {
  const found = [];
  const queue = [root];
  const seen = new Set();

  while (queue.length && found.length < limit) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (!Array.isArray(node)) {
      try {
        if (predicate(node)) {
          found.push(node);
          continue;
        }
      } catch {
        // A predicate that throws simply does not match.
      }
    }

    const children = Array.isArray(node) ? node : Object.values(node);
    for (const child of children) {
      if (child && typeof child === "object") queue.push(child);
    }
  }

  return found;
}

/** First non-null value for any of the given keys, searched case-insensitively. */
export function pick(object, keys) {
  if (!object || typeof object !== "object") return null;
  for (const key of keys) {
    const value = object[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}
