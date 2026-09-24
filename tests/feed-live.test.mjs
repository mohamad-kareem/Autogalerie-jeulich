import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { createCheckPool, streamCheck, readCheckStream } from "../lib/feed/live.js";
import { detectNew } from "../lib/feed/detect.js";
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

test("each combination has its own baseline and high-water mark", () => {
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
  assert.equal(check("slow", [ad(30), ad(19)]).fresh.length, 0);
  check("failed", [], false);
  assert.equal(store.baselines.failed, undefined);
  assert.equal(check("empty", []).baselineItems.length, 0);
  assert.equal(check("empty", [ad(120)]).fresh.length, 1);
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

const feedRequest = (stream = true) => new Request("https://example.test/api/neue-angebote", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filters: { sources: ["KLEINANZEIGEN"] }, source: "KLEINANZEIGEN", stream }),
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
