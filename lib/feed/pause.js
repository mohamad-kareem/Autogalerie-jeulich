/**
 * A portal that refuses us (403/429, captcha) is left alone for a while —
 * every further request would only extend the block, and the Marktanalyse uses
 * the same server address. Shared by the feed and its detail lookups.
 */

const COOLDOWN_MS = 5 * 60_000;
const pausedUntil = new Map();

export function pauseRemainingMs(source) {
  return Math.max(0, (pausedUntil.get(source) || 0) - Date.now());
}

export function pauseSource(source) {
  pausedUntil.set(source, Date.now() + COOLDOWN_MS);
}

export function looksRefused(result) {
  return Boolean(result?.blocked) || /\b(403|429)\b|blockiert|captcha/i.test(result?.error || "");
}
