import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { createCheckPool, streamCheck, readCheckStream, requestCheck } from "../lib/feed/live.js";
import { nextCheckDelay } from "../lib/feed/polling.js";
import { detectNew, mergeFeed } from "../lib/feed/detect.js";
import { join } from "node:path";
import * as filters from "../lib/feed/filters.js";
import { createCoverage, advanceCoverage } from "../lib/feed/coverage.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const ad = (id) => ({ source: "KLEINANZEIGEN", key: `KLEINANZEIGEN:${id}`, numericId: id });

async function loadPause(clock) {
  const context = createContext({ Date: class extends Date { static now() { return clock.now; } } });
  const module = new SourceTextModule(await readFile(new URL("../lib/feed/pause.js", import.meta.url), "utf8"), { context });
  await module.link(() => { throw new Error("Unexpected import"); });
  await module.evaluate();
  return module.namespace;
}

test("first refusal recovers in 30 seconds, repeats back off, success resets and details are isolated", async () => {
  const clock = { now: 1000 };
  const pause = await loadPause(clock);
  pause.pauseSource("AUTOSCOUT24:details");
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 0);
  pause.pauseSource("AUTOSCOUT24");
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 30_000);
  clock.now += 10_000;
  pause.pauseSource("AUTOSCOUT24");
  pause.resumeSource("AUTOSCOUT24");
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 20_000);
  clock.now += 20_000;
  pause.pauseSource("AUTOSCOUT24");
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 60_000);
  clock.now += 60_000;
  pause.resumeSource("AUTOSCOUT24");
  pause.pauseSource("AUTOSCOUT24");
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 30_000);
  pause.pauseSource("AUTOSCOUT24", { retryAfterMs: 600_000 });
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 600_000);
});

test("HTTP Retry-After seconds and dates survive transport without an early retry", async () => {
  let calls = 0;
  const context = createContext({ fetch: async () => { calls++; return new Response("limited", {
    status: 429, headers: { "Retry-After": "120" },
  }); }, URL, AbortController, setTimeout, clearTimeout });
  const http = new SourceTextModule(await readFile(new URL("../lib/market/http.js", import.meta.url), "utf8"), { context });
  await http.link(() => new SyntheticModule(["FETCH_PROXY_TEMPLATE", "POLICY"], function () {
    this.setExport("FETCH_PROXY_TEMPLATE", "");
    this.setExport("POLICY", { requestTimeoutMs: 1000, requestRetries: 2 });
  }, { context }));
  await http.evaluate();
  const parse = http.namespace.retryAfterMs;
  assert.equal(parse("120"), 120_000);
  assert.equal(parse("Thu, 24 Sep 2026 20:00:30 GMT", Date.parse("2026-09-24T20:00:00Z")), 30_000);
  assert.equal(parse(null), 0);
  assert.equal(parse("invalid"), 0);
  const result = await http.namespace.request("https://example.test");
  assert.equal(calls, 1);
  assert.equal(result.blocked, true);
  assert.ok(result.retryAfterMs > 119_000);
});

test("successful recovery retains a slower pace so the portal is not immediately flooded again", async () => {
  const clock = { now: 1000 };
  const pause = await loadPause(clock);
  pause.pauseSource("AUTOSCOUT24");
  assert.equal(pause.recoveryIntervalMs("AUTOSCOUT24"), 10_000);
  clock.now += 30_000;
  pause.resumeSource("AUTOSCOUT24");
  assert.equal(pause.pauseRemainingMs("AUTOSCOUT24"), 0);
  assert.equal(pause.recoveryIntervalMs("AUTOSCOUT24"), 10_000);
  assert.equal(nextCheckDelay({ intervalMs: 3000, elapsedMs: 400,
    recoveryIntervalMs: 10_000, preferredDelayMs: 1000 }), 9600);
  pause.pauseSource("AUTOSCOUT24");
  assert.equal(pause.recoveryIntervalMs("AUTOSCOUT24"), 20_000);
  assert.equal(pause.recoveryIntervalMs("KLEINANZEIGEN"), 0);
  clock.now += 600_000;
  assert.equal(pause.recoveryIntervalMs("AUTOSCOUT24"), 0);
  const coverage = advanceCoverage({ ...createCoverage(false), recoveryIntervalMs: 10_000 },
    { ok: true, hasMore: true, overlap: false }, 1000);
  assert.equal(coverage.page, 3);
  assert.equal(coverage.dueAt, 41_000);
  assert.equal(coverage.recoveryIntervalMs, 10_000);
});

