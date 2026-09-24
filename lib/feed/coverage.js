/** Catch up behind the newest page without making it wait for older pages.
 * The first second-page scan records existing stock silently. Later scans
 * continue until they meet previously seen organic ads or the portal ends.
 */
export function createCoverage(baseline = true) {
  return { page: 2, baseline, dueAt: 0, failures: 0, warning: null };
}

export function advanceCoverage(state, { ok, hasMore, overlap, retryAfterMs = 0 }, now = Date.now()) {
  if (!ok) return { ...state, failures: state.failures + 1,
    dueAt: now + Math.max(retryAfterMs, Math.min(60_000, 3000 * 2 ** state.failures)),
    warning: "Nachprüfung noch unvollständig – wird wiederholt." };
  // Startup covers two pages. Ordinary scans extend through a burst instead
  // of silently dropping everything that overflowed the first results page.
  const more = hasMore && !overlap && !state.baseline;
  if (!state.baseline && !overlap && state.page >= 200) return { ...state, page: 2, failures: 0, dueAt: now + 10_000,
    warning: "Portal-Seitenlimit erreicht; vollständige Abdeckung nicht bestätigt." };
  return { ...state, page: more ? state.page + 1 : 2, baseline: false, failures: 0,
    dueAt: now + Math.max(more ? 1500 : 10_000, (state.recoveryIntervalMs || 0) * 4),
    warning: more ? "Weitere neue Treffer werden nachgeladen …" : null };
}
