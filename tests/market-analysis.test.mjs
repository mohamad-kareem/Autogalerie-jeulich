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
const deep = await load(new URL('../lib/market/deep.js', import.meta.url)); await deep.evaluate();
const decisions = await load(new URL('../lib/market/decision.js', import.meta.url)); await decisions.evaluate();
const evidence = await load(new URL('../lib/market/evidence.js', import.meta.url)); await evidence.evaluate();
const mobileSearch = await load(new URL('../lib/market/sources/mobileSearch.js', import.meta.url)); await mobileSearch.evaluate();
const mobileProtocol = await load(new URL('../extensions/marktanalyse/protocol.js', import.meta.url)); await mobileProtocol.evaluate();
const kleinanzeigen = await load(new URL('../lib/market/sources/kleinanzeigen.js', import.meta.url)); await kleinanzeigen.evaluate();
const autoscout24 = await load(new URL('../lib/market/sources/autoscout24.js', import.meta.url)); await autoscout24.evaluate();
const { adjustToTarget, computeMarketValue, computeDealerCase, computeConfidence, determineVerdict } = valuation.namespace;
const target = { price: 10000, make: 'VW', model: 'Golf', mileageKm: 80000, registrationMonths: 24240,
  powerPs: 110, fuel: 'PETROL', gearbox: 'MANUAL', condition: 'UNDAMAGED' };
const car = (price, extra = {}) => ({ ...target, price, adjustedPrice: price, valuationWeight: 90,
  similarityScore: 90, source: 'AUTOSCOUT24', sellerType: 'DEALER', sourceLevel: 'RETAIL', ...extra });

test('the closest cars set the valuation while wider matches and a cheap outlier remain visible', () => {
  const hyundai = { ...target, make: 'Hyundai', model: 'i30', mileageKm: 55000 };
  const listing = (price, mileageKm, similarityScore, extra = {}) =>
    car(price, { ...hyundai, price, mileageKm, similarityScore, ...extra });
  const close = [listing(5499, 54000, 89), listing(4999, 71203, 87), listing(5980, 59000, 79)];
  const cheap = listing(3900, 48000, 87, { source: 'KLEINANZEIGEN' });
  const distant = [listing(2890, 138000, 74), listing(4990, 133000, 72), listing(5999, 55000, 78, {
    registrationMonths: hyundai.registrationMonths + 30,
  })];
  const { selectComparables } = similarity.namespace;
  const narrow = selectComparables([...close, cheap], hyundai);
  const wide = selectComparables([...distant, ...close, cheap], hyundai);
  const full = selectComparables([
    ...close, cheap, ...Array.from({ length: 25 }, (_, index) => listing(4500, 110000 + index * 1000, 90)),
  ], hyundai);

  assert.equal(wide.market.marketValue, narrow.market.marketValue);
  assert.equal(full.market.marketValue, narrow.market.marketValue);
  assert.equal(wide.kmRate, narrow.kmRate);
  assert.deepEqual(wide.comparables.map((entry) => entry.mileageKm), [54000, 71203, 59000]);
  assert.deepEqual(wide.listings.map((entry) => entry.similarityScore), [89, 87, 87, 79, 78, 74, 72]);
  assert.equal(wide.listings[1].price, 3900);
  assert.equal(wide.listings[1].priceReview, true);
  assert.ok(computeConfidence({ market: wide.market, target: hyundai, sourceReport: [], threshold: 72 }) < 50);
});

test('search comparisons read mileage separately from the year and check the advertised model', async (t) => {
  const hyundai = { ...target, make: 'Hyundai', model: 'i30', mileageKm: 55000, registrationMonths: 2009 * 12 + 8 };
  const kleinanzeigenPage = `
    <article data-adid="12345">
      <h2><a class="ellipsis" href="/s-anzeige/hyundai-i-30/12345-216-123">Hyundai i 30</a></h2>
      <div>3.900 €</div><span>EZ 06/2010</span><span>48.000 km</span>
    </article>
    <article data-adid="12346">
      <h2><a class="ellipsis" href="/s-anzeige/hyundai-i-10/12346-216-123">Hyundai i 10</a></h2>
      <div>3.900 €</div><span>EZ 06/2010</span><span>48.000 km</span>
    </article>`;
  const autoscoutPage = `
    <article data-guid="hyundai-i30-1">
      <a href="/angebote/hyundai-i30-1"><h2>Hyundai i30</h2></a>
      <div>€ 3.900</div><span>06/2010</span><span>48.000 km</span>
    </article>`;
  t.mock.method(globalThis, 'fetch', async (url) => new Response(
    url.includes('kleinanzeigen.de') ? kleinanzeigenPage : autoscoutPage,
  ));

  const classifieds = await kleinanzeigen.namespace.searchComparables(hyundai);
  assert.deepEqual(classifieds.vehicles.map((vehicle) => vehicle.mileageKm), [48000, 48000]);
  assert.equal(similarity.namespace.rejectionReason(classifieds.vehicles[0], hyundai), null);
  assert.match(similarity.namespace.rejectionReason(classifieds.vehicles[1], hyundai), /Anderes Modell/);
  const autoScout = await autoscout24.namespace.searchComparables(hyundai);
  assert.equal(autoScout.vehicles[0].mileageKm, 48000);
});