test("predicted portal refresh never creates a long blind window", () => {
  assert.equal(nextCheckDelay({ intervalMs: 3000, elapsedMs: 800, preferredDelayMs: 47000 }), 2200);
  assert.equal(nextCheckDelay({ intervalMs: 3000, elapsedMs: 800, preferredDelayMs: 1700 }), 1700);
  assert.equal(nextCheckDelay({ intervalMs: 3000, elapsedMs: 8000 }), 1500);
});

test("transient errors retry quickly, explicit portal cooldowns are respected", () => {
  assert.deepEqual([1, 2, 3].map((failures) => nextCheckDelay({ intervalMs: 3000, failures })), [3000, 6000, 12000]);
  assert.equal(nextCheckDelay({ intervalMs: 3000, failures: 20 }), 60000);
  assert.equal(nextCheckDelay({ intervalMs: 3000, retryAfterMs: 290000 }), 290000);
  assert.equal(nextCheckDelay({ intervalMs: 3000, failures: 0 }), 3000);
});

test("stalled response headers time out so a new check can run", async () => {
  const fetchImpl = (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  });
  await assert.rejects(requestCheck({}, "AUTOSCOUT24", { timeoutMs: 10, fetchImpl, onEvent: () => {} }), /dauert zu lange/);
  const events = [];
  await requestCheck({}, "AUTOSCOUT24", {
    fetchImpl: async () => new Response('{"type":"complete"}\n'), onEvent: (event) => events.push(event),
  });
  assert.equal(events.length, 1);
});

test("a stalled stream times out after an early batch", async () => {
  const events = [];
  await assert.rejects(requestCheck({}, "KLEINANZEIGEN", {
    timeoutMs: 10,
    fetchImpl: async (_, { signal }) => new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode('{"type":"batch"}\n'));
      signal.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError")), { once: true });
    } })),
    onEvent: (event) => events.push(event.type),
  }), /dauert zu lange/);
  assert.deepEqual(events, ["batch"]);
});

test("manual cancellation stays distinct from a network failure", async () => {
  const controller = new AbortController();
  controller.abort();
  let called = false;
  await assert.rejects(requestCheck({}, "AUTOSCOUT24", {
    signal: controller.signal, fetchImpl: () => { called = true; },
  }), { name: "AbortError" });
  assert.equal(called, false);
});

test("unchanged snapshots keep card identity and do not announce duplicates", () => {
  const previous = [{ ...ad(10), price: 1000, rating: { label: "Fair" }, isNew: true, firstSeenAt: "before" }];
  const result = mergeFeed(previous, [{ ...ad(10), price: 1000, rating: { label: "Fair" } }], [], "now");
  assert.equal(result.feed, previous);
  assert.equal(result.arrivals.length, 0);
});

test("fast results reach both subscribers before the slow search completes", async () => {
  const finish = deferred();
  const early = deferred();
  const pool = createCheckPool();
  let calls = 0;
  const run = async (emit) => {
    calls++;
    emit({ type: "batch", items: [ad(1)] });
    await finish.promise;
    emit({ type: "complete" });
  };
  const job = pool("filter", run);
  const received = [];
  const reading = readCheckStream(new Response(streamCheck(job)), (event) => {
    received.push(event.type);
    if (event.type === "batch") early.resolve();
  });
  await early.promise;
  assert.equal(job.done, false);
  assert.deepEqual(received, ["batch"]);
  assert.equal(pool("filter", run), job);
  const replay = [];
  const second = readCheckStream(new Response(streamCheck(job)), (event) => replay.push(event.type));
  finish.resolve();
  await Promise.all([reading, second]);
  assert.equal(calls, 1);
  assert.deepEqual(replay, ["batch", "complete"]);
});

test("cache expires from request start, and never duplicates in-flight work", async () => {
  let now = 0;
  const pool = createCheckPool({ now: () => now });
  const gate = deferred();
  const job = pool("filter", () => gate.promise);
  now = 9_000;
  assert.equal(pool("filter", () => {}), job);
  gate.resolve();
  await job.promise;
  assert.notEqual(pool("filter", () => {}), job);
});

