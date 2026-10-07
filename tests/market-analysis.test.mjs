import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule } from 'node:vm';
const cache = new Map();
async function load(url) {
  if (cache.has(url.href)) return cache.get(url.href);
  const module = new SourceTextModule(await readFile(url, 'utf8'), { identifier: url.href });
  cache.set(url.href, module);
  await module.link((name, parent) => load(new URL(name.endsWith('.js') ? name : `${name}.js`, parent.identifier)));
  return module;
}
const valuation = await load(new URL('../lib/market/valuation.js', import.meta.url)); await valuation.evaluate();
const similarity = await load(new URL('../lib/market/similarity.js', import.meta.url)); await similarity.evaluate();
const live = await load(new URL('../lib/market/live.js', import.meta.url)); await live.evaluate();
const { adjustToTarget, computeMarketValue, computeDealerCase, computeConfidence, determineVerdict } = valuation.namespace;
const target = { price: 10000, make: 'VW', model: 'Golf', mileageKm: 80000, registrationMonths: 24240,
  powerPs: 110, fuel: 'PETROL', gearbox: 'MANUAL', condition: 'UNDAMAGED' };
const car = (price, extra = {}) => ({ ...target, price, adjustedPrice: price, valuationWeight: 90,
  similarityScore: 90, source: 'AUTOSCOUT24', sellerType: 'DEALER', sourceLevel: 'RETAIL', ...extra });

test('explicit dealer on Kleinanzeigen does not receive private price uplift', () => {
  const dealer = car(10000, { source: 'KLEINANZEIGEN', sourceLevel: 'PRIVATE' });
  assert.equal(adjustToTarget(dealer, target).totalAdjustment, 0);
  assert.equal(adjustToTarget({ ...dealer, sellerType: 'PRIVATE' }, target).totalAdjustment, 900);
  assert.equal(computeMarketValue([dealer], target).retailCount, 1);
});
test('adjustment explanation reconciles to cap', () => {
  const result = adjustToTarget(car(10000, { mileageKm: 200000, registrationMonths: 24200 }), target);
  assert.equal(result.totalAdjustment, 2500);
  assert.equal(result.adjustments.reduce((sum, line) => sum + line.amount, 0), result.totalAdjustment);
});
test('incompatible gearbox and damaged target do not get healthy-car valuation', () => {
  assert.ok(similarity.namespace.rejectionReason(car(10000, { gearbox: 'AUTOMATIC' }), target));
  assert.ok(similarity.namespace.rejectionReason(car(10000), { ...target, condition: 'DAMAGED' }));
  assert.equal(similarity.namespace.rejectionReason(car(10000, { gearbox: 'UNKNOWN', fuel: undefined }), target), null);
});
test('wide sample is not squeezed into a nine-percent range', () => {
  const market = computeMarketValue([6000,8000,10000,12000,14000].map((p) => car(p)), target);
  assert.ok(market.rangeFrom <= 6800);
  assert.ok(market.rangeTo >= 13200);
  assert.equal(market.sourceCount, 1);
  assert.equal(market.sourceCounts.AUTOSCOUT24, 5);
  const confidence = (sources) => computeConfidence({ market, target, threshold: 80, sourceReport: sources });
  assert.equal(confidence([{ok:true,used:50}]), confidence([{ok:true,used:50},{ok:true,used:0}]));
});
test('empty and insufficient samples cannot yield a buy verdict', () => {
  const market = computeMarketValue([], target);
  assert.equal(market.marketValue, null);
  assert.equal(market.rangeFrom, null);
  const dealerCase = computeDealerCase(target, market);
  assert.equal(dealerCase.available, false);
  assert.equal(determineVerdict({ target, market, dealerCase, confidence: 95 }), 'INSUFFICIENT_DATA');
});
test('scenario updates with negotiated price, repairs and missing pickup costs', () => {
  const market = computeMarketValue([9000,10000,11000].map((p) => car(p)), target);
  const dealer = computeDealerCase(target, market);
  assert.equal(dealer.pickupUnknown, true);
  assert.equal(dealer.assumedSaleDiscountPercent, 3.5);
  const result = { target, market, dealer, verdict: 'NEGOTIABLE' };
  const initial = live.namespace.initialAdjust(result);
  const first = live.namespace.recalculate(result, initial);
  const updated = live.namespace.recalculate(result, { ...initial, negotiated: 9000, refurbishment: 400 });
  assert.equal(updated.expectedLow - first.expectedLow, 600);
  assert.equal(updated.expectedHigh - first.expectedHigh, 600);
  assert.equal(first.expected, dealer.expectedProfit);
  assert.ok(first.expectedLow <= first.expected && first.expected <= first.expectedHigh);
});
