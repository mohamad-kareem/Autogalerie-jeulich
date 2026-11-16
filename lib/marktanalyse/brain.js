/**
 * Marktanalyse – das Gehirn.
 *
 * analyze() nimmt das Fahrzeug, die Treffer der Portale, die Einstellungen des
 * Händlers und das Gedächtnis und liefert den fertigen Bericht. Gleiche Eingabe
 * ergibt immer denselben Bericht; jeder Satz geht auf eine Regel zurück.
 */

import { DEFAULT_SETTINGS, PRICE_LIST, TUNING } from "./knowledge/defaults.js";
import { MODEL_KNOWLEDGE } from "./knowledge/models.js";
import { timingOf } from "./timing.js";
import { RULES } from "./knowledge/rules.js";
import { marketValue, weightedQuantile } from "./comparables.js";
import { readCondition } from "./condition.js";
import { makeName } from "./search.js";
import { clamp, euro, floorTo, norm, nowMonths, RATING_LABEL, roundTo } from "./text.js";

export const VERDICTS = [
  { key: "KAUFEN", label: "Kaufen", tone: "good" },
  { key: "KNAPP", label: "Kaufen, knapp", tone: "ok" },
  { key: "VERHANDELN", label: "Verhandeln", tone: "warn" },
  { key: "FINGER_WEG", label: "Finger weg", tone: "bad" },
];

/** Einstellungen des Händlers mit den Standardwerten auffüllen und begrenzen. */
export const COMPARE_PORTALS = ["MOBILE_DE", "AUTOSCOUT24", "KLEINANZEIGEN"];

export function normalizeSettings(input = {}) {
  const number = (value, fallback, min, max) => {
    const n = Number(value);
    return Number.isFinite(n) ? clamp(Math.round(n), min, max) : fallback;
  };
  const profitMin = number(input.profitMin, DEFAULT_SETTINGS.profitMin, 0, 50000);
  const profitGoal = Math.max(profitMin, number(input.profitGoal, DEFAULT_SETTINGS.profitGoal, 0, 50000));
  const prices = {};
  for (const item of PRICE_LIST) prices[item.key] = number(input.prices?.[item.key], item.value, 0, 50000);
  // Portale für die Vergleichsfahrzeuge; mindestens eins, sonst alle.
  const chosen = Array.isArray(input.portals) ? COMPARE_PORTALS.filter((name) => input.portals.includes(name)) : [];
  const portals = chosen.length ? chosen : [...COMPARE_PORTALS];
  // Kilometer-Grenze des Händlers: ab "kmWarn" Warnung.
  const kmWarn = number(input.kmWarn, DEFAULT_SETTINGS.kmWarn, 20000, 500000);
  return { profitMin, profitGoal, prices, aiSummaryEnabled: input.aiSummaryEnabled === true, portals, kmWarn };
}

/** Welche Fahrzeugdaten fehlen für eine Bewertung? */
export function missingFields(subject) {
  const missing = [];
  if (!subject?.make) missing.push("Marke");
  if (!subject?.model) missing.push("Modell");
  if (!Number.isFinite(subject?.regMonths)) missing.push("Erstzulassung");
  if (!Number.isFinite(subject?.mileageKm)) missing.push("Kilometerstand");
  if (!Number.isFinite(subject?.price) || subject.price < 300) missing.push("Preis");
  return missing;
}

function modelHints(subject) {
  const make = makeName(subject.make);
  const year = Math.floor(subject.regMonths / 12);
  const text = norm(`${subject.model || ""} ${subject.variant || ""} ${subject.title || ""}`);
  const within = (range, value) => !range || (Number.isFinite(value) && value >= range[0] && value <= range[1]);
  return MODEL_KNOWLEDGE.filter((entry) =>
    entry.makes.includes(make) &&
    (!entry.fuel || entry.fuel === subject.fuel) &&
    (!entry.gearbox || entry.gearbox === subject.gearbox) &&
    within(entry.years, year) &&
    // Hubraum und Leistung müssen bekannt sein, wenn der Eintrag sie verlangt – sonst wäre es geraten.
    (!entry.ccm || within(entry.ccm, subject.ccm)) &&
    (!entry.ps || within(entry.ps, subject.powerPs)) &&
    (!entry.model || new RegExp(entry.model).test(text)));
}

