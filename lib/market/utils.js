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

export function tokenSet(value, minLength = 2) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length >= minLength),
  );
}

/** Sørensen–Dice coefficient over word tokens, 0..1. */
export function tokenSimilarity(a, b) {
  const first = tokenSet(a);
  const second = tokenSet(b);
  if (!first.size || !second.size) return 0;
  let shared = 0;
  for (const token of first) if (second.has(token)) shared += 1;
  return (2 * shared) / (first.size + second.size);
}

/** True when one normalised string contains the other (or they are equal). */
export function textMatches(a, b) {
  const first = normalizeText(a);
  const second = normalizeText(b);
  if (!first || !second) return false;
  return first === second || first.includes(second) || second.includes(first);
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

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function roundTo(value, step = 50) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value / step) * step;
}

export function round(value, decimals = 0) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function finite(values) {
  return values.filter((value) => Number.isFinite(value));
}

/* ------------------------------------------------------------- statistics */

export function mean(values) {
  const usable = finite(values);
  if (!usable.length) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

export function median(values) {
  const usable = finite(values).sort((a, b) => a - b);
  if (!usable.length) return null;
  const middle = Math.floor(usable.length / 2);
  return usable.length % 2
    ? usable[middle]
    : (usable[middle - 1] + usable[middle]) / 2;
}

export function percentile(values, share) {
  const usable = finite(values).sort((a, b) => a - b);
  if (!usable.length) return null;
  const position = (usable.length - 1) * share;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return usable[lower];
  return usable[lower] + (usable[upper] - usable[lower]) * (position - lower);
}

export function weightedMean(entries) {
  const usable = entries.filter(
    (entry) =>
      Number.isFinite(entry.value) &&
      Number.isFinite(entry.weight) &&
      entry.weight > 0,
  );
  if (!usable.length) return null;
  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  return (
    usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0) /
    totalWeight
  );
}

/** Weighted median — robust against a single very cheap or very expensive ad. */
export function weightedMedian(entries) {
  const usable = entries
    .filter(
      (entry) =>
        Number.isFinite(entry.value) &&
        Number.isFinite(entry.weight) &&
        entry.weight > 0,
    )
    .sort((a, b) => a.value - b.value);
  if (!usable.length) return null;

  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  let running = 0;
  for (const entry of usable) {
    running += entry.weight;
    if (running >= totalWeight / 2) return entry.value;
  }
  return usable[usable.length - 1].value;
}

export function standardDeviation(values) {
  const usable = finite(values);
  if (usable.length < 2) return null;
  const average = mean(usable);
  const variance =
    usable.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (usable.length - 1);
  return Math.sqrt(variance);
}

/**
 * Outlier bounds for a price sample.
 *
 * A plain Tukey fence is wrong for cheap used cars. A real sample of
 * 350 / 500 / 950 / 1.150 / 1.350 / 2.400 € produces an upper fence of ~2.360,
 * which discards the 2.400 € car — the only one in decent condition — while
 * keeping the two scrap cars that drag the average down. The fence must not
 * cut the healthy end of a skewed sample.
 *
 * So the bounds are taken around the MEDIAN, which a couple of scrap prices
 * cannot move, and the fence is asymmetric: generous upwards (a well-kept car
 * legitimately fetches far more) and firm downwards (a car at a third of the
 * median is damaged, not a bargain).
 */
export function outlierBounds(values) {
  const usable = finite(values);
  if (usable.length < 4) return { lower: -Infinity, upper: Infinity };

  const middle = median(usable);
  if (!Number.isFinite(middle) || middle <= 0) {
    return { lower: -Infinity, upper: Infinity };
  }

  const q1 = percentile(usable, 0.25);
  const q3 = percentile(usable, 0.75);
  const iqr = Number.isFinite(q1) && Number.isFinite(q3) ? q3 - q1 : 0;

  // Median-relative fence: 45% to 260% of the median.
  const relativeLower = middle * 0.45;
  const relativeUpper = middle * 2.6;

  // With a large, well-behaved sample the interquartile fence is tighter and
  // better, so take whichever is stricter — but never cut above the median.
  const tukeyLower = iqr > 0 ? q1 - 1.5 * iqr : -Infinity;
  const tukeyUpper = iqr > 0 ? q3 + 1.5 * iqr : Infinity;

  return {
    lower: Math.max(relativeLower, tukeyLower),
    upper:
      usable.length >= 8
        ? Math.min(relativeUpper, Math.max(tukeyUpper, middle * 1.6))
        : relativeUpper,
  };
}

/**
 * How far apart the sample is, as the ratio between the dearest and cheapest.
 * A ratio above roughly 3 means the "comparables" are not comparable, and no
 * average of them deserves to be presented as a market value.
 */
export function dispersionRatio(values) {
  const usable = finite(values).filter((value) => value > 0);
  if (usable.length < 2) return 1;
  return Math.max(...usable) / Math.min(...usable);
}

/* ------------------------------------------------------------------ dates */

/** Months since year 0 — a simple comparable scale for registration dates. */
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

export function currentMonths() {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

/** Age in years, one decimal. */
export function vehicleAgeYears(registrationMonths) {
  if (!Number.isFinite(registrationMonths)) return null;
  return round((currentMonths() - registrationMonths) / 12, 1);
}

/* ------------------------------------------------------------------ misc */

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

/** Resolves to `fallback` instead of rejecting, and never hangs. */
export async function settleWithTimeout(promise, timeoutMs, fallback) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(promise).catch(() => fallback),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

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
