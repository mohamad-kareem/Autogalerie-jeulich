// Manual, bounded public-source experiment; never an unattended collector.
// node --experimental-default-type=module --experimental-vm-modules scripts/compare-public-feed.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeFilters } from '../lib/feed/filters.js';

const module = new SourceTextModule(await readFile(new URL('../lib/feed/sources.js', import.meta.url), 'utf8'));
await module.link((name) => {
  const unexpected = () => { throw new Error('Only pure URL builders and parsers are used'); };
  const exports = name.endsWith('/http') ? { request: unexpected, requestJson: unexpected }
    : name.endsWith('/autoscout24') ? { makeSlug: unexpected }
      : { searchNewest: unexpected, isConfigured: unexpected };
  return new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  });
});
await module.evaluate();
const filters = normalizeFilters({ priceMin: 1500, priceMax: 12000, kmMin: 10000,
  kmMax: 100000, yearMin: 2008, yearMax: 2024, seller: 'PRIVATE', fuels: ['PETROL'],
  hideDamaged: false, sources: ['KLEINANZEIGEN'] });
const url = (f) => module.namespace.kleinanzeigenUrls(f)[0];
const urls = { exact: url(filters), low: url({ ...filters, priceMax: 6750 }),
  high: url({ ...filters, priceMin: 6750 }) };
// Inclusive boundary deliberately overlaps; IDs are deduplicated.
const report = { startedAt: new Date().toISOString(), filters, urls,
  design: '12 rounds, 10s apart. Exact gets 12 requests; alternating partitions get 12 total. First two rounds are baseline.',
  limitations: 'Observed public-search availability, not upload time or CarDeluxe latency. Initial stock excluded by union baseline. Later first-seen ads may still be older inventory. A short quiet run is inconclusive.',
  samples: [], comparisons: [] };
const output = join(tmpdir(), `feed-public-comparison-${Date.now()}.json`);
const baseline = new Set();
const arrivals = new Map();

async function snapshot(view) {
  const startedAt = Date.now();
  const response = await fetch(urls[view], { redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { Accept: 'text/html', 'Accept-Language': 'de-DE,de;q=0.9' } });
  if (!response.ok) throw new Error(`${view}: HTTP ${response.status}; no retries`);
  const parsed = module.namespace.parseKleinanzeigenPage(await response.text());
  if (!parsed.ok) throw new Error(`${view}: parser rejected response; stopped`);
  return { view, arm: view === 'exact' ? 'exact' : 'partition', startedAt, at: Date.now(),
    ids: [...new Set(parsed.items.filter((ad) => !ad.promoted).map((ad) => ad.numericId))] };
}

try {
  for (let round = 0; round < 12; round++) {
    const started = Date.now();
    const results = await Promise.allSettled([snapshot('exact'), snapshot(round % 2 ? 'high' : 'low')]);
    for (const result of results) if (result.status === 'fulfilled') {
      const sample = { round, ...result.value };
      report.samples.push(sample);
      for (const id of sample.ids) {
        if (round < 2) { baseline.add(id); continue; }
        if (baseline.has(id)) continue;
        const entry = arrivals.get(id) || { id };
        entry[sample.arm] ??= sample.at;
        arrivals.set(id, entry);
      }
    }
    report.comparisons = [...arrivals.values()].map((entry) => ({ ...entry,
      exactMinusPartitionMs: entry.exact && entry.partition ? entry.exact - entry.partition : null }));
    await writeFile(output, JSON.stringify(report, null, 2));
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
    console.log(`Round ${round + 1}/12: ${results.map((result) => `${result.value.view}=${result.value.ids.length}`).join(', ')}; paired arrivals=${report.comparisons.filter((entry) => entry.exactMinusPartitionMs !== null).length}`);
    if (round < 11) await new Promise((resolve) => setTimeout(resolve, Math.max(0, 10000 - (Date.now() - started))));
  }
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(`Report: ${output}`);
  if (report.error) console.error(report.error);
}