/**
 * @param input { subject, items, settings, memory, meta, now }
 *   meta.portals  { MOBILE_DE: { ok, total, error }, … }
 *   meta.step     letzter Suchschritt (1–3)
 *   memory        { perKm, perMonth, n, daysToSell: { median, n }, sellDiscountPct }
 */
export function analyze({ subject, items = [], settings: rawSettings, memory = null, meta = {}, now = new Date(), savedMarket = null }) {
  const settings = normalizeSettings(rawSettings);
  const missing = missingFields(subject);
  if (missing.length) {
    return { ok: false, error: `In der Anzeige fehlt: ${missing.join(", ")}. Ohne diese Angaben ist keine Bewertung möglich.`, missing };
  }

  const step = clamp(Number(meta.step) || 1, 1, 3);
  const market = savedMarket ?? marketValue(subject, items, { step, memory: memory?.n ? memory : null });
  const condition = readCondition(subject, settings.prices, { now });

  // Zahnriemen laut Tabelle: nur Hinweis und Frage, keine Kosten (Kosten kommen allein aus der Anzeige).
  const timing = timingOf(subject, { now });
  const beltMentioned = condition.findings.some((f) => f.id === "zahnriemen") || condition.positives.some((p) => p.id === "neu-zahnriemen");
  if (timing && beltMentioned) timing.state = null;
  const ask = subject.price;

  const ageYears = Math.max(0, (nowMonths(now) - subject.regMonths) / 12);
  const kmPerYear = subject.mileageKm / Math.max(1, ageYears);
  const listed = subject.listedAt ? new Date(subject.listedAt) : null;
  const daysOnline = listed && !Number.isNaN(listed.getTime()) ? Math.max(0, Math.round((now - listed) / 86_400_000)) : null;
  const portalTotals = Object.values(meta.portals || {}).map((p) => p?.total).filter(Number.isFinite);
  const totals = { known: portalTotals.length > 0, sum: portalTotals.reduce((a, b) => a + b, 0), max: Math.max(0, ...portalTotals) };

  /* ---- Regeln, erster Durchlauf (für Abschläge), Preise, zweiter Durchlauf ---- */
  const context = { subject, market, condition, timing, settings, ask, ageYears, kmPerYear, daysOnline, totals, knowledge: { daysToSell: memory?.daysToSell || null }, limit: null };
  const run = () => RULES.map((rule) => {
    let effect = null;
    try { effect = rule.test(context); } catch { effect = null; }
    return effect ? { id: rule.id, ...effect } : null;
  }).filter(Boolean);

  let fired = run();
  const deductPct = Math.min(20, fired.reduce((sum, effect) => sum + (effect.deductPct || 0), 0));
  const discountPct = clamp(Number(memory?.sellDiscountPct) || TUNING.sellDiscountPct, ...TUNING.sellDiscountRange);

  let prices = null;
  if (market.value) {
    const sell = roundTo(market.value * (1 - discountPct / 100) * (1 - deductPct / 100), 50);
    const repairs = condition.costTotal;
    const costs = TUNING.countRepairs ? repairs : 0;
    const limit = floorTo(sell - settings.profitMin - costs, 50);
    const target = floorTo(sell - settings.profitGoal - costs, 50);
    prices = {
      marketValue: roundTo(market.value, 50), marketLow: roundTo(market.low, 50), marketHigh: roundTo(market.high, 50),
      discountPct, deductPct, sell, costs, repairs, limit, target,
      profitAtAsk: Math.round(sell - ask - costs),
      firstOffer: Math.max(0, floorTo(Math.min(target, ask) * 0.95, 50)),
      privateValue: market.privateValue ? roundTo(market.privateValue, 50) : null,
    };
    context.limit = limit;
    fired = run();
  }

  const zonePct = clamp(TUNING.negotiationZonePct + fired.reduce((sum, effect) => sum + (effect.zonePct || 0), 0), 3, TUNING.negotiationZoneMaxPct);
  const hints = modelHints(subject).map((entry) => ({ id: entry.id, level: entry.level, text: `Bekannte Schwachstelle: ${entry.text}`, ask: entry.ask, source: entry.source }));

  /* ---- Urteil ---- */
  const killer = fired.some((effect) => effect.level === "killer");
  const serious = fired.filter((effect) => effect.level === "serious");
  let level;
  let headline;
  let negotiateTo = null;
  const reasons = [];

  if (!prices) {
    level = 3;
    headline = "Keine Bewertung möglich";
    reasons.push(`Es wurden nur ${market.n} vergleichbare Händlerangebote gefunden – zu wenig für einen Marktwert. Bitte selbst prüfen.`);
  } else {
    if (ask <= prices.target) level = 0;
    else if (ask <= prices.limit) level = 1;
    else if (prices.limit > 0 && ask <= prices.limit * (1 + zonePct / 100)) level = 2;
    else level = 3;
    const byPrice = level;
    if (serious.length && level < 3) level += 1;
    if (killer) level = 3;
    if (prices.limit <= 0) level = 3;

    reasons.push(`${market.n} vergleichbare Händlerangebote, Marktwert ${euro(prices.marketValue)} (${euro(prices.marketLow)} bis ${euro(prices.marketHigh)}). Realistischer Verkaufspreis ${euro(prices.sell)}.`);
    if (condition.costs.length) {
      const priced = condition.costs.filter((c) => !c.noPrice);
      const outside = condition.costs.filter((c) => c.noPrice);
      if (priced.length) reasons.push(`Nötige Arbeiten: ${priced.slice(0, 4).map((c) => `${c.label}${c.qty > 1 ? ` ×${c.qty}` : ""} (${euro(c.amount)})`).join(", ")}${priced.length > 4 ? " und weitere" : ""} – zusammen ${euro(prices.repairs)}${prices.costs ? "" : ", nicht im Einkaufslimit eingerechnet"}.`);
      if (outside.length) reasons.push(`Außenschäden laut Anzeige: ${outside.map((c) => c.label).join(", ")} – Aufwand nach Besichtigung.`);
    }
    reasons.push(prices.profitAtAsk >= 0
      ? `Beim Angebotspreis von ${euro(ask)} bleiben ${euro(prices.profitAtAsk)} Gewinn.`
      : `Beim Angebotspreis von ${euro(ask)} entsteht ein Verlust von ${euro(-prices.profitAtAsk)}.`);

    // Bis wohin verhandeln: aufs Limit – oder, wenn nur das Risiko bremst, eine Stufe tiefer.
    negotiateTo = byPrice === 2 ? prices.limit : byPrice === 1 ? prices.target : floorTo(ask * 0.95, 50);
    if (killer) reasons.push(fired.find((effect) => effect.level === "killer").text);
    else if (prices.limit <= 0) reasons.push("Der Marktwert ist zu niedrig, um die Gewinnspanne zu erreichen – auch geschenkt lohnt es sich kaum.");
    else if (level === 0) reasons.push(`Der Preis liegt am oder unter dem Zielpreis von ${euro(prices.target)}.`);
    else if (level === 1) reasons.push(`Der Preis liegt zwischen Zielpreis (${euro(prices.target)}) und Einkaufslimit (${euro(prices.limit)}): Mindestgewinn wird erreicht, das Ziel nicht ganz.`);
    else if (level === 2) reasons.push(byPrice === 2
      ? `Der Preis liegt ${euro(ask - prices.limit)} über dem Einkaufslimit – das ist verhandelbar. Nicht mehr als ${euro(prices.limit)} zahlen.`
      : `Der Preis würde passen, aber wegen des Risikos nur mit Abschlag kaufen: höchstens ${euro(negotiateTo)}.`);
    else reasons.push(byPrice === 3
      ? `Der Preis liegt ${euro(ask - prices.limit)} über dem Einkaufslimit von ${euro(prices.limit)} – so weit lässt sich kaum jemand herunterhandeln.`
      : "Der Preis wäre verhandelbar, das Risiko ist aber zu hoch.");
    if (serious.length && !killer) reasons.push(`${serious.map((effect) => effect.text).join(" ")} Urteil deshalb eine Stufe vorsichtiger.`);
    if (market.confidence === "niedrig") reasons.push("Die Datenlage ist dünn: Urteil unsicher, bitte selbst prüfen.");

    headline = level === 2 ? `Verhandeln bis ${euro(negotiateTo)}` : VERDICTS[level].label;
  }

  const order = { killer: 0, serious: 1, warn: 2, info: 3, plus: 4 };
  const flags = [...fired, ...hints].filter((effect) => effect.level !== "plus").sort((a, b) => order[a.level] - order[b.level]);
  const questions = [...new Set([...fired, ...hints].map((effect) => effect.ask).filter(Boolean))];

  return {
    ok: true,
    verdict: { ...VERDICTS[level], headline, unsure: market.confidence === "niedrig", zonePct, negotiateTo: level === 2 ? negotiateTo : null },
    reasons,
    prices,
    ask,
    settings: { profitMin: settings.profitMin, profitGoal: settings.profitGoal },
    market: {
      n: market.n, confidence: market.confidence, spreadPct: market.spreadPct, step, reduced: market.reduced,
      value: market.value, low: market.low, high: market.high, privateValue: market.privateValue,
      generation: market.generation, trim: market.trim, trimKnown: market.trimKnown,
      rates: { perKm: Math.round(market.rates.perKm * 1000) / 1000, perMonth: Math.round(market.rates.perMonth), from: market.rates.from },
      dealer: market.dealer, private: market.private, excluded: market.excluded,
    },
    costs: condition.costs,
    findings: condition.findings,
    positives: fired.filter((effect) => effect.level === "plus").map((effect) => ({ id: effect.id, text: effect.text })),
    pluses: condition.positives.map((positive) => ({ id: positive.id, label: positive.label, quote: positive.quote })),
    flags,
    questions,
    unknown: condition.unknown,
    facts: {
      ageYears: Math.round(ageYears * 10) / 10, kmPerYear: Math.round(kmPerYear), daysOnline, tuvMonthsLeft: condition.tuvMonthsLeft,
      generation: market.generation?.name || null,
      trim: market.trim?.label || null,
      timing: timing?.fact || null,
      emission: subject.emission ? `Euro ${subject.emission}` : null,
      portalRating: RATING_LABEL[subject.rating] || null,
      oldPrice: subject.oldPrice > ask ? subject.oldPrice : null,
    },
    rulesFired: [...fired.map((effect) => effect.id), ...hints.map((hint) => `modell:${hint.id}`)],
    portals: meta.portals || {},
  };
}

