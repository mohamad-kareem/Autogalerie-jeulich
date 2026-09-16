/**
 * Politeness controls for portal requests.
 *
 * The 403 from mobile.de was earned: the same ad was requested many times in a
 * few minutes, first by plain HTTP, then with retries, then again by a real
 * browser. A WAF reads that as a scraper and blocks the IP — and once blocked,
 * every further attempt both fails and extends the block.
 *
 * So three rules:
 *   1. a minimum gap between requests to the same host,
 *   2. a cooldown after a refusal, during which we do not touch that host,
 *   3. a short cache, so re-analysing the same ad costs no request at all.
 */

const MIN_GAP_MS = 2_500;
const COOLDOWN_MS = 10 * 60_000;
const CACHE_TTL_MS = 15 * 60_000;
const MAX_CACHE_ENTRIES = 40;

const lastRequestAt = new Map();
const blockedUntil = new Map();
const pageCache = new Map();

function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return String(url);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Is this host currently in a cooldown, and for how much longer? */
export function cooldownRemaining(url) {
  const until = blockedUntil.get(hostOf(url));
  if (!until) return 0;
  const remaining = until - Date.now();
  if (remaining <= 0) {
    blockedUntil.delete(hostOf(url));
    return 0;
  }
  return remaining;
}

/** Records a refusal, starting the cooldown for that host. */
export function noteRefusal(url) {
  blockedUntil.set(hostOf(url), Date.now() + COOLDOWN_MS);
}

/** Clears the cooldown after a success. */
export function noteSuccess(url) {
  blockedUntil.delete(hostOf(url));
}

/** Waits just long enough that requests to one host stay decently spaced. */
export async function pace(url) {
  const host = hostOf(url);
  const last = lastRequestAt.get(host) || 0;
  const wait = last + MIN_GAP_MS - Date.now();

  if (wait > 0) await sleep(wait);
  lastRequestAt.set(host, Date.now());
}

export function readCache(url) {
  const entry = pageCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    pageCache.delete(url);
    return null;
  }
  return entry.html;
}

export function writeCache(url, html) {
  if (!html || html.length < 2_000) return;

  if (pageCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = [...pageCache.entries()].sort(
      (a, b) => a[1].storedAt - b[1].storedAt,
    )[0];
    if (oldest) pageCache.delete(oldest[0]);
  }

  pageCache.set(url, { html, storedAt: Date.now() });
}

/** Minutes, rounded up — for telling the user when to try again. */
export function minutesRemaining(ms) {
  return Math.max(1, Math.ceil(ms / 60_000));
}
