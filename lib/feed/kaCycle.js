/**
 * Kleinanzeigen's website search is rebuilt every two minutes.
 *
 * Measured on 24.09.2026 against the live site (polling every 1–5 s): new
 * ads appear all at once, at every even minute (UTC) plus about 22–24
 * seconds, and nothing changes in between. An ad placed at 15:46:15 is
 * therefore invisible on the website until the next rebuild — up to two
 * minutes later — however often the page is asked.
 *
 * So Kleinanzeigen is asked right as a rebuild lands, a few times in quick
 * succession, and then left alone until the next one: new cars show up within
 * about two seconds of becoming visible at all, with a quarter of the
 * requests that asking every 5 seconds would cost.
 *
 * All times here are server time (ms). The page converts with its measured
 * clock offset, because a PC clock can be several seconds off.
 */

export const KA_CYCLE_MS = 120_000;
// Where in the two-minute cycle a rebuild becomes visible (measured 22–24 s).
export const KA_DEFAULT_LANDING_MS = 22_000;
// Checks after the expected landing: close together first, then wider.
const BURST_MS = [0, 2_000, 4_000, 8_000, 18_000, 38_000];
// One check mid-cycle, to notice if Kleinanzeigen ever changes its timing.
const WATCH_MS = 73_000;

const mod = (value) => ((value % KA_CYCLE_MS) + KA_CYCLE_MS) % KA_CYCLE_MS;

/** Position of a moment inside the two-minute cycle. */
export function cyclePosition(serverMs) {
  return mod(serverMs);
}

/** The positions in the cycle at which Kleinanzeigen is checked. */
export function kaCheckPositions(landingMs = KA_DEFAULT_LANDING_MS) {
  return [...BURST_MS, WATCH_MS].map((delta) => mod(landingMs + delta)).sort((a, b) => a - b);
}

/** When (server time) the next check is due, at least `minGapMs` from now. */
export function nextKaCheck(serverNowMs, landingMs = KA_DEFAULT_LANDING_MS, minGapMs = 500) {
  const cycleStart = serverNowMs - mod(serverNowMs);
  const positions = kaCheckPositions(landingMs);
  for (let cycle = 0; cycle < 3; cycle += 1) {
    for (const position of positions) {
      const at = cycleStart + cycle * KA_CYCLE_MS + position;
      if (at >= serverNowMs + minGapMs) return at;
    }
  }
  return serverNowMs + KA_CYCLE_MS;
}

/** Whether a moment lies in the burst right after a landing (not the mid-cycle watch). */
export function inBurst(serverMs, landingMs = KA_DEFAULT_LANDING_MS) {
  const since = mod(serverMs - landingMs);
  return since <= BURST_MS[BURST_MS.length - 1] + 1_000;
}

/**
 * Learning from what was seen. `previousAt` and `seenAt` are the server times
 * of two checks in a row; the newest ad number went up between them, so a
 * rebuild landed in (previousAt, seenAt].
 *
 * Returns the landing position to use from now on:
 *   - unchanged when the rebuild landed where expected;
 *   - the newly measured position when the bracket is narrow enough to trust;
 *   - null when the timing has moved but the bracket is too wide to say
 *     where — the page then asks at its normal pace until it can tell again.
 */
export function learnLanding(landingMs, previousAt, seenAt) {
  if (!Number.isFinite(previousAt) || !Number.isFinite(seenAt) || seenAt <= previousAt) return landingMs;
  const width = seenAt - previousAt;
  if (width >= KA_CYCLE_MS) return landingMs;
  const expected = Number.isFinite(landingMs) ? landingMs : null;
  if (expected !== null) {
    // Did the expected landing fall inside the bracket (allowing 1.5 s of slack)?
    // (or up to 1.5 s before it: the clock offset is only known to a second or so)
    const fromStart = mod(expected - mod(previousAt));
    if (fromStart <= width + 1_500 || fromStart >= KA_CYCLE_MS - 1_500) return landingMs;
  }
  if (width <= 8_000) return mod(previousAt + 500);
  return null;
}

/**
 * One Kleinanzeigen check seen: `serverAt` when it started, `newestId` the
 * highest ad number it returned. Returns the updated timing state
 * { landing, lastMax, lastAt, relearnUntil }.
 */
export function observeKa(state, serverAt, newestId) {
  if (!Number.isFinite(newestId) || newestId <= 0) return state;
  const next = { ...state };
  if (state.lastMax && newestId > state.lastMax && state.lastAt) {
    const learned = learnLanding(state.landing, state.lastAt, serverAt);
    if (learned === null) {
      // Timing moved: ask at the normal pace for two cycles to find it again.
      next.relearnUntil = serverAt + 2 * KA_CYCLE_MS;
    } else {
      next.landing = learned;
      next.relearnUntil = 0;
    }
  }
  next.lastMax = Math.max(state.lastMax || 0, newestId);
  next.lastAt = serverAt;
  return next;
}