/** Bewerte die gespeicherte Anzeige erneut auf Basis derselben Marktdaten. */
export function refreshReport({ subject, previous, settings, memory, now }) {
  const market = previous?.market;
  if (!subject || !market) return { ok: false, error: "Für diese Analyse fehlen die gespeicherten Marktdaten." };

  let savedMarket = market;
  if (!Object.hasOwn(market, "value")) {
    // Ältere Berichte haben nur gerundete Preise und gekürzte Vergleichslisten gespeichert.
    const { prices, facts, flags = [], rulesFired = [] } = previous;
    const dealer = market.dealer || [];
    const quantile = (q) => dealer.length === market.n && dealer.length ? weightedQuantile(dealer, q) : null;
    savedMarket = {
      ...market,
      value: prices ? quantile(0.5) ?? prices.marketValue : null,
      low: prices ? quantile(0.25) ?? prices.marketLow : null,
      high: prices ? quantile(0.75) ?? prices.marketHigh : null,
      privateValue: prices?.privateValue ?? null,
      generation: { name: facts?.generation, note: flags.find((flag) => flag.id === "generationUnklar")?.text },
      trim: facts?.trim ? { label: facts.trim } : null,
      trimKnown: dealer.length === market.n
        ? { n: dealer.filter((car) => car.trim).length, of: market.n }
        : rulesFired.includes("linieUnklar") ? { n: market.n, of: market.n } : null,
    };
  }

  return analyze({
    subject, settings, memory, now, savedMarket,
    meta: { step: market.step, portals: previous.portals },
  });
}