test('mobile.de comparison search uses one model results page with or without search parameters on the ad', () => {
  const { buildMobileSearchUrl } = mobileSearch.namespace;
  const { mobileSearchUrl } = mobileProtocol.namespace;
  const ad = 'https://suchen.mobile.de/fahrzeuge/details.html?id=123456';
  const search = new URL(buildMobileSearchUrl(target, ad + '&ms=25200%3B14%3B%3B'));
  assert.equal(search.pathname, '/fahrzeuge/search.html');
  assert.equal(search.searchParams.get('ms'), '25200;14;;');
  assert.equal(search.searchParams.has('pageNumber'), false);
  assert.equal(mobileSearchUrl(search.href), search.href);
  assert.equal(mobileSearchUrl(search.href + '&pageNumber=2'), null);
  assert.equal(mobileSearchUrl(ad), null);
  assert.equal(new URL(buildMobileSearchUrl(target, ad)).pathname, '/auto/volkswagen-golf.html');
  const anotherModel = new URL(buildMobileSearchUrl(
    { ...target, make: 'Example Make', model: 'Example Model' }, ad,
    { make: { id: 123 }, model: { id: 45 } },
  ));
  assert.equal(anotherModel.pathname, '/fahrzeuge/search.html');
  assert.equal(anotherModel.searchParams.get('ms'), '123;45;;');
  assert.equal(anotherModel.searchParams.get('fr'), '2018:2022');
  assert.equal(anotherModel.searchParams.get('ml'), '39000:131000');
});

test('mobile.de result cards use the cash price and reject monthly or ambiguous prices', () => {
  const { readMobileSearchResults } = mobileSearch.namespace;
  const card = {
    url: 'https://suchen.mobile.de/fahrzeuge/details.html?id=123456',
    title: 'Volkswagen Golf VII 1.4 TSI Comfortline',
    text: 'Volkswagen Golf VII 1.4 TSI Comfortline\n12.490 €\nFairer Preis\nFinanzierung ab 179 € mtl.\nUnfallfrei • EZ 06/2017 • 79.890 km • 92 kW (125 PS) • Benzin • Schaltgetriebe\nDE-52428 Jülich',
  };
  const result = readMobileSearchResults({ status: 'ok', cards: [
    card,
    { ...card, text: card.text.replace('12.490 €', '199 € mtl.') },
    { ...card, text: card.text.replace('12.490 €', '14.990 € 12.490 €') },
    { ...card, url: 'https://www.autoscout24.de/angebote/a-19381234' },
  ] });
  assert.equal(result.vehicles.length, 1);
  const [vehicle] = result.vehicles;
  assert.equal(vehicle.price, 12490);
  assert.equal(vehicle.mileageKm, 79890);
  assert.equal(vehicle.powerKw, 92);
  assert.equal(vehicle.fuel, 'PETROL');
  assert.equal(vehicle.gearbox, 'MANUAL');
  assert.equal(vehicle.country, 'DE');
  assert.equal(readMobileSearchResults({ status: 'blocked', cards: [card] }).vehicles.length, 0);
});

