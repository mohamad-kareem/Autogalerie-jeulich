import test from "node:test";
import assert from "node:assert/strict";
import { analyze, normalizeSettings, refreshReport } from "../lib/marktanalyse/brain.js";
import { readCondition } from "../lib/marktanalyse/condition.js";
import { marketValue, matchesModel, selectComparables } from "../lib/marktanalyse/comparables.js";
import { buildFilter, mobileSearchUrl, autoscoutSearchUrl, kleinanzeigenSearchUrls, kleinanzeigenModel, portalOf, listingIdOf, isListingUrl, mobileModelPage } from "../lib/marktanalyse/search.js";
import { parseMobileSearch, parseMobileMs, parseMobileListing, parseAutoScoutSearch, slimPage } from "../lib/marktanalyse/portalPages.js";
import { regMonths } from "../lib/marktanalyse/text.js";
import { DEFAULT_SETTINGS } from "../lib/marktanalyse/knowledge/defaults.js";
import { inspectionExpiryFromText } from "../lib/portals/utils.js";

const NOW = new Date("2026-11-15T12:00:00Z");
const prices = normalizeSettings({}).prices;

/** Ein Golf 1.0 TSI, 03/2019, 80.000 km, 115 PS. */
const golf = (extra = {}) => ({
  source: "KLEINANZEIGEN", id: "1", title: "VW Golf 1.0 TSI Comfortline", make: "Volkswagen", model: "Golf",
  price: 9000, regMonths: regMonths("03/2019"), firstRegistration: "03/2019", mileageKm: 80000, powerPs: 115,
  fuel: "PETROL", gearbox: "MANUAL", sellerType: "PRIVATE", accident: "UNKNOWN", owners: 2, description: "", ...extra,
});

/** Händlerangebote rund um 14.000 € mit realistischem Wertverlust (5 ct/km, 80 €/Monat). */
function comps(count = 16, base = 14000) {
  const list = [];
  for (let i = 0; i < count; i++) {
    const km = 80000 + (i - count / 2) * 2500;
    const months = regMonths("03/2019") + ((i * 5) % 13) - 6;
    const noise = ((i * 37) % 9 - 4) * 90;
    list.push({
      key: `MOBILE_DE:${100 + i}`, source: i % 2 ? "AUTOSCOUT24" : "MOBILE_DE", id: String(100 + i), url: "https://example.invalid/",
      title: "Volkswagen Golf 1.0 TSI", make: "Volkswagen", model: "Golf",
      price: Math.round(base - (km - 80000) * 0.05 + (months - regMonths("03/2019")) * 80 + noise),
      mileageKm: km, regMonths: months, powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER",
    });
  }
  return list;
}