test("disconnect detaches one subscriber without stopping the other", async () => {
  const gate = deferred();
  const pool = createCheckPool();
  const job = pool("filter", async (emit) => {
    await gate.promise;
    emit({ type: "complete" });
  });
  const controller = new AbortController();
  const reader = streamCheck(job, controller.signal).getReader();
  const remaining = readCheckStream(new Response(streamCheck(job)), () => {});
  assert.equal(job.listeners.size, 2);
  controller.abort();
  assert.equal((await reader.read()).done, true);
  assert.equal(job.listeners.size, 1);
  gate.resolve();
  await remaining;
  assert.equal(job.listeners.size, 0);
});

test("stream reader handles split UTF-8 and rejects truncated streams", async () => {
  const bytes = new TextEncoder().encode('{"type":"batch","title":"Jülich €"}\n{"type":"complete"}\n');
  const stream = new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
      controller.close();
    },
  });
  const events = [];
  await readCheckStream(new Response(stream), (event) => events.push(event));
  assert.equal(events[0].title, "Jülich €");
  await assert.rejects(readCheckStream(new Response('{"type":"batch"}\n'), () => {}), /unterbrochen/);
});

test("each combination freezes its initial ID floor while allowing newer IDs out of order", () => {
  let store = { seen: {}, baselines: {}, kaMaxId: 0 };
  const check = (scope, items, ok = true) => {
    const result = detectNew(store, items, Date.now(), { scope, answered: ok ? ["KLEINANZEIGEN"] : [] });
    store = { ...store, ...result };
    return result;
  };
  assert.equal(check("fast", [ad(100)]).baselineItems.length, 1);
  assert.equal(check("slow", [ad(20)]).baselineItems.length, 1);
  assert.deepEqual(check("fast", [ad(110), ad(100)]).fresh.map((item) => item.numericId), [110]);
  assert.deepEqual(check("slow", [ad(30), ad(20)]).fresh.map((item) => item.numericId), [30]);
  assert.deepEqual(check("slow", [ad(30), ad(19), ad(29)]).fresh.map((item) => item.numericId), [29]);
  check("failed", [], false);
  assert.equal(store.baselines.failed, undefined);
  assert.equal(check("empty", []).baselineItems.length, 0);
  assert.equal(check("empty", [{ ...ad(120), postedAt: new Date().toISOString() }]).fresh.length, 1);
});

test("old Twingo and old catch-up results never become new uploads", () => {
  const start = Date.parse("2026-09-24T19:40:30Z");
  const initial = { seen: {}, startedAt: start, baselines: {} };
  const baseline = detectNew(initial, [ad(3522310452)], start);
  const store = { ...initial, ...baseline };
  const old = { ...ad(3515465635), postedAt: "2026-09-17T10:00:00Z" };
  const snapshot = JSON.stringify(store);
  const result = detectNew(store, [old,
    { ...old, postedAt: "2026-09-24T19:41:00Z" }, // bumped old ID, refreshed display date
    { ...ad(3522310500), postedAt: "2026-09-23T10:00:00Z" },
    { ...ad(3522310501), postedAt: "invalid" },
    { ...ad(3522310502), postedAt: "2026-09-24T19:41:00Z" },
  ], start + 60_000);
  assert.deepEqual(result.fresh.map((item) => item.numericId), [3522310502]);
  assert.equal(JSON.stringify(store), snapshot, "detection does not mutate stored anchors");
  assert.equal(result.freshness.KLEINANZEIGEN.minimumId, 3522310452);
  // Eviction from the bounded seen cache does not resurrect older inventory.
  assert.equal(detectNew({ ...store, seen: {} }, [old], start + 120_000).fresh.length, 0);
});

test("empty initial search needs a recent date before accepting an unknown Kleinanzeigen ID", () => {
  const start = Date.parse("2026-09-24T19:40:30Z");
  const initial = { seen: {}, startedAt: start };
  const baseline = detectNew(initial, [], start, { answered: ["KLEINANZEIGEN"] });
  const result = detectNew({ ...initial, ...baseline }, [ad(1),
    { ...ad(2), postedAt: "2026-09-24T19:40:00Z" },
    { ...ad(3), postedAt: "2026-09-24T19:39:00Z" },
  ], start + 10_000);
  assert.deepEqual(result.fresh.map((item) => item.numericId), [2]);
});

