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

/**
 * Which of the ads in this answer are new since the baseline.
 * Mutates nothing; returns the new ones and the updated memory.
 */
export function detectNew(store, items, now) {
  const seen = { ...store.seen };
  let kaMaxId = store.kaMaxId || 0;
  const fresh = [];

  const bySource = {};
  for (const item of items) (bySource[item.source] ||= []).push(item);

  for (const [source, list] of Object.entries(bySource)) {
    if (source === "KLEINANZEIGEN") {
      for (const item of list) {
        if (!store.baselineDone || item.promoted) continue;
        if (!seen[item.key] && item.numericId && item.numericId > kaMaxId) fresh.push(item);
      }
      const ids = list.filter((item) => !item.promoted && item.numericId).map((item) => item.numericId);
      if (ids.length) kaMaxId = Math.max(kaMaxId, ...ids);
    } else if (store.baselineDone) {
      // Newest first: unseen ads above the first known one are new arrivals.
      for (const item of list) {
        if (item.promoted) continue;
        if (seen[item.key]) break;
        fresh.push(item);
      }
    }
    for (const item of list) if (!seen[item.key]) seen[item.key] = now;
  }

  return { fresh, seen: pruneSeen(seen), kaMaxId };
}

