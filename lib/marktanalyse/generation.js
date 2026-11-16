/**
 * Marktanalyse – Generation eines Fahrzeugs bestimmen und Vergleichsfahrzeuge
 * anderer Generationen erkennen. Rein, ohne Netzwerk und Datenbank.
 *
 * Drei Quellen, in dieser Reihenfolge:
 *   1. der Titel ("Golf VII", "F30", "Astra K")
 *   2. die Generationsnummer von AutoScout24 (steht bei jedem Treffer dieses Portals)
 *   3. die Erstzulassung – nur, wenn das Jahr eindeutig in eine Bauzeit fällt;
 *      im Jahr des Modellwechsels entscheidet eine Leistung, die es nur in einer Generation gab
 */

import { GENERATION_INDEX } from "./knowledge/generations.js";
import { makeName } from "./search.js";
import { norm } from "./text.js";

/** Der Tabelleneintrag für Marke und Modell – oder null, wenn das Modell nicht geführt wird. */
export function generationEntry(make, model) {
  const brand = makeName(make);
  const name = norm(model);
  if (!brand || !name) return null;
  return GENERATION_INDEX.find((entry) => entry.makes.includes(brand) && entry.model.test(name)) || null;
}

/**
 * @returns { name, sure, by: "titel" | "ez" | "leistung" | null, candidates: [namen] }
 *   name = null: nicht eindeutig (Jahr des Modellwechsels) oder außerhalb der Tabelle.
 */
export function generationOf(entry, car) {
  if (!entry) return { name: null, sure: false, by: null, candidates: [] };
  const title = norm(`${car.title || ""} ${car.variant || ""}`);
  const named = entry.gens.filter((gen) => gen.patterns.some((pattern) => pattern.test(title)));
  const year = Number.isFinite(car.regMonths) ? Math.floor(car.regMonths / 12) : null;
  // Zulassung kann bis ins Jahr nach dem Bauende reichen (Lagerfahrzeuge) – außer die
  // Nachfolgegeneration ist da schon auf dem Markt: dann ist das Jahr danach eindeutig die neue.
  const followed = (gen) => entry.gens.some((other) => other !== gen && other.from > gen.from && gen.to !== null && other.from <= gen.to);
  const fits = (gen) => year !== null && year >= gen.from && year <= (gen.to ?? 9999) + (followed(gen) ? 0 : 1);
  const byYear = entry.gens.filter(fits);
  if (named.length === 1 && (year === null || fits(named[0]) || !byYear.length)) {
    return { name: named[0].name, sure: true, by: "titel", candidates: [named[0].name] };
  }
  if (byYear.length === 1) return { name: byYear[0].name, sure: true, by: "ez", candidates: [byYear[0].name] };
  const ps = Number(car.powerPs);
  const byPower = ps ? byYear.filter((gen) => gen.onlyPs?.includes(ps)) : [];
  if (byPower.length === 1) return { name: byPower[0].name, sure: true, by: "leistung", candidates: [byPower[0].name] };
  return { name: null, sure: false, by: null, candidates: byYear.map((gen) => gen.name) };
}

const majority = (values, minShare = 0.8, minCount = 2) => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return best !== undefined && n >= minCount && n / values.length >= minShare ? best : null;
};

/**
 * Ordnet dem analysierten Fahrzeug und allen Treffern eine Generation zu.
 * @returns {
 *   subject: { name, label, sure, by, note },
 *   verdictFor(item) → "same" | "other" | "unsure"
 * }
 */