test("unseen AutoScout results below a known ad are discovered", () => {
  const item = (id) => ({ key: `AUTOSCOUT24:${id}`, source: "AUTOSCOUT24" });
  const result = detectNew({ seen: { "AUTOSCOUT24:known": 1 }, baselines: { AUTOSCOUT24: true } },
    [item("known"), item("delayed")], 2);
  assert.deepEqual(result.fresh.map((entry) => entry.key), ["AUTOSCOUT24:delayed"]);
});

test("pagination does not announce old cars or establish the live baseline", () => {
  const result = detectNew({ seen: {}, baselines: {} }, [ad(20)], 1, { backfill: true });
  assert.equal(result.fresh.length, 0);
  assert.equal(result.otherItems.length, 1);
  assert.equal(result.baselines.KLEINANZEIGEN, undefined);
});

test("merge restores previously discarded ads, refreshes prices, and keeps more than 150 matches", () => {
  const previous = Array.from({ length: 160 }, (_, i) => ({ ...ad(i), firstSeenAt: "before", isNew: false }));
  previous[0].details = { hu: "loaded" };
  previous[0].price = 1000;
  const merged = mergeFeed(previous, [{ ...ad(0), price: 900 }, ad(200), ad(201)], [ad(201)], "now");
  assert.equal(merged.feed.length, 162);
  assert.equal(merged.feed[0].key, ad(201).key);
  assert.equal(merged.arrivals.length, 1);
  const updated = merged.feed.find((item) => item.key === ad(0).key);
  assert.equal(updated.price, 900);
  assert.equal(updated.firstSeenAt, "before");
  assert.equal(updated.details.hu, "loaded");
  assert.equal(merged.feed.find((item) => item.key === ad(200).key).isNew, false);
});