test("Marktwert: gewichteter Median der Händlerangebote, Privat getrennt, Ausreißer und Schäden raus", () => {
  const items = [
    ...comps(),
    { key: "X:1", source: "MOBILE_DE", id: "900", title: "Volkswagen Golf Unfall", make: "Volkswagen", model: "Golf", price: 6000, mileageKm: 80000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" },
    { key: "X:2", source: "MOBILE_DE", id: "901", title: "Volkswagen Golf", make: "Volkswagen", model: "Golf", price: 24000, mileageKm: 80000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" },
    { key: "X:3", source: "MOBILE_DE", id: "902", title: "Volkswagen Golf", make: "Volkswagen", model: "Golf", price: 12500, mileageKm: 82000, regMonths: regMonths("02/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "PRIVATE" },
    { key: "X:4", source: "MOBILE_DE", id: "903", title: "Volkswagen Golf TDI", make: "Volkswagen", model: "Golf", price: 14000, mileageKm: 82000, regMonths: regMonths("02/2019"), powerPs: 115, fuel: "DIESEL", gearbox: "MANUAL", sellerType: "DEALER" },
  ];
  const market = marketValue(golf(), items, { step: 1 });
  assert.equal(market.n, 16);
  assert.ok(Math.abs(market.value - 14000) < 400, `Marktwert ${market.value}`);
  assert.equal(market.private.length, 1);
  assert.equal(market.confidence, "hoch");
  const reasons = market.excluded.map((car) => car.reason);
  assert.ok(reasons.some((r) => /beschädigt/.test(r)));
  assert.ok(reasons.some((r) => /Ausreißer nach oben/.test(r)));
  assert.ok(reasons.some((r) => /Kraftstoff/.test(r)));
});

test("dasselbe Auto auf zwei Portalen zählt einmal, die Anzeige selbst gar nicht", () => {
  const twin = { title: "Volkswagen Golf", make: "Volkswagen", model: "Golf", price: 13990, mileageKm: 79000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" };
  const self = { source: "KLEINANZEIGEN", id: "1", title: "VW Golf", price: 9000, mileageKm: 80000, regMonths: regMonths("03/2019") };
  const selected = selectComparables(golf(), [
    { ...twin, source: "AUTOSCOUT24", id: "a", key: "A" }, { ...twin, source: "MOBILE_DE", id: "b", key: "B" }, self,
  ]);
  assert.equal(selected.dealer.length, 1);
  assert.equal(selected.dealer[0].source, "MOBILE_DE");
  assert.deepEqual(selected.dealer[0].alsoOn, ["AUTOSCOUT24"]);
});

test("Neuberechnung nutzt dieselben Vergleichsangebote und die aktuellen Einstellungen", () => {
  const subject = golf({ price: 10_000 });
  const portals = { MOBILE_DE: { searchUrl: "https://suchen.mobile.de/fahrzeuge/search.html?ms=25200" } };
  const previous = analyze({ subject, items: comps(), now: NOW, meta: { portals, step: 2 } });
  const settings = { profitMin: 4000, profitGoal: 4500 };
  const updated = refreshReport({ subject, previous, settings, now: NOW });

  assert.equal(updated.ok, true);
  assert.deepEqual(updated.market, previous.market);
  assert.deepEqual(updated.portals, portals);
  assert.equal(updated.prices.marketValue, previous.prices.marketValue);
  assert.equal(updated.prices.limit, previous.prices.limit - 1700);
  assert.notEqual(updated.verdict.key, previous.verdict.key);
});

test("Neuberechnung älterer Berichte behält den Marktwert bei gekürzter Vergleichsliste", () => {
  const subject = golf();
  const previous = analyze({ subject, items: comps(), now: NOW });
  const { value, low, high, privateValue, generation, trim, trimKnown, ...legacyMarket } = previous.market;
  legacyMarket.dealer = legacyMarket.dealer.slice(0, 3);
  const updated = refreshReport({ subject, previous: { ...previous, market: legacyMarket }, now: NOW });

  assert.equal(updated.ok, true);
  assert.equal(updated.market.n, previous.market.n);
  assert.deepEqual(updated.market.dealer, legacyMarket.dealer);
  assert.equal(updated.prices.marketValue, previous.prices.marketValue);
  assert.deepEqual([updated.prices.marketLow, updated.prices.marketHigh], [previous.prices.marketLow, previous.prices.marketHigh]);
});

test("Modellvergleich: Kleinanzeigen-Titel müssen das Modell nennen", () => {
  const bmw = { make: "BMW", model: "320" };
  assert.equal(matchesModel({ title: "BMW 320d Touring Automatik" }, bmw), true);
  assert.equal(matchesModel({ title: "BMW 318i Limousine" }, bmw), false);
  assert.equal(matchesModel({ make: "BMW", model: "320", title: "x" }, bmw), true);
  assert.equal(matchesModel({ make: "Audi", model: "A4", title: "x" }, bmw), false);
  assert.equal(matchesModel({ title: "Mercedes Benz C180 Avantgarde" }, { make: "Mercedes-Benz", model: "C 180" }), true);
});

test("Zustand: Schäden kosten nach Preisliste, Verneinungen und erledigte Arbeiten nicht", () => {
  const read = (description, extra) => readCondition(golf({ description, ...extra }), prices, { now: NOW });
  let c = read("Kratzer an der Fahrertür und an der Stoßstange hinten. Kupplung rutscht.");
  // Mechanik mit Preis, Außenschäden (Lack/Stoßstange) genannt, aber ohne Preis
  assert.deepEqual(c.costs.map((x) => [x.item, x.qty, Boolean(x.noPrice)]), [["kupplung", 1, false], ["lackTeil", 2, true]]);
  assert.equal(c.costTotal, prices.kupplung);

  c = read("Unfallfrei, kein Rost, keine Kratzer oder Dellen. Kupplung neu, Zahnriemen bei 70.000 km gewechselt. Scheckheftgepflegt, 1. Hand.");
  assert.equal(c.costTotal, 0);
  assert.deepEqual(c.findings, []);
  assert.ok(c.positives.some((p) => p.id === "neu-kupplung"));
  assert.ok(c.positives.some((p) => p.id === "neu-zahnriemen"));
  assert.ok(c.positives.some((p) => p.id === "plusScheckheft"));

  c = read("Zahnriemen muss demnächst gemacht werden. Anhängerkupplung abnehmbar.");
  assert.deepEqual(c.costs.map((x) => x.item), ["zahnriemen"]);

  c = read("Motor läuft, aber Getriebe ruckelt beim Schalten.");
  assert.equal(c.killer[0].id, "getriebeschaden");

  c = read("Das Auto hat altersbedingt kleine Mängel.");
  assert.deepEqual(c.costs.map((x) => x.item), ["unklar"]);

  c = read("Leider verliert er hinten links etwas Luft am Reifenventil.");
  assert.equal(c.unknown.length, 1);

  c = read("", { tuv: "12/2026" });
  assert.deepEqual(c.costs.map((x) => x.item), ["tuev"]);
  c = read("TÜV neu bei Kauf", { tuv: "12/2026" });
  assert.equal(c.costTotal, 0);
  c = read("", { accident: "DAMAGED" });
  assert.deepEqual(c.costs.map((x) => x.item), ["unfallMittel"]);
});

test("TÜV: ausgeschriebene Frist aus der Beschreibung erkennen", () => {
  const description = "Zu verkaufen Peugeot 108 mit TÜV bis September 2028 . Mit dabei sind vier neue Winterreifen auf Stahlfelgen.";
  const tuv = inspectionExpiryFromText(description);
  assert.equal(tuv, "09/2028");
  const condition = readCondition(golf({ description, tuv }), prices, { now: NOW });
  assert.equal(condition.tuvMonthsLeft, 22);
  assert.ok(!condition.costs.some((cost) => cost.item === "tuev"));

  assert.equal(inspectionExpiryFromText("HU/AU: gültig bis zum 15. März 2028"), "03/2028");
  assert.equal(inspectionExpiryFromText("TÜV bis 30.09.2028"), "09/2028");
  assert.equal(inspectionExpiryFromText("Ohne gültigen TÜV. Inspektion im September 2028."), null);
  assert.equal(inspectionExpiryFromText("TÜV bis 2028"), null);
});

test("Urteil: Kaufen, knapp, verhandeln, Finger weg – gerechnet mit 2.300 bis 3.000 € Gewinn", () => {
  const run = (price, description = "", extra = {}) => analyze({ subject: golf({ price, description, ...extra }), items: comps(), settings: DEFAULT_SETTINGS, meta: { step: 1 }, now: NOW });
  const base = run(9000);
  assert.equal(base.ok, true);
  const { sell, limit, target } = base.prices;
  assert.equal(limit, Math.floor((sell - 2300) / 50) * 50);
  assert.equal(target, Math.floor((sell - 3000) / 50) * 50);
  assert.equal(base.prices.discountPct, 5);

  assert.equal(run(target - 100).verdict.key, "KAUFEN");
  assert.equal(run(target + 300).verdict.key, "KNAPP");
  const negotiate = run(limit + 500);
  assert.equal(negotiate.verdict.key, "VERHANDELN");
  assert.match(negotiate.verdict.headline, new RegExp(`Verhandeln bis ${limit.toLocaleString("de-DE")}`));
  assert.equal(run(Math.round(limit * 1.25)).verdict.key, "FINGER_WEG");

  // Mechanische Schäden kosten nach Preisliste, Außenschäden werden ohne Preis genannt
  const damaged = run(9000, "Kratzer an der Tür. Kupplung rutscht.");
  // Mängel werden vorerst nur gezeigt, nicht vom Limit abgezogen.
  assert.equal(damaged.prices.limit, limit);
  assert.equal(damaged.prices.repairs, 900);
  assert.equal(damaged.prices.costs, 0);
  assert.ok(damaged.costs.some((c) => c.id === "lack" && c.noPrice && c.amount === 0));
  // Motorschaden / nicht fahrbereit / Totalschaden: Finger weg, egal wie günstig
  assert.equal(run(3000, "Motorschaden, nicht fahrbereit").verdict.key, "FINGER_WEG");
  // Getriebeschaden: deutlicher Hinweis, das Urteil richtet sich nach dem Preis
  const gearbox = run(3000, "Getriebeschaden, schaltet nicht mehr.");
  assert.notEqual(gearbox.verdict.key, "FINGER_WEG");
  assert.ok(gearbox.flags.some((f) => f.id === "ausschluss" && f.level === "warn"));
  // Unfall verschiebt das Urteil nicht mehr
  const risky = run(target - 100, "Der Wagen hatte einen Unfall vorne.");
  assert.equal(risky.verdict.key, "KAUFEN");
  // reparierter Vorschaden: Verkaufspreis mit Abschlag
  assert.ok(run(9000, "Vorschaden wurde fachgerecht repariert.").prices.sell < sell);
  // auffällig billig ohne Grund
  assert.ok(run(Math.round(base.prices.marketValue * 0.6)).flags.some((f) => f.id === "preisAuffaellig"));
});

test("zu wenige Vergleichsfahrzeuge oder fehlende Daten: keine Bewertung", () => {
  const few = analyze({ subject: golf(), items: comps(2), settings: DEFAULT_SETTINGS, now: NOW });
  assert.equal(few.ok, true);
  assert.equal(few.prices, null);
  assert.equal(few.verdict.headline, "Keine Bewertung möglich");
  const broken = analyze({ subject: golf({ mileageKm: null }), items: comps(), settings: DEFAULT_SETTINGS, now: NOW });
  assert.equal(broken.ok, false);
  assert.match(broken.error, /Kilometerstand/);
});

test("Modellwissen: Hinweis nur, wenn Motor eindeutig passt", () => {
  const ford = { source: "MOBILE_DE", id: "9", title: "Ford Fiesta 1.0 EcoBoost", make: "Ford", model: "Fiesta", price: 6000, regMonths: regMonths("05/2015"), mileageKm: 90000, powerPs: 100, ccm: 998, fuel: "PETROL", gearbox: "MANUAL", sellerType: "PRIVATE" };
  const list = comps(14, 9500).map((c) => ({ ...c, make: "Ford", model: "Fiesta", title: "Ford Fiesta", powerPs: 100, mileageKm: c.mileageKm + 10000, regMonths: c.regMonths - 46 }));
  const withCcm = analyze({ subject: ford, items: list, settings: DEFAULT_SETTINGS, now: NOW });
  assert.ok(withCcm.flags.some((f) => f.id === "ford-ecoboost-10"));
  const without = analyze({ subject: { ...ford, ccm: null }, items: list, settings: DEFAULT_SETTINGS, now: NOW });
  assert.ok(!without.flags.some((f) => f.id === "ford-ecoboost-10"));
});

test("Suche: Filter in drei Schritten und Adressen der Portale", () => {
  const subject = golf();
  const f1 = buildFilter(subject, 1);
  const f3 = buildFilter(subject, 3);
  assert.deepEqual([f1.yearMin, f1.yearMax, f1.kmMin, f1.kmMax], [2018, 2020, 64000, 96000]);
  assert.ok(f3.yearMin === 2016 && f3.kmMin < f1.kmMin && f3.psMax > f1.psMax);
  const mobile = new URL(mobileSearchUrl(f1, "25200;14;;", 2));
  assert.equal(mobile.searchParams.get("ms"), "25200;14;;");
  assert.equal(mobile.searchParams.get("fr"), "2018:2020");
  assert.equal(mobile.searchParams.get("ft"), "PETROL");
  assert.equal(mobile.searchParams.get("pageNumber"), "2");
  const as24 = new URL(autoscoutSearchUrl(f1));
  assert.equal(as24.pathname, "/lst/volkswagen/golf");
  assert.equal(as24.searchParams.get("powertype"), "kw");
  const ka = kleinanzeigenSearchUrls(f1);
  assert.equal(ka.length, 2);
  assert.match(ka[0].url, /anbieter:gewerblich\/anzeige:angebote\/c216\+autos\.ez_i:2018%2C2020\+autos\.fuel_s:benzin\+autos\.km_i:64000%2C96000\+autos\.marke_s:volkswagen\+autos\.model_s:golf\+autos\.shift_s:manuell$/);
  assert.equal(kleinanzeigenModel("BMW", "320"), "3er");
  assert.equal(kleinanzeigenModel("Mercedes-Benz", "C 180"), "c_klasse");
  assert.equal(mobileModelPage("Mercedes", "C 180"), "https://suchen.mobile.de/auto/mercedes-benz-c-180.html");
});

test("Links: nur echte Anzeigen der drei Portale", () => {
  assert.equal(portalOf("https://suchen.mobile.de/fahrzeuge/details.html?id=458598805"), "MOBILE_DE");
  assert.equal(listingIdOf("https://suchen.mobile.de/fahrzeuge/details.html?id=458598805&x=1"), "458598805");
  assert.equal(listingIdOf("https://www.kleinanzeigen.de/s-anzeige/vw-golf/2912345678-216-2189"), "2912345678");
  assert.equal(isListingUrl("https://www.autoscout24.de/angebote/vw-golf-benzin-f5e0f607-3d12-46e3-923e-e076685282ed"), true);
  assert.equal(isListingUrl("https://suchen.mobile.de/fahrzeuge/search.html?ms=1"), false);
  assert.equal(portalOf("https://mobile.de.evil.example/x"), null);
  assert.equal(portalOf("https://evil.example/?u=https://mobile.de"), null);
});

/* ------------------------------------------------------------ Portalseiten */

const flightScripts = (text) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += 700) chunks.push(text.slice(i, i + 700));
  return chunks.map((chunk) => `<script>self.__next_f.push([1,${JSON.stringify(chunk)}])</script>`).join("");
};

test("mobile.de: Trefferliste, Modellnummern und Anzeige aus den Flight-Daten", () => {
  const listings = [
    { id: 458598805, type: "topOfPage", attr: { cn: "DE", z: "95233", loc: "Helmbrechts", fr: "11/2019", pw: "85 kW (116 PS)", ft: "Benzin", ml: "71.500 km", cc: "999 cm³", tr: "Schaltgetriebe", pvo: "1" }, contact: { enumType: "DEALER" }, price: { grs: { amount: 13880 } }, make: { localized: "Volkswagen" }, model: { localized: "Golf" }, category: "Kleinwagen" },
    { id: 46986933031584, type: "regular", attr: { cn: "DE", fr: "01/2019", pw: "110 kW (150 PS)", ft: "Benzin", ml: "94.000 km", tr: "Schaltgetriebe" }, contact: { enumType: "FSBO" }, price: { grs: { amount: 14200 } }, make: { localized: "Volkswagen" }, model: { localized: "Golf" } },
    { id: 458598805, type: "regular", attr: { cn: "DE", fr: "11/2019", ml: "71.500 km" }, contact: { enumType: "DEALER" }, price: { grs: { amount: 13880 } } },
    { id: 7, attr: { cn: "AT", fr: "11/2019", ml: "1 km" }, price: { grs: { amount: 1 } } },
  ];
  const flight = `81:["$","$L81",null,{"searchParams":"vc=Car","searchResults":[{"id":"458598805"}]}]\n86:["$","$L8c",null,{"searchResults":{"numResultsTotal":675,"listings":${JSON.stringify(listings)}},"filterParams":{"vc":"Car","ms":"25200;14;;","dam":"false"}}]\n` +
    `d8:["$","$Lee",null,{"listingId":458598805,"x":{"title":"Volkswagen Golf VII \\"Comfortline\\""}}]\n`;
  const html = `<html><head><title>t</title><style>x</style></head><body>${flightScripts(flight)}</body></html>`;
  const parsed = parseMobileSearch(html);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.total, 675);
  assert.equal(parsed.items.length, 2);
  assert.deepEqual(
    [parsed.items[0].id, parsed.items[0].price, parsed.items[0].mileageKm, parsed.items[0].powerPs, parsed.items[0].fuel, parsed.items[0].gearbox, parsed.items[0].sellerType, parsed.items[0].title],
    ["458598805", 13880, 71500, 116, "PETROL", "MANUAL", "DEALER", 'Volkswagen Golf VII "Comfortline"']);
  assert.equal(parsed.items[1].sellerType, "PRIVATE");
  assert.deepEqual(parseMobileMs(html), { ok: true, ms: "25200;14;;", makeId: "25200", modelId: "14" });
  // verschlankt bleibt lesbar
  const slim = slimPage("MOBILE_DE", "search", html);
  assert.ok(slim.length < html.length);
  assert.equal(parseMobileSearch(slim).items.length, 2);
  assert.equal(parseMobileSearch("<html>captcha</html>").ok, false);

  const description = "Schöner Golf – Kratzer an der Tür.<br>Scheckheftgepflegt";
  const bytes = new TextEncoder().encode(description).length.toString(16);
  const listing = { attributes: [
    { tag: "damageCondition", value: "Gebrauchtfahrzeug, Unfallfrei" }, { tag: "mileage", value: "71.500 km" }, { tag: "power", value: "85 kW (116 PS)" },
    { tag: "cubicCapacity", value: "999 cm³" }, { tag: "fuel", value: "Benzin" }, { tag: "transmission", value: "Schaltgetriebe" },
    { tag: "firstRegistration", value: "11/2019" }, { tag: "numberOfPreviousOwners", value: "1" }, { tag: "hu", value: "Neu" }],
    shortTitle: "Volkswagen Golf", subTitle: "VII Comfortline", title: "Volkswagen Golf VII Comfortline", htmlDescription: "$75",
    contact: { enumType: "DEALER", name: "Autohaus", address2: "DE-95233 Helmbrechts" }, created: 1781795932, makeId: 25200, modelId: 14,
    make: { localized: "Volkswagen" }, model: { localized: "Golf" }, features: ["ABS", "Sitzheizung"], id: 458598805, price: { grs: { amount: 13880 }, type: "FIXED" }, isDamageCase: false };
  const detail = `<html><body>${flightScripts(`75:T${bytes},${description}\n49:["$","$L49",null,{"eventScope":"page-vip","listing":${JSON.stringify(listing)}}]\n`)}</body></html>`;
  const car = parseMobileListing(detail);
  assert.deepEqual([car.id, car.price, car.mileageKm, car.powerPs, car.ccm, car.owners, car.tuv, car.accident, car.sellerType, car.location],
    ["458598805", 13880, 71500, 116, 999, 1, "neu", "NONE", "DEALER", "95233 Helmbrechts"]);
  assert.equal(car.description, "Schöner Golf – Kratzer an der Tür.\nScheckheftgepflegt");
  assert.deepEqual(car.mobile, { makeId: 25200, modelId: 14 });
});

test("AutoScout24: Trefferliste aus __NEXT_DATA__", () => {
  const listings = [
    { id: "f5e0", url: "/angebote/x-f5e0", location: { countryCode: "DE", zip: "85375", city: "Neufahrn" }, price: { priceRaw: 18690 }, searchResultSection: "Main", seller: { type: "Dealer" },
      tracking: { firstRegistration: "05-2018", mileage: "100974", price: "18690" }, vehicle: { make: "Mercedes-Benz", model: "C 180", modelVersionInput: "Avantgarde", fuel: "Benzin", transmission: "Automatik", variant: "Limousine", engineDisplacementInCCM: "1.595 cm³", isCurrentlyDamaged: false },
      vehicleDetails: [{ ariaLabel: "Leistung", data: "115 kW (156 PS)" }] },
    { id: "p1", url: "/angebote/p1", location: { countryCode: "DE" }, price: { priceRaw: 17500 }, searchResultSection: "Main", seller: { type: "PrivateSeller" }, tracking: { firstRegistration: "03-2018", mileage: "90000" }, vehicle: { make: "Mercedes-Benz", model: "C 180", fuel: "Benzin", transmission: "Automatik" }, vehicleDetails: [] },
    { id: "r1", url: "/angebote/r1", searchResultSection: "Recommendations", price: { priceRaw: 1 }, vehicle: {} },
  ];
  const html = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { listings, numberOfResults: 151, numberOfPages: 8 } } })}</script></body></html>`;
  const parsed = parseAutoScoutSearch(slimPage("AUTOSCOUT24", "search", `<style>x</style>${html}`));
  assert.equal(parsed.total, 151);
  assert.equal(parsed.items.length, 2);
  assert.deepEqual([parsed.items[0].price, parsed.items[0].mileageKm, parsed.items[0].powerPs, parsed.items[0].ccm, parsed.items[0].gearbox, parsed.items[0].sellerType, parsed.items[0].firstRegistration],
    [18690, 100974, 156, 1595, "AUTOMATIC", "DEALER", "05/2018"]);
  assert.equal(parsed.items[1].sellerType, "PRIVATE");
});

test("echte Anzeige: Verneinung, Tippfehler und erledigte Arbeit", () => {
  const c = readCondition(golf({ description: "Der Wagen hat keine Mängel beim fahren und\nAußerdem hat sie Zahnriem und Nockenwellen neu\nWarndreieck und Verbandskasten ist dabei und Neu" }), prices, { now: NOW });
  assert.equal(c.costTotal, 0);
  assert.equal(c.unknown.length, 0);
  assert.ok(c.positives.some((p) => p.id === "neu-zahnriemen"));
});

test("anderes Auto mit ähnlichem Namen zählt nicht (Golf Sportsvan gegen Golf)", () => {
  const selected = selectComparables(golf({ body: "Limousine" }), [
    { key: "A:1", source: "AUTOSCOUT24", id: "1", title: "Volkswagen Golf Sportsvan 1.0 TSI", make: "Volkswagen", model: "Golf Sportsvan", body: "Golf Sportsvan", price: 14000, mileageKm: 80000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" },
    { key: "A:2", source: "AUTOSCOUT24", id: "2", title: "Volkswagen Golf Variant 1.0 TSI", make: "Volkswagen", model: "Golf Variant", body: "Golf Variant", price: 14500, mileageKm: 81000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" },
  ]);
  assert.deepEqual(selected.dealer.map((car) => car.id), ["2"]);
  assert.equal(selected.excluded[0].reason, "andere Karosserieform");
});

/* ------------------------------------------------------------ Generationen und Portaldaten */

import { generationCheck, generationEntry, generationOf } from "../lib/marktanalyse/generation.js";
import { GENERATION_INDEX } from "../lib/marktanalyse/knowledge/generations.js";
import { euroClass, ratingLevel } from "../lib/marktanalyse/text.js";

test("Generation: Titel schlägt Jahr, Motorangaben und Türen zählen nicht", () => {
  const gen = (make, model, title, ez) => generationOf(generationEntry(make, model), { title, regMonths: ez ? regMonths(ez) : null });
  assert.equal(gen("VW", "Golf", "Volkswagen Golf VII 1.0 TSI", "02/2020").name, "Golf 7");
  assert.equal(gen("VW", "Golf", "VW Golf 8 Life", "02/2020").name, "Golf 8");
  assert.equal(gen("VW", "Golf", "Volkswagen Golf 2.0 TDI 5-Türer", "06/2016").name, "Golf 7");
  assert.equal(gen("VW", "Golf", "Volkswagen Golf 1.5 TSI", "02/2020").name, null); // Wechseljahr, kein Hinweis
  assert.deepEqual(gen("VW", "Golf", "Volkswagen Golf 1.5 TSI", "02/2020").candidates, ["Golf 7", "Golf 8"]);
  assert.equal(gen("BMW", "320", "BMW 320d Touring F31 Sport Line", "05/2018").name, "3er F30");
  assert.equal(gen("BMW", "320", "BMW 320d Touring", "05/2015").name, "3er F30");
  assert.equal(gen("Mercedes-Benz", "C 180", "Mercedes-Benz C 180 T Avantgarde", "03/2017").name, "C-Klasse W205");
  assert.equal(gen("Opel", "Astra", "Opel Astra K 1.4 Turbo", "03/2016").name, "Astra K");
  assert.equal(gen("Opel", "Corsa", "Opel Corsa 1.2 Edition", "08/2016").name, "Corsa E");
  assert.equal(gen("Audi", "A3", "Audi A3 1.6 8V Attraction", "05/2001").name, "A3 8L"); // 8V = Ventile, kein Code
  assert.equal(gen("Kia", "Ceed", "Kia Ceed 1.4 Radio CD Klima", "05/2015").name, "Ceed JD"); // "CD" ist das Radio
  assert.equal(generationEntry("VW", "Golf Sportsvan"), null);
  assert.equal(generationEntry("Tesla", "Model 3"), null);
  // jede Generation hat gültige Jahre, jede Kennung ergibt ein Suchmuster
  for (const entry of GENERATION_INDEX) for (const g of entry.gens) {
    assert.ok(g.from >= 1990 && (g.to === null || g.to >= g.from), g.name);
    assert.equal(g.patterns.length, g.tokens.length, g.name);
  }
});

test("andere Generation fliegt raus; AutoScout24-Nummer entscheidet im Wechseljahr", () => {
  const car = (extra) => ({ make: "Volkswagen", model: "Golf", title: "Volkswagen Golf 1.5 TSI", price: 17000, mileageKm: 60000, regMonths: regMonths("03/2020"), powerPs: 130, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER", ...extra });
  const subject = golf({ title: "VW Golf VII 1.5 TSI", regMonths: regMonths("02/2020"), mileageKm: 60000, powerPs: 130 });
  const items = [
    car({ key: "A:1", source: "AUTOSCOUT24", id: "1", title: "Volkswagen Golf VII Highline", as24Gen: 7 }),
    car({ key: "A:2", source: "AUTOSCOUT24", id: "2", title: "Volkswagen Golf VII Join", as24Gen: 7, price: 16500 }),
    car({ key: "A:3", source: "AUTOSCOUT24", id: "3", title: "Volkswagen Golf 1.5 TSI Life", as24Gen: 8, price: 21000 }), // kein Hinweis im Titel
    car({ key: "A:4", source: "AUTOSCOUT24", id: "4", title: "Volkswagen Golf 1.5 TSI Comfortline", as24Gen: 7, price: 16900 }),
    car({ key: "M:5", source: "MOBILE_DE", id: "5", title: "Volkswagen Golf VIII Style", price: 22000 }),
    car({ key: "M:6", source: "MOBILE_DE", id: "6", title: "Volkswagen Golf 1.5 TSI", price: 17200 }), // unklar: bleibt, zählt weniger
    car({ key: "M:7", source: "MOBILE_DE", id: "7", title: "Volkswagen Golf VII Sound", price: 16800, regMonths: regMonths("06/2019") }),
  ];
  const check = generationCheck(subject, items);
  assert.equal(check.subject.name, "Golf 7");
  const selected = selectComparables(subject, items);
  assert.deepEqual(selected.dealer.map((c) => c.id).sort(), ["1", "2", "4", "6", "7"]);
  assert.deepEqual(selected.excluded.map((c) => [c.id, c.reason]), [["5", "andere Generation"], ["3", "andere Generation"]]);
  assert.equal(selected.dealer.find((c) => c.id === "6").generationUnsure, true);
  assert.equal(selected.dealer.find((c) => c.id === "1").generationUnsure, false);

  // Fahrzeug ohne Hinweis im Titel: Treffer mit gleicher EZ sind sich einig → Generation gefunden
  const plain = generationCheck(golf({ title: "VW Golf 1.5 TSI", regMonths: regMonths("02/2020") }), items.filter((i) => i.as24Gen === 7));
  assert.equal(plain.subject.name, "Golf 7");
  // gar kein Hinweis: unklar, mit Warnung
  const unknown = generationCheck(golf({ title: "VW Golf 1.5 TSI", regMonths: regMonths("02/2020") }), [items[5]]);
  assert.equal(unknown.subject.name, null);
  assert.match(unknown.subject.note, /Golf 7 oder Golf 8/);
});

test("Modell ohne Tabelleneintrag: AutoScout24-Generationen trennen trotzdem", () => {
  const subject = { source: "AUTOSCOUT24", id: "s", title: "Suzuki Vitara 1.4", make: "Suzuki", model: "Vitara", price: 15000, regMonths: regMonths("05/2019"), mileageKm: 50000, as24Gen: 4 };
  const item = (id, gen, ez, source = "AUTOSCOUT24") => ({ key: `${source}:${id}`, source, id, title: "Suzuki Vitara", make: "Suzuki", model: "Vitara", price: 15000, mileageKm: 50000, regMonths: regMonths(ez), sellerType: "DEALER", as24Gen: gen });
  const items = [item("1", 4, "03/2019"), item("2", 4, "09/2019"), item("3", 3, "02/2014"), item("4", 3, "06/2014"), item("5", undefined, "04/2014", "MOBILE_DE"), item("6", undefined, "07/2019", "MOBILE_DE")];
  const selected = selectComparables(subject, items);
  assert.deepEqual(selected.dealer.map((c) => c.id).sort(), ["1", "2", "6"]);
  assert.ok(selected.excluded.every((c) => c.reason === "andere Generation"));
});

test("Portaldaten: Euro-Norm, Preissenkung, Preisbewertung", () => {
  assert.equal(euroClass("Euro6d-TEMP"), 6);
  assert.equal(euroClass("Euro 5"), 5);
  assert.equal(ratingLevel("VERY_GOOD_PRICE"), 1);
  assert.equal(ratingLevel("good-price"), 2);
  assert.equal(ratingLevel("fair-price"), 3);
  assert.equal(ratingLevel("Erhöhter Preis"), 4);

  const diesel = (extra) => golf({ fuel: "DIESEL", title: "VW Golf 2.0 TDI", regMonths: regMonths("03/2015"), ...extra });
  const list = comps().map((c) => ({ ...c, fuel: "DIESEL", regMonths: c.regMonths - 48, emission: 6 }));
  const euro6 = analyze({ subject: diesel({ emission: 6 }), items: list, settings: DEFAULT_SETTINGS, now: NOW });
  const euro5 = analyze({ subject: diesel({ emission: 5 }), items: list.map((c) => ({ ...c, emission: 5 })), settings: DEFAULT_SETTINGS, now: NOW });
  assert.ok(!euro6.flags.some((f) => f.id === "dieselEuro"));
  assert.ok(euro5.flags.some((f) => f.id === "dieselEuro"));
  assert.equal(euro5.prices.deductPct, 5);
  // Euro 6 gegen Euro 5 wird nicht verglichen
  const mixed = analyze({ subject: diesel({ emission: 5 }), items: list, settings: DEFAULT_SETTINGS, now: NOW });
  assert.equal(mixed.prices, null);
  assert.ok(mixed.market.excluded.every((c) => c.reason === "andere Schadstoffklasse"));

  const reduced = analyze({ subject: golf({ oldPrice: 9800, rating: 1 }), items: comps().map((c, i) => ({ ...c, oldPrice: i % 2 ? c.price + 400 : null })), settings: DEFAULT_SETTINGS, now: NOW });
  assert.ok(reduced.flags.some((f) => f.id === "preisGesenkt"));
  assert.ok(reduced.flags.some((f) => f.id === "marktReduziert"));
  assert.equal(reduced.prices.deductPct, 1);
  assert.equal(reduced.facts.oldPrice, 9800);
  assert.equal(reduced.facts.portalRating, "Sehr guter Preis");
  const pricey = analyze({ subject: golf({ price: 14000, rating: 2 }), items: comps(), settings: DEFAULT_SETTINGS, now: NOW });
  assert.ok(pricey.flags.some((f) => f.id === "portalGuenstig"));
});

/* ------------------------------------------------------------ Ausstattungslinien */

import { trimOf } from "../lib/marktanalyse/trim.js";

test("Ausstattungslinie: aus dem Titel, Sport vor Top vor Mittel vor Basis", () => {
  const level = (make, title) => trimOf(make, title)?.level ?? null;
  assert.equal(level("VW", "Volkswagen Golf VII 1.0 TSI Trendline BMT"), "base");
  assert.equal(level("VW", "Volkswagen Golf VII Comfortline"), "mid");
  assert.equal(level("VW", "Volkswagen Golf 1.5 TSI Highline R-Line"), "sport");
  assert.equal(level("VW", "Volkswagen Golf VII 1.0 TSI IQ.DRIVE"), "mid");
  assert.equal(level("VW", "Volkswagen Golf 2.0 TDI 5-Türer Klima"), null);
  assert.equal(level("Audi", "Audi A4 Avant 2.0 TDI S-Line Navi"), "sport");
  assert.equal(level("Audi", "Audi A4 Avant 2.0 TDI Sline"), "sport");
  assert.equal(level("Audi", "Audi A3 Sportback 1.4 TFSI Attraction"), "base"); // "Sportback" ist keine Linie
  assert.equal(level("BMW", "BMW 320d Touring M Sportpaket LED"), "sport");
  assert.equal(level("BMW", "BMW 320d Touring Luxury Line"), "top");
  assert.equal(level("Mercedes-Benz", "Mercedes-Benz C 180 T Avantgarde"), "mid");
  assert.equal(level("Mercedes-Benz", "Mercedes-Benz C 180 AMG-Line Night"), "sport");
  assert.equal(level("Opel", "Opel Astra K 1.4 Turbo Innovation"), "top");
  assert.equal(level("Opel", "Opel Corsa 1.2 Selection"), "base");
  assert.equal(level("Opel", "Opel Astra Sports Tourer 1.6 CDTI"), null); // "Sports Tourer" ist die Karosserie
  assert.equal(level("Ford", "Ford Focus 1.0 EcoBoost ST-Line"), "sport");
  assert.equal(level("Ford", "Ford Focus Turnier 1.5 TDCi Start-Stopp"), null); // "Start" ≠ ST
  assert.equal(level("Suzuki", "Suzuki Swift 1.2 Comfort+"), "top");
  assert.equal(level("Suzuki", "Suzuki Swift 1.2 Comfort"), "mid");
  assert.equal(level("Tesla", "Tesla Model 3 Performance"), null);
});

test("Linien im Vergleich: Basis gegen Top fliegt raus, Nachbarstufe wird umgerechnet", () => {
  const car = (id, title, price) => ({ key: `M:${id}`, source: "MOBILE_DE", id, title, make: "Volkswagen", model: "Golf", price, mileageKm: 80000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" });
  const subject = golf({ title: "VW Golf VII 1.0 TSI Trendline" });
  const items = [car("1", "Volkswagen Golf VII Trendline", 12000), car("2", "Volkswagen Golf VII Comfortline", 13000), car("3", "Volkswagen Golf VII Highline", 14500), car("4", "Volkswagen Golf VII 1.0 TSI", 12500), car("5", "Volkswagen Golf VII Trendline Klima", 12200)];
  const market = marketValue(subject, items, { step: 1 });
  assert.deepEqual(market.excluded.map((c) => [c.id, c.reason]), [["3", "andere Ausstattungslinie"]]);
  const by = Object.fromEntries(market.dealer.map((c) => [c.id, c]));
  assert.equal(by["1"].adjusted, 12000);                 // gleiche Linie: unverändert
  assert.equal(by["2"].adjusted, 13000 - 520);           // Comfortline → Trendline: −4 %
  assert.equal(by["4"].adjusted, 12500);                 // Linie unbekannt: kein Preisabzug …
  assert.ok(by["4"].weight < by["1"].weight && by["2"].weight < by["4"].weight); // … aber weniger Gewicht
  assert.equal(market.trim.label, "Trendline (Basis)");
  assert.equal(by["2"].trim, "Comfortline (Mittel)");
  // Fahrzeug ohne erkennbare Linie: keine Korrektur, niemand fliegt raus
  const plain = marketValue(golf({ title: "VW Golf VII 1.0 TSI" }), items, { step: 1 });
  assert.equal(plain.excluded.length, 0);
  assert.ok(plain.dealer.every((c) => c.adjusted === c.price));
});

/* ------------------------------------------------------------ Zahnriemen / Steuerkette */

import { timingOf } from "../lib/marktanalyse/timing.js";

test("Zahnriemen oder Kette: Motor über Hubraum, Leistung und Baujahr", () => {
  const now = new Date("2026-11-15");
  const of = (make, ez, km, fuel, ccm, ps, title = "") => timingOf({ make, title, regMonths: regMonths(ez), mileageKm: km, fuel, ccm, powerPs: ps }, { now });
  assert.deepEqual([of("VW", "03/2012", 185000, "DIESEL", 1598, 105).drive, of("VW", "03/2012", 185000, "DIESEL", 1598, 105).state], ["belt", "cost"]);
  assert.equal(of("VW", "03/2012", 120000, "DIESEL", 1598, 105).state, null);            // noch nicht fällig
  assert.equal(of("VW", "03/2012", 185000, "DIESEL", null, 105, "Golf 1.6 TDI").state, "ask"); // Hubraum nur aus dem Titel → nur fragen
  assert.equal(of("VW", "03/2016", 300000, "DIESEL", 1968, 150).state, "ask");           // weit über dem Intervall: schon gemacht?
  assert.equal(of("VW", "03/2012", 130000, "PETROL", 1390, 122).drive, "chain");
  assert.equal(of("VW", "03/2013", 130000, "PETROL", null, 122, "Golf 1.4 TSI").drive, "unclear"); // Jahr des Motorwechsels
  assert.equal(of("BMW", "03/2014", 200000, "DIESEL", 1995, 184).drive, "chain");
  assert.equal(of("Mercedes-Benz", "03/2016", 140000, "DIESEL", 2143, 136).drive, "chain");
  assert.equal(of("Mercedes-Benz", "03/2016", 140000, "DIESEL", 1461, 109).drive, "belt"); // Renault-Diesel geht vor
  assert.equal(of("Opel", "05/2010", 80000, "PETROL", 1598, 115).drive, "belt");
  assert.equal(of("Peugeot", "05/2017", 95000, "PETROL", 1199, 82).state, "ask");         // Richtwert → keine Kosten
  assert.equal(of("Tesla", "05/2020", 90000, "ELECTRIC", null, 300), null);
  assert.equal(of("Jaguar", "05/2015", 90000, "DIESEL", 1999, 180), null);                // nicht in der Tabelle
});

test("Zahnriemen fällig: Warnung und Frage, aber keine Kosten", () => {
  const now = new Date("2026-11-15");
  const tdi = (description) => golf({ title: "VW Golf 1.6 TDI Comfortline", fuel: "DIESEL", ccm: 1598, powerPs: 105, regMonths: regMonths("03/2012"), firstRegistration: "03/2012", mileageKm: 185000, description });
  const items = comps().map((c) => ({ ...c, fuel: "DIESEL", powerPs: 105, regMonths: regMonths("03/2012"), mileageKm: 180000 }));
  const due = analyze({ subject: tdi(""), items, now });
  assert.ok(!due.costs.some((c) => c.item === "zahnriemen"));
  assert.ok(due.rulesFired.includes("zahnriemenFaellig"));
  assert.match(due.facts.timing, /Zahnriemen/);
  const done = analyze({ subject: tdi("Zahnriemen wurde bei 170.000 km neu gemacht."), items, now });
  assert.ok(!done.costs.some((c) => c.item === "zahnriemen"));
  assert.ok(!done.rulesFired.includes("zahnriemenFaellig"));
  assert.equal(due.prices.limit, done.prices.limit);
});

test("Vom Portal als zu teuer bewertete Angebote werden gezeigt, aber nicht gerechnet", () => {
  const car = (id, price, rating) => ({ key: `M:${id}`, source: "MOBILE_DE", id, title: "Volkswagen Golf VII 1.0 TSI", make: "Volkswagen", model: "Golf", price, rating, mileageKm: 80000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER" });
  const fair = [car("1", 12000, 3), car("2", 12200, 2), car("3", 11900, 3), car("4", 12100, 1)];
  const subject = golf({ title: "VW Golf VII 1.0 TSI" });
  const base = marketValue(subject, fair, { step: 1 });
  const withHigh = marketValue(subject, [...fair, car("5", 15900, 5), car("6", 15500, 4)], { step: 1 });
  assert.equal(withHigh.value, base.value);
  assert.equal(withHigh.n, base.n);
  assert.deepEqual(withHigh.dealer.filter((c) => c.notCounted).map((c) => c.id).sort(), ["5", "6"]);
  assert.equal(withHigh.excluded.length, 0);
  const weightOf = (id) => withHigh.dealer.find((c) => c.id === id).weight;
  const twin = marketValue(subject, [car("a", 12050, 2), { ...car("b", 12050, 3), mileageKm: 80001 }, ...fair], { step: 1 });
  const w = (id) => twin.dealer.find((c) => c.id === id).weight;
  assert.ok(w("b") < w("a"));
  assert.ok(weightOf("1") > 0);
});

test("Ceed im Jahr des Modellwechsels: Leistung entscheidet die Generation", () => {
  const entry = generationEntry("Kia", "Ceed");
  assert.equal(generationOf(entry, { title: "Kia Ceed 1.4 T-GDI Spirit", regMonths: regMonths("07/2018"), powerPs: 140 }).name, "Ceed CD");
  assert.equal(generationOf(entry, { title: "Kia Ceed SW 1.6 GDI", regMonths: regMonths("02/2018"), powerPs: 135 }).name, "Ceed JD");
  assert.equal(generationOf(entry, { title: "Kia Ceed 1.0 T-GDI", regMonths: regMonths("06/2018"), powerPs: 120 }).name, null);
});

test("Parkkratzer ist ein Außenschaden, \"leider\" allein kein Hinweis", () => {
  const description = "Ein kleiner optischer Mangel befindet sich vorne links in Form eines Parkkratzers. Wir geben das Auto schweren Herzens ab, da es leider zu klein geworden ist.";
  const c = readCondition(golf({ description }), DEFAULT_SETTINGS.prices, { now: NOW });
  assert.ok(c.costs.some((x) => x.id === "lack" && x.noPrice));
  assert.equal(c.unknown.length, 0);
});

test("Dasselbe Auto zweimal auf einem Portal zählt einmal", () => {
  const car = (id, location) => ({ key: `A:${id}`, source: "AUTOSCOUT24", id, title: "Volkswagen Golf VII 1.0 TSI", make: "Volkswagen", model: "Golf", price: 12000, rating: 2, mileageKm: 80000, regMonths: regMonths("03/2019"), powerPs: 115, fuel: "PETROL", gearbox: "MANUAL", sellerType: "DEALER", location });
  const other = (id, price) => ({ ...car(id, "Bonn"), key: `A:${id}`, id, price, mileageKm: 81000 + Number(id) });
  const m = marketValue(golf({ title: "VW Golf VII 1.0 TSI" }), [car("1", "Essen"), car("2", "Köln"), other("3", 12100), other("4", 11900)], { step: 1 });
  assert.equal(m.dealer.filter((c) => c.price === 12000 && c.mileageKm === 80000).length, 1);
});

test("Jedes Modell: im Jahr des Modellwechsels entscheidet die gelernte Leistung", () => {
  const car = (id, ez, ps, title = "Volkswagen Golf 1.5 TSI") => ({ key: `M:${id}`, source: "MOBILE_DE", id, title, make: "Volkswagen", model: "Golf", price: 15000 + Number(id), mileageKm: 50000 + Number(id), regMonths: regMonths(ez), powerPs: ps });
  const items = [car("1", "03/2017", 150), car("2", "05/2017", 150), car("3", "03/2022", 130), car("4", "06/2022", 130), car("5", "06/2020", 130), car("6", "06/2020", 150), car("7", "06/2020", 110)];
  const check = generationCheck({ make: "Volkswagen", model: "Golf", title: "VW Golf VII 1.5 TSI", regMonths: regMonths("05/2018"), powerPs: 150 }, items);
  assert.equal(check.verdictFor(items[4]), "other"); // 130 PS gab es hier nur beim Golf 8
  assert.equal(check.verdictFor(items[5]), "same"); // 150 PS nur beim Golf 7 gesehen
  assert.equal(check.verdictFor(items[6]), "unsure"); // 110 PS: nichts gelernt
});
