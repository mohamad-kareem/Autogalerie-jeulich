/**
 * A portal that refuses us (403/429, captcha) is left alone for a while —
 * repeated failures increase the delay. Search and detail routes use separate
 * keys; detail lookups also respect an active search refusal.
 */

const pausedUntil = new Map();
const failures = new Map();

export function pauseRemainingMs(source) {
  return Math.max(0, (pausedUntil.get(source) || 0) - Date.now());
}

export function pauseSource(source, result = {}) {
  // Concurrent failures must not extend a pause already in effect.
  if (pauseRemainingMs(source) > 0) {
    pausedUntil.set(source, Math.max(pausedUntil.get(source), Date.now() + (Number(result.retryAfterMs) || 0)));
    return;
  }
  const count = (failures.get(source) || 0) + 1;
  failures.set(source, count);
  const delay = Math.max(Number(result.retryAfterMs) || 0,
    Math.min(300_000, 30_000 * 2 ** Math.min(count - 1, 4)));
  pausedUntil.set(source, Date.now() + delay);
}

export function resumeSource(source) {
  // A concurrent successful request must not erase a newer refusal.
  if (pauseRemainingMs(source) > 0) return;
  failures.delete(source);
  pausedUntil.delete(source);
}

export function looksRefused(result) {
  return Boolean(result?.blocked) || /\b(403|429)\b|blockiert|captcha/i.test(result?.error || "");
}
