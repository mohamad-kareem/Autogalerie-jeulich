/**
 * Marktanalyse – Vergleichsfahrzeuge auswählen, bereinigen, angleichen, gewichten
 * und daraus den Marktwert bilden. Rein, ohne Netzwerk und Datenbank.
 */

import { TUNING } from "./knowledge/defaults.js";
import { generationCheck } from "./generation.js";
import { makeName } from "./search.js";
import { trimOf } from "./trim.js";
import { bodyKey, clamp, norm, squash } from "./text.js";

const SOURCE_RANK = { MOBILE_DE: 0, AUTOSCOUT24: 1, KLEINANZEIGEN: 2 };

const BAD_TITLE = [
  [/unfall(?!frei)|motorschaden|getriebeschaden|defekt|bastler|teiletraeger|ausschlacht|hagelschaden|brandschaden|wasserschaden|nicht fahrbereit|totalschaden/, "beschädigt / defekt laut Titel"],
  [/\bexport\b|nur an (haendler|gewerbe)|gewerbe ?\/ ?export|haendler ?\/ ?export/, "Export- / Händlerangebot"],
  [/ohne tuev|tuev abgelaufen|kein tuev/, "ohne TÜV"],
  [/leasing(angebot|uebernahme|rate|vertrag)|\bmtl\b|monatlich|monatsrate|finanzierungsuebernahme/, "Leasing- / Ratenangebot"],
  [/\bsuche\b|ankauf|wir kaufen|tausch(e)? gegen/, "kein Verkaufsangebot"],
];