test('the five closest eligible mobile.de ads share the valuation with the other portals', () => {
  const { selectComparables } = similarity.namespace;
  const mobile = [82, 93, 88, 81, 90, 85, 92].map((similarityScore) =>
    car(10000, { source: 'MOBILE_DE', similarityScore }));
  const others = Array.from({ length: 25 }, () => car(10000, { similarityScore: 96 }));
  const { comparables, threshold } = selectComparables([...mobile, ...others], target);
  assert.equal(threshold, 72);
  assert.deepEqual(comparables.filter((entry) => entry.source === 'MOBILE_DE').map((entry) => entry.similarityScore), [93, 92, 90, 88, 85]);
  assert.equal(comparables.filter((entry) => entry.source === 'AUTOSCOUT24').length, 20);
});

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
test('comparison gates exclude incompatible gearboxes and damaged comparisons', () => {
  const comparison = car(10000, { mileageKm: 81000 });
  assert.match(similarity.namespace.rejectionReason({ ...comparison, gearbox: 'AUTOMATIC' }, target), /Getriebeart/);
  assert.match(similarity.namespace.rejectionReason({ ...comparison, condition: 'DAMAGED' }, target), /Unfall-/);
  assert.equal(similarity.namespace.rejectionReason({ ...comparison, gearbox: 'UNKNOWN', fuel: undefined }, target), null);
  assert.equal(similarity.namespace.rejectionReason(comparison, { ...target, condition: 'DAMAGED' }), null);
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

const fabia = { ...target, make: 'Skoda', model: 'Fabia', price: 7999 };
const fabiaCosts = {
  targetProfit: 2500,
  pickup: { available: true, totalCost: 14, hourlyRate: 14, onSiteMinutes: 60 },
};

test('the saved Fabia buy recommendation and negotiation respect the purchase limit', () => {
  const dealer = computeDealerCase(fabia, { marketValue: 9600 }, fabiaCosts);
  const result = {
    target: fabia,
    dealer,
    verdict: 'KAUFEN',
    deep: { decision: { action: 'KAUFEN', headline: 'Günstiger Fabia' } },
    insights: { negotiation: { stance: 'SOFT' } },
  };
  const adjust = live.namespace.initialAdjust(result);
  const atAsking = live.namespace.recalculate(result, adjust);
  assert.equal(atAsking.limit, 6750);
  assert.equal(atAsking.expected, 1237);
  assert.equal(atAsking.verdict, 'PRUEFEN');
  assert.match(atAsking.decisionNote, /7\.999.*1\.249.*6\.750/);
  assert.equal(atAsking.negotiation.walkAway, 6750);
  assert.equal(atAsking.negotiation.stanceLabel, 'Nachlass nötig');
  assert.ok(atAsking.negotiation.opening <= atAsking.negotiation.target);
  assert.ok(atAsking.negotiation.target <= atAsking.negotiation.walkAway);

  const negotiated = { ...adjust, negotiated: 6750 };
  assert.equal(live.namespace.recalculate(result, negotiated).verdict, 'KAUFEN');
  assert.equal(live.namespace.recalculate(result, { ...negotiated, refurbishment: 300 }).verdict, 'PRUEFEN');

  const noRoom = live.namespace.recalculate(result, { ...adjust, refurbishment: 8000 });
  assert.equal(noRoom.negotiation.mode, 'NO_LIMIT');
  assert.equal(noRoom.negotiation.walkAway, null);
});

test('the deep review validates its buy decision after recomputing the limit with the configured margin', () => {
  const comparables = [9600, 9600, 9600, 12000, 12000, 12000, 12000].map((price, index) =>
    car(price, { make: 'Skoda', model: 'Fabia', listingUrl: `https://example.com/${index}` }));
  const market = computeMarketValue(comparables, fabia);
  const dealer = computeDealerCase(fabia, market, fabiaCosts);
  assert.ok(dealer.maximumPurchasePrice >= fabia.price);

  const reviewed = deep.namespace.finishDeepAnalysis({ target: fabia, market, dealer, comparables }, [], {
    vergleichspruefung: [3, 4, 5, 6].map((nr) => ({ nr, behalten: false })),
    zielgewinn: { betrag: 1500, grund: 'Schnelldreher' },
    entscheidung: { aktion: 'KAUFEN', titel: 'Günstiger Fabia' },
  });
  assert.equal(reviewed.dealer.targetProfit, 2500);
  assert.equal(reviewed.dealer.maximumPurchasePrice, 6750);
  assert.equal(reviewed.verdict, 'PRUEFEN');
  assert.deepEqual(reviewed.deep.decision, { action: 'PRUEFEN' });
  assert.match(reviewed.deep.decisionNote, /1\.249/);
});

const astra = { ...target, make: 'Opel', model: 'Astra', price: 8499 };

test('the Astra report clears a false price rejection while preserving a rejection based on vehicle condition', () => {
  const dealer = computeDealerCase(astra, { marketValue: 9400 }, { ...fabiaCosts, targetProfit: 0 });
  const result = {
    target: astra,
    dealer,
    verdict: 'NICHT_KAUFEN',
    deep: { decision: { action: 'NICHT_KAUFEN', headline: 'Guter Astra K ST, aber Einkauf weit über Limit' } },
  };
  const adjust = live.namespace.initialAdjust(result);
  const checked = live.namespace.recalculate(result, adjust);
  assert.equal(checked.limit, 9050);
  assert.equal(checked.expected, 537);
  assert.equal(checked.verdict, 'PRUEFEN');
  assert.match(checked.decisionNote, /widerspricht der aktuellen Kalkulation/);
  assert.match(decisions.namespace.purchasePriceNote(checked.limit, checked.askingPrice), /8\.499.*551.*unter.*9\.050/);

  const withDamage = {
    ...result,
    deep: { decision: { action: 'NICHT_KAUFEN', headline: 'Unreparierter Unfallschaden', reasonType: 'FAHRZEUG', priceStatus: 'IM_LIMIT' } },
  };
  const rejected = live.namespace.recalculate(withDamage, adjust);
  assert.equal(rejected.verdict, 'NICHT_KAUFEN');
  assert.equal(rejected.decisionNote, null);
  assert.equal(rejected.negotiation.mode, 'NO_BUY');
});

test('clearing the margin keeps the analysed margin, and entering zero makes the old verdict stale', () => {
  const dealer = computeDealerCase(astra, { marketValue: 9400 }, fabiaCosts);
  const result = {
    target: astra, dealer, verdict: 'NICHT_KAUFEN',
    deep: {
      decision: { action: 'NICHT_KAUFEN', reasonType: 'PREIS', priceStatus: 'UEBER_LIMIT' },
      decisionBasis: decisions.namespace.decisionBasis(dealer),
    },
  };
  const adjust = live.namespace.initialAdjust(result);
  const blank = live.namespace.recalculate(result, { ...adjust, profit: '' });
  assert.equal(blank.targetProfit, 2500);
  assert.equal(blank.limit, dealer.maximumPurchasePrice);
  assert.equal(blank.verdict, 'NICHT_KAUFEN');

  const zero = live.namespace.recalculate(result, { ...adjust, profit: '0' });
  assert.equal(zero.targetProfit, 0);
  assert.equal(zero.limit, 9050);
  assert.equal(zero.verdict, 'PRUEFEN');
  assert.match(zero.decisionNote, /seit der KI-Bewertung geändert/);
});

test('an AI rejection based on the original limit is held for review when the new limit covers the Astra', () => {
  const comparables = [8000, 8000, 8000, 8000, 9400, 9400, 9400].map((price, index) =>
    car(price, { make: 'Opel', model: 'Astra', listingUrl: `https://example.com/${index}` }));
  const market = computeMarketValue(comparables, astra);
  const dealer = computeDealerCase(astra, market, { ...fabiaCosts, targetProfit: 0 });
  assert.ok(dealer.maximumPurchasePrice < astra.price);

  const reviewed = deep.namespace.finishDeepAnalysis({ target: astra, market, dealer, comparables }, [], {
    vergleichspruefung: [0, 1, 2, 3].map((nr) => ({ nr, behalten: false })),
    entscheidung: { aktion: 'NICHT_KAUFEN', preisstatus: 'UEBER_LIMIT', hauptgrund_typ: 'PREIS', titel: 'Einkauf über Limit' },
  });
  assert.equal(reviewed.dealer.maximumPurchasePrice, 9050);
  assert.equal(reviewed.deep.decisionBasis.maximumPurchasePrice, 9050);
  assert.equal(reviewed.verdict, 'PRUEFEN');
  assert.deepEqual(reviewed.deep.decision, { action: 'PRUEFEN' });
});

const meriva = { ...target, make: 'Opel', model: 'Meriva', title: 'Opel Meriva Edition',
  price: 3999, mileageKm: 78400, registrationMonths: 2007 * 12 + 1, powerPs: 125, gearbox: 'SEMI_AUTOMATIC' };
const merivaComparables = [
  car(500, { make: 'Opel', model: 'Meriva', adjustedPrice: 630, mileageKm: 156465,
    powerPs: 105, similarityScore: 70, valuationWeight: 70, listingUrl: 'https://example.com/meriva/1' }),
  car(2390, { make: 'Opel', model: 'Meriva', adjustedPrice: 2990, mileageKm: 149000,
    powerPs: 105, similarityScore: 62, valuationWeight: 62, listingUrl: 'https://example.com/meriva/2' }),
];

test('the two weak Meriva comparisons cannot produce a market price, profit or firm AI rejection', () => {
  const market = computeMarketValue(merivaComparables, meriva);
  assert.equal(market.comparableCount, 2);
  assert.equal(market.marketValue, null);
  assert.equal(market.rangeFrom, null);
  assert.equal(market.rangeTo, null);
  assert.equal(market.differenceToAskingPercent, null);
  assert.match(market.valuationNote, /mindestens 3/);
  const dealer = computeDealerCase(meriva, market, fabiaCosts);
  assert.equal(dealer.available, false);
  assert.equal(dealer.sellingPrice, null);
  assert.equal(dealer.maximumPurchasePrice, null);
  assert.equal(dealer.expectedProfit, null);

  const reviewed = deep.namespace.finishDeepAnalysis({ target: meriva, market, dealer, comparables: merivaComparables }, [], {
    entscheidung: { aktion: 'NICHT_KAUFEN', hauptgrund_typ: 'PREIS', titel: 'Deutlich zu teuer', zusammenfassung: 'Weit über dem Markt.' },
  });
  assert.equal(reviewed.verdict, 'PRUEFEN');
  assert.equal(reviewed.deep.decision.action, 'PRUEFEN');
  assert.equal(reviewed.deep.decision.headline, undefined);
  assert.match(reviewed.deep.decisionNote, /Nur 2 Vergleichsangebote/);
  assert.equal(reviewed.dealer.expectedProfit, null);
  assert.equal(reviewed.insights.negotiation, null);
});

test('older saved Meriva prices and price-based prose are withdrawn without mutating the saved input', () => {
  const stored = {
    target: meriva, comparables: merivaComparables, confidence: 27, verdict: 'NICHT_KAUFEN',
    market: { comparableCount: 2, marketValue: 1100, rangeFrom: 0, rangeTo: 2750, differenceToAskingPercent: -263.5 },
    dealer: { available: true, sellingPrice: 1050, maximumPurchasePrice: 0, expectedProfit: -2963, targetProfit: 2500 },
    recommendation: { headline: 'Zu teuer', summary: 'Preis weit über Markt', decision: 'NICHT_KAUFEN' },
    deep: { decision: { action: 'NICHT_KAUFEN', headline: 'Zu teuer' }, findings: [{ text: 'Scheckheftgepflegt', type: 'PLUS' }] },
    insights: { negotiation: { arguments: [{ text: 'Angebot liegt 2.899 € über Marktwert.' }] } },
  };
  const checked = evidence.namespace.withMarketEvidence(stored);
  assert.equal(checked.verdict, 'PRUEFEN');
  assert.equal(checked.market.marketValue, null);
  assert.equal(checked.dealer.maximumPurchasePrice, null);
  assert.equal(checked.dealer.targetProfit, 2500);
  assert.equal(checked.recommendation.decision, 'PRUEFEN');
  assert.equal(checked.insights.negotiation, null);
  assert.equal(checked.deep.findings.length, 1);
  assert.equal(live.namespace.recalculate(checked, live.namespace.initialAdjust(checked)), null);
  assert.equal(stored.market.marketValue, 1100);
  assert.equal(stored.verdict, 'NICHT_KAUFEN');
});

test('comparisons rejected by the AI stay excluded when only two valid offers remain', () => {
  const comparables = [3900, 4000, 4100].map((price, index) => car(price, { listingUrl: `https://example.com/review/${index}` }));
  const market = computeMarketValue(comparables, target);
  assert.ok(Number.isFinite(market.marketValue));
  const dealer = computeDealerCase(target, market);
  const reviewed = deep.namespace.finishDeepAnalysis({ target, market, dealer, comparables }, [], {
    vergleichspruefung: [{ nr: 1, behalten: false, grund: 'Unfallfahrzeug' }],
    entscheidung: { aktion: 'NICHT_KAUFEN', hauptgrund_typ: 'PREIS' },
  });
  assert.equal(reviewed.comparables.length, 2);
  assert.equal(reviewed.comparables.some((entry) => entry.listingUrl.endsWith('/1')), false);
  assert.equal(reviewed.deep.removed.length, 1);
  assert.equal(reviewed.deep.removalSkipped, false);
  assert.equal(reviewed.market.marketValue, null);
  assert.equal(reviewed.verdict, 'PRUEFEN');
});