export function generationCheck(subject, items) {
  const entry = generationEntry(subject.make, subject.model);
  const scout = items.filter((item) => item.source === "AUTOSCOUT24" && Number.isFinite(item.as24Gen));
  // Dasselbe Auto auf mobile.de oder Kleinanzeigen trägt die AutoScout24-Nummer seines Zwillings.
  const identity = (item) => `${item.price}|${item.mileageKm}|${item.regMonths}`;
  const scoutByIdentity = new Map(scout.map((item) => [identity(item), item.as24Gen]));
  const scoutGen = (item) => (Number.isFinite(item.as24Gen) ? item.as24Gen : scoutByIdentity.get(identity(item)) ?? null);
  const own = generationOf(entry, subject);

  /* ---- AutoScout24-Nummer ↔ Tabellenname, gelernt aus den Treffern dieser Analyse ---- */
  const nameOfScout = new Map();
  if (entry) {
    const votes = new Map();
    for (const item of scout) {
      const gen = generationOf(entry, item);
      if (!gen.sure) continue;
      votes.set(item.as24Gen, [...(votes.get(item.as24Gen) || []), gen.name]);
    }
    for (const [id, names] of votes) {
      const name = majority(names);
      if (name) nameOfScout.set(id, name);
    }
  }

  /* ---- Generation des analysierten Fahrzeugs ---- */
  let subjectScout = Number.isFinite(subject.as24Gen) ? subject.as24Gen : null;
  let name = own.name;
  let by = own.by;
  if (!name && subjectScout !== null && nameOfScout.has(subjectScout)) {
    name = nameOfScout.get(subjectScout);
    by = "autoscout24";
  }
  // Ohne eigene Nummer: Treffer mit (fast) gleicher Erstzulassung sind sich einig?
  if (subjectScout === null && Number.isFinite(subject.regMonths)) {
    const near = scout.filter((item) => Number.isFinite(item.regMonths) && Math.abs(item.regMonths - subject.regMonths) <= 4);
    const guess = near.length >= 3 ? majority(near.map((item) => item.as24Gen), 0.85, 3) : null;
    if (guess !== null && (!name || nameOfScout.get(guess) === name || !nameOfScout.has(guess))) {
      subjectScout = guess;
      if (!name && nameOfScout.has(guess)) { name = nameOfScout.get(guess); by = "autoscout24"; }
    }
  }
  /* ---- Leistung je Generation, gelernt aus den sicher eingeordneten Treffern ----
   * Im Jahr des Modellwechsels hilft oft die Motorleistung: gibt es 140 PS nur bei der
   * neuen Generation, ist ein 140-PS-Auto von 2018 eben die neue. Gilt für jedes Modell. */
  const keyOf = (item) => {
    const id = scoutGen(item);
    if (id !== null && nameOfScout.has(id)) return nameOfScout.get(id);
    if (entry) {
      const gen = generationOf(entry, item);
      if (gen.sure) return gen.name;
    }
    return id !== null ? `as24:${id}` : null;
  };
  const powers = new Map(); // Generation → Map(PS → Anzahl)
  for (const item of items) {
    const ps = Number(item.powerPs);
    const key = keyOf(item);
    if (!ps || !key) continue;
    if (!powers.has(key)) powers.set(key, new Map());
    powers.get(key).set(ps, (powers.get(key).get(ps) || 0) + 1);
  }
  const seen = (key, ps) => powers.get(key)?.get(ps) || 0;
  // Generation, bei der diese Leistung mehrfach vorkommt – und bei keiner der anderen Kandidaten.
  const byLearnedPower = (ps, candidates) => {
    if (!ps || candidates.length < 2) return null;
    const hits = candidates.filter((key) => seen(key, ps) >= 2);
    return hits.length === 1 && candidates.every((key) => key === hits[0] || !seen(key, ps)) ? hits[0] : null;
  };

  if (!name && subjectScout === null && entry && own.candidates.length > 1) {
    const learned = byLearnedPower(Number(subject.powerPs), own.candidates);
    if (learned) { name = learned; by = "leistung"; }
  }

  if (name && subjectScout === null) {
    // umgekehrt: welche AutoScout24-Nummer gehört zu dieser Generation?
    subjectScout = [...nameOfScout.entries()].find(([, value]) => value === name)?.[0] ?? null;
  }

  /* ---- Bauzeit der eigenen Generation laut AutoScout24 – für Portale ohne Nummer ---- */
  const range = (list) => (list.length ? [Math.min(...list), Math.max(...list)] : null);
  const months = (wanted) => scout.filter((item) => wanted(item.as24Gen) && Number.isFinite(item.regMonths)).map((item) => item.regMonths);
  const ownRange = subjectScout !== null ? range(months((id) => id === subjectScout)) : null;
  const otherRange = subjectScout !== null ? range(months((id) => id !== subjectScout)) : null;

  const known = Boolean(name) || subjectScout !== null;
  function verdictFor(item) {
    if (!known) return "unsure";
    const id = scoutGen(item);
    if (id !== null && subjectScout !== null) return id === subjectScout ? "same" : "other";
    const ps = Number(item.powerPs);
    if (entry && name) {
      const gen = generationOf(entry, item);
      if (gen.sure) return gen.name === name ? "same" : "other";
      if (gen.candidates.length && !gen.candidates.includes(name)) return "other";
      if (gen.candidates.length > 1) {
        const learned = byLearnedPower(ps, gen.candidates);
        return learned ? (learned === name ? "same" : "other") : "unsure";
      }
      return "same";
    }
    // Modell nicht in der Tabelle: nur die Bauzeiten von AutoScout24 entscheiden.
    if (ownRange && otherRange && Number.isFinite(item.regMonths)) {
      const inOwn = item.regMonths >= ownRange[0] && item.regMonths <= ownRange[1];
      const inOther = item.regMonths >= otherRange[0] && item.regMonths <= otherRange[1];
      if (inOther && !inOwn) return "other";
      if (inOther && inOwn) {
        const ids = [...new Set(scout.map((car) => car.as24Gen))].map((value) => `as24:${value}`);
        const learned = byLearnedPower(ps, ids);
        return learned ? (learned === `as24:${subjectScout}` ? "same" : "other") : "unsure";
      }
    }
    return "same";
  }

  const mixed = !known && (own.candidates.length > 1 || new Set(scout.map((item) => item.as24Gen)).size > 1);
  return {
    subject: {
      name: name || null,
      label: entry?.label || null,
      sure: known,
      by: name ? by : subjectScout !== null ? "autoscout24" : null,
      note: mixed
        ? `Generation nicht eindeutig${own.candidates.length > 1 ? ` (${own.candidates.join(" oder ")})` : ""}: Die Vergleichsfahrzeuge können zwei Generationen mischen – Marktwert mit Vorsicht lesen.`
        : null,
    },
    verdictFor,
  };
}
