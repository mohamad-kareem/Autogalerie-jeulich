/**
 * What is new in a feed answer, compared with what this buyer has seen.
 *
 *   Kleinanzeigen  ad numbers only ever grow, so an ad is new when its number
 *                  is higher than any seen before — an old ad pushed back to
 *                  the top ("hochgeschoben") is not.
 *   AutoScout24 /  lists come newest first: unseen ads above the first known
 *   mobile.de      one are new; unseen ones below it are older ads moving up
 *                  because something above was deleted.
 *
 * Paid placements are never new: they are old ads bought into the top slots.
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
export function detectNew(store, items, now, { answered = null } = {}) {
  const seen = { ...store.seen };
  let kaMaxId = store.kaMaxId || 0;
  const fresh = [];
  const baselineItems = [];
  const baselines = { ...(store.baselines || {}) };

  const bySource = {};
  for (const item of items) (bySource[item.source] ||= []).push(item);
  const sources = new Set([...(answered || Object.keys(bySource))]);

  for (const source of sources) {
    const list = bySource[source] || [];
    const ready = hasBaseline(store, source);

    if (!ready) {
      baselineItems.push(...list.filter((item) => !item.promoted));
    } else if (source === "KLEINANZEIGEN") {
      for (const item of list) {
        if (item.promoted) continue;
        if (!seen[item.key] && item.numericId && item.numericId > kaMaxId) fresh.push(item);
      }
    } else {
      // Newest first: unseen ads above the first known one are new arrivals.
      for (const item of list) {
        if (item.promoted) continue;
        if (seen[item.key]) break;
        fresh.push(item);
      }
    }

    if (source === "KLEINANZEIGEN") {
      const ids = list.filter((item) => !item.promoted && item.numericId).map((item) => item.numericId);
      if (ids.length) kaMaxId = Math.max(kaMaxId, ...ids);
    }
    for (const item of list) if (!seen[item.key]) seen[item.key] = now;
    baselines[source] = true;
  }

  return { fresh, baselineItems, seen: pruneSeen(seen), kaMaxId, baselines };
}