async function loadSources(request = async () => ({ ok: true, body: "" })) {
  const source = new SourceTextModule(await readFile(new URL("../lib/feed/sources.js", import.meta.url), "utf8"));
  await source.link(async (name) => {
    const exports = name.endsWith("/http") ? { request, requestJson: async () => ({ data: {} }) }
      : name.endsWith("/autoscout24") ? { makeSlug: (value) => value }
        : { searchNewest: async () => ({}), isConfigured: () => false };
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await source.evaluate();
  return source.namespace;
}

test("search URLs preserve Germany and chosen filters while supporting further pages", async () => {
  const sources = await loadSources();
  const f = filters.normalizeFilters({ fuels: ["PETROL"], seller: "PRIVATE", priceMin: 1500, priceMax: 12000 });
  const url = new URL(sources.autoscoutUrl(f, 2));
  assert.equal(url.searchParams.get("cy"), "D");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("fuel"), "B");
  assert.equal(url.searchParams.has("adage"), false);
  assert.match(sources.kleinanzeigenUrls(f, null, 2)[0], /\/seite:2\//);
});

test("AutoScout parser retains matches, reports coverage, excludes foreign cars and relaxed recommendations", async () => {
  const sources = await loadSources();
  const listing = { id: "a", url: "/angebote/a", location: { countryCode: "DE" }, searchResultSection: "Main", searchResultType: "Organic" };
  const html = `<script id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: {
    listings: [listing, { ...listing, id: "b", location: { countryCode: "IT" } },
      { ...listing, id: "c", searchResultSection: "Recommendation" }], numberOfResults: 4781, numberOfPages: 200,
  } } })}</script>`;
  const result = sources.parseAutoScoutPage(html);
  assert.equal(result.items.length, 1);
  assert.equal(result.total, 4781);
  assert.equal(result.totalPages, 200);
  assert.equal(result.items[0].promoted, false);
});

test("downloaded live search pages parse with pagination and Germany-only AutoScout results", {
  skip: !process.env.FEED_LIVE_FIXTURES,
}, async (t) => {
  const sources = await loadSources();
  const as = sources.parseAutoScoutPage(await readFile(join(process.env.FEED_LIVE_FIXTURES, "feed-autoscout.html"), "utf8"));
  const ka = sources.parseKleinanzeigenPage(await readFile(join(process.env.FEED_LIVE_FIXTURES, "feed-kleinanzeigen.html"), "utf8"));
  assert.equal(as.ok, true);
  assert.ok(as.items.length > 0);
  assert.ok(as.total > as.items.length);
  assert.ok(as.totalPages > 1);
  assert.equal(ka.ok, true);
  assert.ok(ka.items.length > 0);
  assert.equal(ka.hasMore, true);
  t.diagnostic(`Live fixtures: AutoScout24 ${as.items.length} parsed / ${as.total} total; Kleinanzeigen ${ka.items.length} parsed, further pages available.`);
});

test("paid placements and repeated results do not create new arrivals", () => {
  const store = { seen: { "KLEINANZEIGEN:10": 1 }, baselines: { a: true }, watermarks: { a: 10 } };
  const result = detectNew(store, [{ ...ad(99), promoted: true }, ad(10), ad(11)], 2,
    { scope: "a", answered: ["KLEINANZEIGEN"] });
  assert.deepEqual(result.fresh.map((item) => item.numericId), [11]);
  assert.equal(result.watermarks.a, 11);
});

test("Kleinanzeigen adapter publishes fast combination without waiting for slow combination", async () => {
  const slow = deferred();
  const early = deferred();
  const source = new SourceTextModule(await readFile(new URL("../lib/feed/sources.js", import.meta.url), "utf8"));
  await source.link(async (name) => {
    const exports = name.endsWith("/http") ? {
      request: (url) => url.includes("diesel") ? slow.promise : Promise.resolve({ ok: true, body: "" }),
      requestJson: async () => ({ data: {} }),
    } : name.endsWith("/autoscout24") ? { makeSlug: (value) => value }
      : { searchNewest: async () => ({}), isConfigured: () => false };
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await source.evaluate();
  const batches = [];
  let finished = false;
  const search = source.namespace.searchKleinanzeigen({
    fuels: ["PETROL", "DIESEL"], bodies: [], priceMin: null, priceMax: null,
    yearMin: null, yearMax: null, kmMin: null, kmMax: null, powerMin: null, powerMax: null,
  }, (batch) => { batches.push(batch); early.resolve(); }).then(() => { finished = true; });
  await early.promise;
  assert.equal(finished, false);
  assert.equal(batches.length, 1);
  assert.match(batches[0].scope, /benzin/);
  slow.resolve({ ok: true, body: "" });
  await search;
  assert.equal(batches.length, 2);
  assert.notEqual(batches[0].scope, batches[1].scope);
});

async function loadRoute({ session, search, pause }) {
  const source = new SourceTextModule(await readFile(new URL("../app/api/neue-angebote/route.js", import.meta.url), "utf8"));
  await source.link(async (name) => {
    const exports = name === "next-auth" ? { getServerSession: async () => session }
      : name.includes("nextauth") ? { authOptions: {} }
        : name.endsWith("/filters") ? filters
          : name.endsWith("/pause") ? (pause || { looksRefused: () => false, pauseRemainingMs: () => 0, pauseSource: () => {}, resumeSource: () => {}, recoveryIntervalMs: () => 0 })
            : name.endsWith("/live") ? { createCheckPool, streamCheck }
              : { SEARCHERS: { KLEINANZEIGEN: search } };
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await source.evaluate();
  return source.namespace.POST;
}

const feedRequest = (stream = true, page = 1) => new Request("https://example.test/api/neue-angebote", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filters: { sources: ["KLEINANZEIGEN"] }, source: "KLEINANZEIGEN", stream, page }),
});

test("API preserves portal cooldown, skips requests while paused and resumes after expiry", async () => {
  const clock = { now: 1000 };
  const pause = await loadPause(clock);
  let calls = 0;
  const post = await loadRoute({ session: { user: {} }, pause, search: async () => {
    calls++;
    return calls === 1 ? { ok: false, blocked: true, retryAfterMs: 90_000, items: [] }
      : { ok: true, items: [ad(1)] };
  } });
  const refused = await (await post(feedRequest(false))).json();
  assert.equal(refused.sources[0].retryAfterMs, 90_000);
  const paused = await (await post(feedRequest(false, 2))).json();
  assert.equal(paused.sources[0].paused, true);
  assert.equal(calls, 1);
  clock.now += 90_000;
  const recovered = await (await post(feedRequest(false, 3))).json();
  assert.equal(recovered.sources[0].ok, true);
  assert.equal(recovered.sources[0].paused, false);
  assert.equal(calls, 2);
});

test("slow older-page requests neither share cache entries with nor delay the live page", async () => {
  const gate = deferred();
  const started = deferred();
  const post = await loadRoute({ session: { user: {} }, search: async (_, publish, { page }) => {
    if (page === 2) { started.resolve(); await gate.promise; }
    publish({ scope: "same-search", ok: true, items: [ad(page)] });
    return { ok: true, items: [ad(page)], page, hasMore: true };
  } });
  const older = post(feedRequest(false, 2));
  await started.promise;
  const live = await (await post(feedRequest(false, 1))).json();
  assert.equal(live.items[0].numericId, 1);
  assert.equal(live.sources[0].page, 1);
  gate.resolve();
  const backfill = await (await older).json();
  assert.equal(backfill.items[0].numericId, 2);
  assert.equal(backfill.sources[0].hasMore, true);
});

test("Kleinanzeigen pagination keeps the same detection scope across pages", async () => {
  const requested = [];
  const sources = await loadSources(async (url) => {
    requested.push(url);
    return { ok: true, body: '<a title="Nächste" href="/next">next</a>' };
  });
  const f = filters.normalizeFilters({ fuels: ["PETROL"] });
  const batches = [];
  const result = await sources.searchKleinanzeigen(f, (batch) => batches.push(batch), { page: 2 });
  assert.match(requested[0], /\/seite:2\//);
  assert.equal(batches[0].scope.includes("seite:2"), false);
  assert.equal(result.hasMore, true);
});

test("API streams an early batch and preserves its JSON response for other callers", async () => {
  const gate = deferred();
  const early = deferred();
  let calls = 0;
  const post = await loadRoute({ session: { user: {} }, search: async (_, publish) => {
    calls++;
    publish({ scope: "fast", ok: true, items: [ad(123)] });
    await gate.promise;
    return { ok: true, items: [ad(123)], url: "https://example.test" };
  } });
  const response = await post(feedRequest());
  assert.match(response.headers.get("content-type"), /ndjson/);
  const events = [];
  const reading = readCheckStream(response, (event) => {
    events.push(event);
    if (event.type === "batch") early.resolve();
  });
  await early.promise;
  assert.equal(events.length, 1);
  assert.equal(events[0].source, "KLEINANZEIGEN");
  gate.resolve();
  await reading;
  assert.equal(events.at(-1).sources[0].count, 1);
  const json = await (await post(feedRequest(false))).json();
  assert.equal(json.items[0].numericId, 123);
  assert.equal(calls, 1);
});

test("API still rejects unauthenticated searches before contacting portals", async () => {
  let contacted = false;
  const post = await loadRoute({ session: null, search: async () => { contacted = true; } });
  assert.equal((await post(feedRequest())).status, 401);
  assert.equal(contacted, false);
});

test("incremental initial cards remain baseline until the complete search arrives", () => {
  let store = { seen: {}, baselines: {}, feed: [] };
  for (const id of [1, 2, 3]) {
    const result = detectNew(store, [ad(id)], id, { scope: "petrol", answered: ["KLEINANZEIGEN"], partial: true });
    assert.equal(result.fresh.length, 0);
    assert.equal(result.baselines.petrol, undefined);
    store = { ...store, ...result };
  }
  store = { ...store, ...detectNew(store, [ad(1), ad(2), ad(3)], 4, { scope: "petrol", answered: ["KLEINANZEIGEN"] }) };
  const live = detectNew(store, [ad(4)], 5, { scope: "petrol", answered: ["KLEINANZEIGEN"], partial: true });
  assert.deepEqual(live.fresh.map((item) => item.numericId), [4]);
  const duplicate = detectNew({ ...store, ...live }, [ad(4)], 6, { scope: "petrol", answered: ["KLEINANZEIGEN"] });
  assert.equal(duplicate.fresh.length, 0);
});

test("coverage baselines quietly, follows overflowing bursts, and stops at known ads", () => {
  let state = advanceCoverage(createCoverage(), { ok: true, hasMore: true, overlap: false }, 100);
  assert.equal(state.baseline, false);
  assert.equal(state.page, 2);
  state = advanceCoverage(state, { ok: true, hasMore: true, overlap: false }, 200);
  assert.equal(state.page, 3);
  assert.ok(state.warning);
  state = advanceCoverage(state, { ok: true, hasMore: true, overlap: true }, 300);
  assert.equal(state.page, 2);
  assert.equal(state.warning, null);
  assert.equal(state.dueAt, 10300);
});

test("coverage failures retain the failed page and honor refusal cooldown", () => {
  const state = { ...createCoverage(false), page: 5 };
  const failed = advanceCoverage(state, { ok: false, retryAfterMs: 300000 }, 100);
  assert.equal(failed.page, 5);
  assert.equal(failed.dueAt, 300100);
  assert.ok(failed.warning);
  const recovered = advanceCoverage(failed, { ok: true, hasMore: false }, 1000);
  assert.equal(recovered.page, 2);
  assert.equal(recovered.failures, 0);
});

test("coverage reports the portal limit instead of claiming completeness", () => {
  const state = advanceCoverage({ ...createCoverage(false), page: 200 }, { ok: true, hasMore: true, overlap: false }, 0);
  assert.match(state.warning, /Seitenlimit/);
});

test("client passes the recovery page and preserves the live default", async () => {
  const pages = [];
  const fetchImpl = async (_, options) => {
    pages.push(JSON.parse(options.body).page);
    return new Response('{"type":"complete"}\n');
  };
  await requestCheck({}, "AUTOSCOUT24", { page: 3, fetchImpl, onEvent() {} });
  await requestCheck({}, "AUTOSCOUT24", { fetchImpl, onEvent() {} });
  assert.deepEqual(pages, [3, 1]);
});

const kaArticle = (id) => `<article data-adid="${id}" data-href="/s-anzeige/auto/${id}-216-1"><h2>Auto ${id}</h2><p class="font-strong">2.000 €</p><span>Heute, 12:00</span></article>`;

test("Kleinanzeigen publishes each complete card before the HTTP body finishes", async () => {
  const finish = deferred();
  const early = deferred();
  const html = kaArticle(1) + kaArticle(2);
  const sources = await loadSources(async (_, { onChunk }) => {
    const boundary = html.indexOf("</article>") + 5;
    onChunk(html.slice(0, boundary));
    onChunk(html.slice(boundary));
    early.resolve();
    await finish.promise;
    return { ok: true, body: html };
  });
  const batches = [];
  const search = sources.searchKleinanzeigen(filters.normalizeFilters({}), (batch) => batches.push(batch));
  await early.promise;
  assert.equal(batches.length, 2);
  assert.ok(batches.every((batch) => batch.partial));
  assert.deepEqual(batches.map((batch) => batch.items[0].numericId), [1, 2]);
  finish.resolve();
  await search;
  assert.equal(batches.at(-1).partial, undefined);
  assert.equal(batches.at(-1).items.length, 2);
});

test("AutoScout publishes the JSON payload before a delayed page footer", async () => {
  const finish = deferred();
  const early = deferred();
  const html = `<script id="__NEXT_DATA__">${JSON.stringify({ props: { pageProps: { listings: [{ id: "a", url: "/angebote/a" }] } } })}</script>`;
  const sources = await loadSources(async (_, { onChunk }) => {
    assert.notEqual(onChunk(html.slice(0, -4)), false);
    assert.equal(onChunk(html.slice(-4)), false, "complete JSON requests transport cancellation");
    early.resolve();
    await finish.promise;
    return { ok: true, body: html };
  });
  const batches = [];
  const search = sources.searchAutoScout(filters.normalizeFilters({}), (batch) => batches.push(batch));
  await early.promise;
  assert.equal(batches.length, 1);
  assert.equal(batches[0].items[0].id, "a");
  finish.resolve();
  await search;
});

test("unexpected Kleinanzeigen pages cannot silently establish an empty baseline", async () => {
  const sources = await loadSources();
  assert.match(sources.parseKleinanzeigenPage("<html>Maintenance</html>").error, /nicht gelesen/);
  assert.equal(sources.parseKleinanzeigenPage("<h1>Keine Anzeigen gefunden</h1>").error, null);
});

test("HTTP chunk callbacks run before body completion and preserve split UTF-8", async () => {
  let sender;
  const bytes = new TextEncoder().encode("Auto für Jülich");
  const stream = new ReadableStream({ start(controller) { sender = controller; } });
  const context = createContext({ fetch: async () => new Response(stream), URL, AbortController,
    TextDecoder, setTimeout, clearTimeout });
  const http = new SourceTextModule(await readFile(new URL("../lib/market/http.js", import.meta.url), "utf8"), { context });
  await http.link(() => new SyntheticModule(["FETCH_PROXY_TEMPLATE", "POLICY"], function () {
    this.setExport("FETCH_PROXY_TEMPLATE", null);
    this.setExport("POLICY", { requestTimeoutMs: 1000, requestRetries: 0 });
  }, { context }));
  await http.evaluate();
  const first = deferred();
  const chunks = [];
  let done = false;
  const reading = http.namespace.request("https://example.test", { onChunk(chunk) { chunks.push(chunk); first.resolve(); } })
    .then((result) => { done = true; return result; });
  sender.enqueue(bytes.slice(0, 7));
  await first.promise;
  assert.equal(done, false);
  assert.equal(chunks.join(""), "Auto f");
  sender.enqueue(bytes.slice(7)); sender.close();
  const result = await reading;
  assert.equal(result.body, "Auto für Jülich");
  assert.equal(chunks.join(""), result.body);
});

test("complete parser payload cancels a never-ending footer and releases the HTTP request", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode("complete payload")); },
    cancel() { cancelled = true; },
  });
  const context = createContext({ fetch: async () => new Response(stream), URL, AbortController,
    TextDecoder, setTimeout, clearTimeout });
  const http = new SourceTextModule(await readFile(new URL("../lib/market/http.js", import.meta.url), "utf8"), { context });
  await http.link(() => new SyntheticModule(["FETCH_PROXY_TEMPLATE", "POLICY"], function () {
    this.setExport("FETCH_PROXY_TEMPLATE", null);
    this.setExport("POLICY", { requestTimeoutMs: 1000, requestRetries: 0 });
  }, { context }));
  await http.evaluate();
  const result = await http.namespace.request("https://example.test", { onChunk: () => false });
  assert.equal(result.ok, true);
  assert.equal(result.body, "complete payload");
  assert.equal(cancelled, true);
});

