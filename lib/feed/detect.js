/**
 * What is new in a feed answer, compared with what this buyer has seen.
 *
 * Portal ranking and ad IDs do not prove publication order. Every unseen
 * organic result on a live check is newly discovered, even below known ads.
 * Older pages and paid placements stay visible without a new-arrival alert.
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

/**
 * Which of the ads in this answer are new since the baseline.
 * Mutates nothing; returns the new ones, the ones that form a portal's
 * baseline right now, and the updated memory.
 *
 * Each portal has its own baseline: portals answer separately, and the first
 * answer of a portal is what was already online there — never "new".
 * `answered` lists the portals that answered properly (also with zero hits);
 * only those get a baseline.
 */
export function detectNew(store, items, now, { answered = null, scope = null, backfill = false } = {}) {
  const seen = { ...store.seen };
  let kaMaxId = store.kaMaxId || 0;
  const fresh = [];
  const baselineItems = [];
  const otherItems = [];
  const baselines = { ...(store.baselines || {}) };
  const watermarks = { ...(store.watermarks || {}) };

  const bySource = {};
  for (const item of items) (bySource[item.source] ||= []).push(item);
  const sources = new Set([...(answered || Object.keys(bySource))]);

  for (const source of sources) {
    const list = bySource[source] || [];
    // Keep separate baselines for independently completing search combinations.
    // Legacy ID watermarks remain compatible with stored data, but never filter.
    const baselineKey = scope || source;
    const ready = scope ? Boolean(baselines[baselineKey]) : hasBaseline(store, source);
    const maximumId = scope ? (watermarks[scope] || 0) : kaMaxId;

    for (const item of list) {
      if (!ready && !backfill) baselineItems.push(item);
      else if (!backfill && !item.promoted && !seen[item.key]) fresh.push(item);
      else otherItems.push(item);
    }

    if (source === "KLEINANZEIGEN") {
      const ids = list.filter((item) => !item.promoted && item.numericId).map((item) => item.numericId);
      if (ids.length) {
        kaMaxId = Math.max(kaMaxId, ...ids);
        if (scope) watermarks[scope] = Math.max(maximumId, ...ids);
      }
    }
    for (const item of list) if (!seen[item.key]) seen[item.key] = now;
    if (!backfill) baselines[baselineKey] = true;
  }

  return { fresh, baselineItems, otherItems, seen: pruneSeen(seen), kaMaxId, baselines, watermarks };
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
    byKey.set(item.key, old
      ? { ...old, ...item, isNew: old.isNew, firstSeenAt: old.firstSeenAt }
      : { ...item, isNew: false, firstSeenAt: atIso });
  }
  return { feed: [...byKey.values()], arrivals };
}
