// Bounded manual trial, never an offline collector. Requires the user's own key.
// node --experimental-vm-modules --env-file=.env.local scripts/compare-feed-sources.mjs
import { readFile, writeFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import { join } from "node:path";
import { tmpdir } from "node:os";

const key = process.env.KLAZ_API_KEY;
if (!key) throw new Error("Set KLAZ_API_KEY locally before running this trial. Never paste it into chat.");

// Both requests use the same documented broad discovery criteria. Additional
// vehicle attributes need checking against the provider's category metadata
// before production integration. This trial does NOT establish filter coverage.
const website = "https://www.kleinanzeigen.de/s-autos/anbieter:privat/anzeige:angebote/preis:1500:12000/c216";
const api = new URL("https://api.kleinanzeigen-agent.de/api/v2/kleinanzeigen/search");
for (const [name, value] of Object.entries({ category_id: "216", min_price: "1500",
  max_price: "12000", poster_type: "PRIVATE", ad_type: "OFFER", size: "100", page: "0" })) {
  api.searchParams.set(name, value);
}

const parser = new SourceTextModule(await readFile(new URL("../lib/feed/sources.js", import.meta.url), "utf8"));
await parser.link((name) => {
  const unexpected = () => { throw new Error("Only the pure HTML parser is used in this trial"); };
  const exports = name.endsWith("/http") ? { request: unexpected, requestJson: unexpected }
    : name.endsWith("/autoscout24") ? { makeSlug: unexpected }
      : { searchNewest: unexpected, isConfigured: unexpected };
  return new SyntheticModule(Object.keys(exports), function () {
    for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
  });
});
await parser.evaluate();

const report = { startedAt: new Date().toISOString(), criteria: "Germany, cars, private, EUR 1500–12000",
  warning: "First-observed times, not original upload times. API window 100; website window differs. Absence does not establish latency or completeness.",
  maxApiRequests: 12, samples: [], comparisons: [] };
const output = join(tmpdir(), "feed-source-comparison.json");
const observed = new Map();
let floor = 0;

async function snapshot(source) {
  const began = Date.now();
  const response = await fetch(source === "api" ? api : website, {
    redirect: "error", signal: AbortSignal.timeout(12_000), cache: "no-store",
    headers: source === "api" ? { klaz_key: key, Accept: "application/json" }
      : { Accept: "text/html", "Accept-Language": "de-DE,de;q=0.9" },
  });
  // Do not print response bodies: a provider error could echo request headers.
  if (!response.ok) throw new Error(`${source}: HTTP ${response.status}; trial stopped without retrying`);
  let ids;
  if (source === "api") {
    const data = await response.json();
    if (data.success !== true || !Array.isArray(data.data?.ads)) throw new Error("Unexpected API response; trial stopped");
    ids = data.data.ads.map((ad) => Number(ad.ad_id));
  } else {
    const data = parser.namespace.parseKleinanzeigenPage(await response.text());
    if (!data.ok) throw new Error("Unexpected website response; trial stopped");
    ids = data.items.filter((ad) => !ad.promoted).map((ad) => ad.numericId);
  }
  return { source, at: Date.now(), durationMs: Date.now() - began,
    ids: ids.filter((id) => Number.isSafeInteger(id) && id > 0) };
}

try {
  for (let round = 0; round < report.maxApiRequests; round++) {
    const began = Date.now();
    const results = await Promise.allSettled([snapshot("website"), snapshot("api")]);
    for (const result of results) {
      if (result.status === "fulfilled") report.samples.push(result.value);
    }
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
    const samples = results.map((result) => result.value);
    if (round === 0) floor = Math.max(0, ...samples.flatMap((sample) => sample.ids));
    for (const sample of samples) for (const id of sample.ids) {
      if (id <= floor) continue; // Do not mistake different initial inventory for new uploads.
      const entry = observed.get(id) || { id };
      entry[sample.source] ??= sample.at;
      observed.set(id, entry);
    }
    report.comparisons = [...observed.values()].map((entry) => ({ ...entry,
      websiteMinusApiMs: entry.website && entry.api ? entry.website - entry.api : null }));
    await writeFile(output, JSON.stringify(report, null, 2));
    console.log(`Round ${round + 1}/12: website ${samples[0].ids.length}, API ${samples[1].ids.length}; comparable new ads ${report.comparisons.filter((entry) => entry.websiteMinusApiMs !== null).length}`);
    if (round < 11) await new Promise((resolve) => setTimeout(resolve, Math.max(0, 10_000 - (Date.now() - began))));
  }
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(`Trial finished. Report: ${output}`);
  if (report.error) console.error(report.error);
}
