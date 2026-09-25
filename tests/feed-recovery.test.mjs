import test from "node:test";
import assert from "node:assert/strict";
import { createCoverage, scheduleCoverage } from "../lib/feed/coverage.js";
import { detectNew, mergeFeed } from "../lib/feed/detect.js";

test("bursts cannot bypass recovery or indefinitely postpone catch-up", () => {
  const recovering = { ok: true, hasMore: true, overlap: false, recoveryIntervalMs: 10000 };
  let state = scheduleCoverage(createCoverage(false), recovering, 1000);
  assert.equal(state.dueAt, 41000);
  state = scheduleCoverage(state, recovering, 11000);
  assert.equal(state.dueAt, 41000);
  state = scheduleCoverage(state, recovering, 42000);
  assert.equal(state.dueAt, 41000, "due recovery is allowed to run");
  state = scheduleCoverage(state, { ...recovering, recoveryIntervalMs: 20000 }, 42000);
  assert.equal(state.dueAt, 122000);
  state = scheduleCoverage(state, { ...recovering, recoveryIntervalMs: 0 }, 50000);
  assert.equal(state.dueAt, 0);
});

test("same vehicle on different portals remains two independent arrivals", () => {
  const startedAt = Date.parse("2026-09-25T10:00:00Z");
  const cars = ["KLEINANZEIGEN", "AUTOSCOUT24"].map((source) => ({
    key: `${source}:123`, source, numericId: 123, title: "Opel Corsa", price: 3550,
    postedAt: new Date(startedAt + 1000).toISOString(),
  }));
  const initial = { startedAt, seen: {}, kaMaxId: 100, baselines: { KLEINANZEIGEN: true, AUTOSCOUT24: true } };
  const found = detectNew(initial, cars, startedAt + 2000);
  assert.equal(found.fresh.length, 2);
  const merged = mergeFeed([], cars, found.fresh, new Date(startedAt + 2000).toISOString());
  assert.equal(merged.arrivals.length, 2);
  assert.equal(merged.feed.length, 2);
  assert.equal(detectNew({ ...initial, ...found }, cars, startedAt + 3000).fresh.length, 0);
});