test("damage exclusion is visible in the summary and agrees with the portal URL", async () => {
  const sources = await loadSources();
  for (const hideDamaged of [true, false]) {
    const f = filters.normalizeFilters({ hideDamaged });
    assert.equal(sources.kleinanzeigenUrls(f, null)[0].includes("autos.schaden_s:nein"), hideDamaged);
    assert.match(filters.describeFilters(f), hideDamaged ? /ohne Unfall-\/Defektfahrzeuge/ : /inkl\. Unfall-\/Defektfahrzeuge/);
  }
});

test("reported Mondeo is retained by the parser when the portal includes it", {
  skip: !process.env.FEED_MONDEO_FIXTURE,
}, async () => {
  const sources = await loadSources();
  const result = sources.parseKleinanzeigenPage(await readFile(process.env.FEED_MONDEO_FIXTURE, "utf8"));
  const car = result.items.find((item) => item.id === "3522302331");
  assert.ok(car, "The reported ad must not be discarded by the parser");
  assert.match(car.title, /Ford Mondeo/);
  assert.equal(car.promoted, false);
  assert.equal(car.mileageKm, 14400);
  assert.equal(car.firstRegistration, "08/2018");
});

test("SVG TOP badges outside articles cannot become organic coverage anchors", async () => {
  const sources = await loadSources();
  const html = '<li data-clickable="card"><svg width="33" height="16" class="absolute right-none top-none"><path /></svg>' + kaArticle(10) + '</li><li data-clickable="card">' + kaArticle(11) + '</li>';
  const result = sources.parseKleinanzeigenPage(html);
  assert.equal(result.items[0].promoted, true);
  assert.equal(result.items[1].promoted, false);
  const at = Date.parse(result.items[1].postedAt);
  const detected = detectNew({ seen: {}, startedAt: at, kaMaxId: 9, baselines: { KLEINANZEIGEN: true } }, result.items, at + 60_000);
  assert.deepEqual(detected.fresh.map((item) => item.numericId), [11]);
});

test("Astro tracker promotion flags survive badge markup changes", async () => {
  const sources = await loadSources();
  const props = JSON.stringify({ resultAds: [1, [[0, { organicAdPreview: [0, { id: [0, 10], topAd: [0, true] }] }]]] }).replaceAll('"', '&quot;');
  const result = sources.parseKleinanzeigenPage(kaArticle(10) + `<astro-island component-url="/ImpressionTracker.abc.js" props="${props}"></astro-island>`);
  assert.equal(result.items[0].promoted, true);
});

test("actual search page marks its two rotating paid placements", {
  skip: !process.env.FEED_EXACT_FIXTURE,
}, async () => {
  const sources = await loadSources();
  const result = sources.parseKleinanzeigenPage(await readFile(process.env.FEED_EXACT_FIXTURE, "utf8"));
  assert.equal(result.items.find((item) => item.id === "3504015814")?.promoted, true);
  assert.equal(result.items.find((item) => item.id === "3520433917")?.promoted, true);
  assert.equal(result.items.find((item) => item.id === "3522310452")?.promoted, false);
});