/** Passt der Treffer zum Modell? Portale mit eigenem Modellfeld sind zuverlässig, Titel nicht. */
export function matchesModel(item, subject) {
  const wanted = squash(subject.model);
  if (!wanted) return true;
  if (item.make && makeName(item.make) !== makeName(subject.make)) return false;
  if (item.model) {
    const have = squash(item.model);
    return have === wanted || have.startsWith(wanted) || wanted.startsWith(have);
  }
  // Nur ein Titel (Kleinanzeigen): das Modell muss darin vorkommen ("320" findet "320d").
  // Es reicht das erste Wort ("cee'd Sportswagon" → "ceed"); die Karosserie prüft die Suche.
  const title = squash(item.title);
  if (title.includes(wanted)) return true;
  const first = squash(norm(String(subject.model).replace(/['’`´]/g, "")).split(" ")[0]);
  if (first.length >= 3 && title.includes(first)) return true;
  const digits = wanted.match(/\d{3}/)?.[0];
  return Boolean(digits && wanted.length <= 4 && title.includes(digits));
}

/** Ausstattungslinie des analysierten Fahrzeugs (Titel und Variante). */
export const subjectTrimOf = (subject) => trimOf(subject.make, `${subject.title || ""} ${subject.variant || ""}`);

/**
 * Sortiert die Treffer in brauchbare Händlerangebote, Privatangebote und
 * Ausgeschlossene (mit Grund).
 */
export function selectComparables(subject, items, generation = generationCheck(subject, items)) {
  const dealer = [];
  const priv = [];
  const excluded = [];
  const out = (item, reason) => excluded.push({ ...item, reason });
  const subjectBody = bodyKey(`${subject.body || ""} ${subject.title || ""}`);
  const subjectTrim = subjectTrimOf(subject);

  const byIdentity = new Map();
  const ordered = [...items].sort((a, b) => (SOURCE_RANK[a.source] ?? 9) - (SOURCE_RANK[b.source] ?? 9));

  for (const item of ordered) {
    if (!item || !Number.isFinite(item.price) || item.price < 500) { if (item) out(item, "kein gültiger Preis"); continue; }
    if (subject.source === item.source && subject.id && String(subject.id) === String(item.id)) continue;
    if (!Number.isFinite(item.mileageKm) || !Number.isFinite(item.regMonths)) { out(item, "Kilometerstand oder Erstzulassung fehlt"); continue; }
    // dasselbe Auto über ein anderes Portal: gleicher Preis, km und EZ wie die analysierte Anzeige
    if (item.price === subject.price && item.mileageKm === subject.mileageKm && item.regMonths === subject.regMonths) continue;
    if (!matchesModel(item, subject)) { out(item, "anderes Modell"); continue; }
    if (item.fuel && subject.fuel && item.fuel !== subject.fuel &&
      !(/HYBRID/.test(item.fuel) && /HYBRID/.test(subject.fuel))) { out(item, "anderer Kraftstoff"); continue; }
    if (item.gearbox && subject.gearbox && item.gearbox !== subject.gearbox) { out(item, "anderes Getriebe"); continue; }
    const sameGeneration = generation.verdictFor(item);
    if (sameGeneration === "other") { out(item, "andere Generation"); continue; }
    // Diesel: Euro 6 und Euro 5 (oder älter) sind am Markt zwei verschiedene Autos.
    if (subject.fuel === "DIESEL" && subject.emission && item.emission && (subject.emission >= 6) !== (item.emission >= 6)) { out(item, "andere Schadstoffklasse"); continue; }
    if (item.damaged) { out(item, "als beschädigt gekennzeichnet"); continue; }
    const title = norm(item.title);
    const bad = BAD_TITLE.find(([pattern]) => pattern.test(title));
    if (bad) { out(item, bad[1]); continue; }
    if (subject.powerPs && item.powerPs && Math.abs(item.powerPs - subject.powerPs) / subject.powerPs > 0.25) { out(item, "deutlich andere Leistung"); continue; }
    const body = bodyKey(`${item.body || ""} ${item.title || ""}`);
    if (subjectBody && body && subjectBody !== body && [subjectBody, body].some((b) => ["CABRIO", "COUPE", "VAN", "SUV"].includes(b))) { out(item, "andere Karosserieform"); continue; }

    // Basis gegen Top oder Sport: zu verschieden für einen Vergleich.
    const trim = trimOf(item.make || subject.make, item.title);
    if (subjectTrim && trim && Math.abs(subjectTrim.rank - trim.rank) >= 2) { out({ ...item, trim: trim.label }, "andere Ausstattungslinie"); continue; }

    // dasselbe Auto auf zwei Portalen
    const identity = `${item.price}|${item.mileageKm}|${item.regMonths}`;
    const twin = byIdentity.get(identity);
    if (twin && twin.source !== item.source) {
      twin.alsoOn = [...new Set([...(twin.alsoOn || []), item.source])];
      continue;
    }
    const kept = { ...item, bodyKey: body, generationUnsure: sameGeneration === "unsure", trim: trim?.label || null, trimLevel: trim?.level || null };
    byIdentity.set(identity, kept);
    (kept.sellerType === "PRIVATE" ? priv : dealer).push(kept);
  }
  return { dealer, private: priv, excluded };
}

/* ------------------------------------------------------------ Wertverlust */

/** Kleinste Quadrate: Preis = a + b·km + c·Alter(Monate). */
function regression(cars) {
  const n = cars.length;
  if (n < 12) return null;
  const mean = (f) => cars.reduce((sum, car) => sum + f(car), 0) / n;
  const mk = mean((c) => c.mileageKm);
  const ma = mean((c) => -c.regMonths);
  const mp = mean((c) => c.price);
  let skk = 0, saa = 0, ska = 0, skp = 0, sap = 0;
  for (const car of cars) {
    const k = car.mileageKm - mk;
    const a = -car.regMonths - ma;
    const p = car.price - mp;
    skk += k * k; saa += a * a; ska += k * a; skp += k * p; sap += a * p;
  }
  const det = skk * saa - ska * ska;
  if (!(Math.abs(det) > 1e-6) || skk === 0 || saa === 0) return null;
  return { perKm: -((skp * saa - sap * ska) / det), perMonth: -((sap * skk - skp * ska) / det), n };
}

/**
 * Wertverlust je km und je Monat für dieses Modell.
 * Reihenfolge: aus dem Gedächtnis (viele frühere Angebote) → aus den aktuellen
 * Vergleichsfahrzeugen → Standardwerte. Unplausible Rechenwerte werden verworfen.
 */
export function depreciation(cars, memory = null) {
  const prices = cars.map((c) => c.price).sort((a, b) => a - b);
  const typical = prices.length ? prices[Math.floor(prices.length / 2)] : 10000;
  const base = {
    perKm: (typical * TUNING.lossPer1000KmPct) / 100 / 1000,
    perMonth: (typical * TUNING.lossPerMonthPct) / 100,
  };
  const sane = (r) => r && r.perKm > base.perKm * 0.3 && r.perKm < base.perKm * 3 && r.perMonth > 0 && r.perMonth < base.perMonth * 3;
  if (memory && memory.n >= 25 && sane(memory)) {
    return { perKm: (memory.perKm + base.perKm) / 2, perMonth: (memory.perMonth + base.perMonth) / 2, from: "gedaechtnis", n: memory.n };
  }
  const own = regression(cars);
  if (sane(own)) {
    return { perKm: (own.perKm + base.perKm) / 2, perMonth: (own.perMonth + base.perMonth) / 2, from: "vergleich", n: own.n };
  }
  return { ...base, from: "standard", n: 0 };
}

export { regression };

/* ------------------------------------------------------------ angleichen und gewichten */

export function adjustAndWeigh(subject, cars, rates) {
  const subjectTrim = subjectTrimOf(subject);
  const subjectBody = bodyKey(`${subject.body || ""} ${subject.title || ""}`);
  return cars.map((car) => {
    const dKm = car.mileageKm - subject.mileageKm;
    const dMonths = subject.regMonths - car.regMonths; // > 0: Vergleichsfahrzeug ist älter
    let adjust = rates.perKm * dKm + rates.perMonth * dMonths;
    // Ausstattungslinie: Preis auf die Stufe des analysierten Autos umrechnen.
    if (subjectTrim && car.trimLevel) adjust += (car.price * (TUNING.trimValuePct[subjectTrim.level] - TUNING.trimValuePct[car.trimLevel])) / 100;
    const cap = (car.price * TUNING.maxAdjustPct) / 100;
    adjust = clamp(adjust, -cap, cap);

    const kmScale = 0.15 * subject.mileageKm + 5000;
    const psGap = subject.powerPs && car.powerPs ? Math.abs(car.powerPs - subject.powerPs) / (0.08 * subject.powerPs + 3) : 1; // Leistung unbekannt (Kleinanzeigen-Trefferliste): zählt höchstens halb
    let weight = 1 / (1 + (dKm / kmScale) ** 2 + (dMonths / 12) ** 2 + psGap ** 2);
    if (subjectBody && car.bodyKey && subjectBody !== car.bodyKey) weight *= 0.6;
    if (car.sellerType === "UNKNOWN") weight *= 0.8;
    if (car.generationUnsure) weight *= TUNING.unsureGenerationWeight;
    if (TUNING.ratingWeight[car.rating]) weight *= TUNING.ratingWeight[car.rating];
    if (subjectTrim && !car.trimLevel) weight *= TUNING.trimUnknownWeight;
    else if (subjectTrim && car.trimLevel !== subjectTrim.level) weight *= TUNING.trimNeighbourWeight;
    return { ...car, adjust: Math.round(adjust), adjusted: Math.round(car.price + adjust), weight: Math.round(weight * 1000) / 1000 };
  });
}

/** Gewichtetes Quantil. */
export function weightedQuantile(cars, q, value = (car) => car.adjusted) {
  const sorted = [...cars].sort((a, b) => value(a) - value(b));
  const total = sorted.reduce((sum, car) => sum + car.weight, 0);
  if (!sorted.length || total <= 0) return null;
  let running = 0;
  for (const car of sorted) {
    running += car.weight;
    if (running >= total * q) return value(car);
  }
  return value(sorted[sorted.length - 1]);
}

/** Ausreißer: angeglichener Preis weit weg von der Mitte der Gruppe. */
export function dropOutliers(cars) {
  if (cars.length < 5) return { kept: cars, dropped: [] };
  const median = weightedQuantile(cars, 0.5);
  const deviations = cars.map((car) => Math.abs(car.adjusted - median)).sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)] || 0;
  const band = Math.max(3 * 1.4826 * mad, median * 0.18);
  const kept = [];
  const dropped = [];
  for (const car of cars) {
    if (Math.abs(car.adjusted - median) > band) dropped.push({ ...car, reason: car.adjusted < median ? "Preis-Ausreißer nach unten" : "Preis-Ausreißer nach oben" });
    else kept.push(car);
  }
  return { kept, dropped };
}

/**
 * Der ganze Weg von den Treffern zum Marktwert.
 * @returns market { value, low, high, n, spreadPct, confidence, rates, dealer[], private[], excluded[], privateValue }
 */
export function marketValue(subject, items, { step = 1, memory = null } = {}) {
  const generation = generationCheck(subject, items);
  const selected = selectComparables(subject, items, generation);
  const rates = depreciation(selected.dealer, memory);
  const weighed = adjustAndWeigh(subject, selected.dealer, rates);
  const { kept, dropped } = dropOutliers(weighed);
  const excluded = [...selected.excluded, ...dropped];
  const privateCars = adjustAndWeigh(subject, selected.private, rates);

  const n = kept.length;
  const value = n >= TUNING.minComparables ? weightedQuantile(kept, 0.5) : null;
  const low = value ? weightedQuantile(kept, 0.25) : null;
  const high = value ? weightedQuantile(kept, 0.75) : null;
  const spreadPct = value ? Math.round(((high - low) / value) * 1000) / 10 : null;

  let score = 0;
  score += n >= 15 ? 3 : n >= 10 ? 2 : n >= 6 ? 1 : 0;
  score += spreadPct === null ? 0 : spreadPct < 12 ? 2 : spreadPct < 20 ? 1 : 0;
  score += step <= 1 ? 2 : step === 2 ? 1 : 0;
  const confidence = !value || n < 5 ? "niedrig" : score >= 6 ? "hoch" : score >= 3 ? "mittel" : "niedrig";

  // Wie viele Händler haben den Preis schon gesenkt? (nur Portale, die den alten Preis zeigen)
  const priced = kept.filter((car) => car.source !== "KLEINANZEIGEN");
  const reduced = priced.filter((car) => car.oldPrice > car.price);

  return {
    value, low, high, n, spreadPct, confidence, step, rates,
    generation: generation.subject,
    trim: subjectTrimOf(subject),
    trimKnown: { n: kept.filter((car) => car.trimLevel).length, of: kept.length },
    reduced: { n: reduced.length, of: priced.length, share: priced.length ? reduced.length / priced.length : 0 },
    dealer: kept.sort((a, b) => b.weight - a.weight),
    private: privateCars.sort((a, b) => b.weight - a.weight),
    excluded,
    privateValue: privateCars.length >= 3 ? weightedQuantile(privateCars, 0.5) : null,
  };
}

/** Wie viele gute Händlerangebote liegen schon vor? Entscheidet, ob weiter gesucht wird. */
export function usableCount(subject, items) {
  const selected = selectComparables(subject, items);
  const rates = depreciation(selected.dealer, null);
  return dropOutliers(adjustAndWeigh(subject, selected.dealer, rates)).kept.length;
}
