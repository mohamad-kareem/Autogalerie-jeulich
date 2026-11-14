/**
 * What is new in a feed answer, compared with what this buyer has seen.
 *
 * Discovery alone does not establish freshness: an ad the page has not seen
 * before is often simply an old ad it had not been shown yet.
 */

const MAX_SEEN = 4_000;

/** Keeps the "seen" map from growing without end: oldest entries go first. */
function pruneSeen(seen) {
  const entries = Object.entries(seen);
  if (entries.length <= MAX_SEEN) return seen;
  entries.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(entries.slice(0, MAX_SEEN));
}

/** Whether a portal's baseline — what was online at the start — is taken. */
export function hasBaseline(store, source) {
  if (store.baselines) return Boolean(store.baselines[source]);
  // Memory from before portals were checked one by one.
  return Boolean(store.baselineDone);
}

// A car counts as "just arrived" only while it is young. Anything older was
// online long before this search could have seen it — never an arrival alert.
export const MAX_ARRIVAL_AGE_MS = 20 * 60_000;

/**
 * Which of the ads in this answer are new since the baseline.
 * Mutates nothing; returns the new ones, the ones that form a portal's
 * baseline right now, and the updated memory.
 *
 * Each portal (or Kleinanzeigen search combination, `scope`) has its own
 * baseline: its first answer in a session is what was already online there —
 * never "new". `answered` lists the portals that answered properly (also with
 * zero hits); only those get a baseline.
 *
 * What counts as new, per portal:
 *   Kleinanzeigen  ad numbers only ever grow: an ad is new when its number is
 *                  above everything seen at the baseline and it was posted in
 *                  the last 20 minutes. Old ads pushed back to the top keep
 *                  their old number and never count.
 *   AutoScout24 /  lists come newest first: only unseen ads *above* the first
 *   mobile.de      already-known one are new. Unseen ads further down are
 *                  older ads moving up because others were deleted or sold —
 *                  that is where "5 hours old" cards came from.
 * Paid placements are never new.
 */
export function detectNew(store, items, now, { answered = null, scope = null, backfill = false, partial = false } = {}) {
  const seen = { ...store.seen };
  let kaMaxId = store.kaMaxId || 0;
  const fresh = [];
  const baselineItems = [];
  const otherItems = [];
  const baselines = { ...(store.baselines || {}) };
  const watermarks = { ...(store.watermarks || {}) };
  const freshness = { ...(store.freshness || {}) };

  const bySource = {};
  for (const item of items) (bySource[item.source] ||= []).push(item);
  const sources = new Set([...(answered || Object.keys(bySource))]);

  const young = (item) => {
    const published = Date.parse(item.postedAt);
    // Undated cards (AutoScout24 lists) rely on their position instead.
    if (!Number.isFinite(published)) return true;
    return published <= now + 60_000 && now - published <= MAX_ARRIVAL_AGE_MS;
  };

  for (const source of sources) {
    const list = bySource[source] || [];
    const baselineKey = scope || source;
    const ready = scope ? Boolean(baselines[baselineKey]) : hasBaseline(store, source);
    const maximumId = scope ? (watermarks[scope] || 0) : kaMaxId;
    const anchor = { ...(freshness[baselineKey] || { since: store.startedAt ?? now, minimumId: maximumId }) };

    // Kleinanzeigen: the floor is the highest ad number of the baseline answer.
    // It is frozen once that answer is complete.
    if (!ready && !backfill && source === "KLEINANZEIGEN") {
      anchor.minimumId = Math.max(anchor.minimumId, ...list
        .filter((item) => !item.promoted && Number.isFinite(item.numericId))
        .map((item) => item.numericId));
    }
    if (!backfill) freshness[baselineKey] = { ...anchor };

    if (!ready || backfill) {
      for (const item of list) (backfill ? otherItems : baselineItems).push(item);
    } else if (source === "KLEINANZEIGEN") {
      for (const item of list) {
        const eligible = !item.promoted && !seen[item.key] && young(item) &&
          Number.isFinite(item.numericId) && item.numericId > anchor.minimumId;
        (eligible ? fresh : otherItems).push(item);
      }
    } else {
      // Newest first: stop at the first ad already known.
      let reachedKnown = false;
      for (const item of list) {
        if (item.promoted) { otherItems.push(item); continue; }
        if (seen[item.key]) reachedKnown = true;
        const eligible = !reachedKnown && young(item);
        (eligible ? fresh : otherItems).push(item);
      }
    }

    if (source === "KLEINANZEIGEN") {
      const ids = list.filter((item) => !item.promoted && item.numericId).map((item) => item.numericId);
      if (ids.length) {
        kaMaxId = Math.max(kaMaxId, ...ids);
        if (scope) watermarks[scope] = Math.max(maximumId, ...ids);
      }
    }
    for (const item of list) if (!seen[item.key]) seen[item.key] = now;
    if (!backfill && !partial) baselines[baselineKey] = true;
  }

  return { fresh, baselineItems, otherItems, seen: pruneSeen(seen), kaMaxId, baselines, watermarks, freshness };
}

/**
 * A new session for one filter: after the page was closed or the tab slept,
 * whatever went online meanwhile is not "just arrived" any more. The next
 * answer of each portal becomes a fresh, silent baseline. The cards already
 * found stay; the list of known ads stays, so nothing is announced twice.
 */
export function startSession(store, now = Date.now()) {
  return {
    ...store,
    startedAt: now,
    baselineDone: false,
    baselines: {},
    freshness: {},
    watermarks: {},
    kaMaxId: 0,
    feed: store.feed || [],
  };
}

/** Keep every returned match, including ones older versions silently discarded.
 * Refresh price/specs of known ads without losing their loaded details/history.
 */
export function mergeFeed(previous, items, fresh, atIso) {
  const known = new Set(previous.map((item) => item.key));
  const arrivals = fresh.filter((item) => !known.has(item.key))
    .map((item) => ({ ...item, isNew: true, firstSeenAt: atIso }));
  const byKey = new Map([...arrivals, ...previous].map((item) => [item.key, item]));
  for (const item of items) {
    const old = byKey.get(item.key);
    if (old && Object.entries(item).every(([key, value]) => old[key] === value ||
      (value !== null && typeof value === "object" && JSON.stringify(old[key]) === JSON.stringify(value)))) continue;
    byKey.set(item.key, old
      ? { ...old, ...item, isNew: old.isNew, firstSeenAt: old.firstSeenAt }
      : { ...item, isNew: false, firstSeenAt: atIso });
  }
  const next = [...byKey.values()];
  return { feed: next.length === previous.length && next.every((item, index) => item === previous[index]) ? previous : next, arrivals };
}
