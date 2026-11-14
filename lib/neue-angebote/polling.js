/** A refresh prediction may bring a check forward, never postpone live polling.
 * Only an explicit portal refusal warrants a long cooldown.
 */
export function nextCheckDelay({ intervalMs, elapsedMs = 0, failures = 0, retryAfterMs = 0, preferredDelayMs, recoveryIntervalMs = 0 } = {}) {
  if (retryAfterMs > 0) return Math.max(1_500, retryAfterMs);
  if (failures > 0) return Math.min(60_000, Math.max(3_000, intervalMs) * 2 ** Math.min(failures - 1, 5));
  if (recoveryIntervalMs > 0) return Math.max(1_500, Math.max(intervalMs, recoveryIntervalMs) - elapsedMs);
  const regular = Math.max(1_500, intervalMs - elapsedMs);
  return Number.isFinite(preferredDelayMs) ? Math.max(1_500, Math.min(regular, preferredDelayMs)) : regular;
}
