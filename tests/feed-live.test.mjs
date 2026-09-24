import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { createCheckPool, streamCheck, readCheckStream } from "../lib/feed/live.js";
import { detectNew, mergeFeed } from "../lib/feed/detect.js";
import { join } from "node:path";
import * as filters from "../lib/feed/filters.js";

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const ad = (id) => ({ source: "KLEINANZEIGEN", key: `KLEINANZEIGEN:${id}`, numericId: id });

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

test("each combination has its own baseline, and delayed lower IDs remain visible", () => {
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
  assert.deepEqual(check("slow", [ad(30), ad(19)]).fresh.map((item) => item.numericId), [19]);
  check("failed", [], false);
  assert.equal(store.baselines.failed, undefined);
  assert.equal(check("empty", []).baselineItems.length, 0);
  assert.equal(check("empty", [ad(120)]).fresh.length, 1);
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

async function loadRoute({ session, search }) {
  const source = new SourceTextModule(await readFile(new URL("../app/api/neue-angebote/route.js", import.meta.url), "utf8"));
  await source.link(async (name) => {
    const exports = name === "next-auth" ? { getServerSession: async () => session }
      : name.includes("nextauth") ? { authOptions: {} }
        : name.endsWith("/filters") ? filters
          : name.endsWith("/pause") ? { looksRefused: () => false, pauseRemainingMs: () => 0, pauseSource: () => {} }
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
