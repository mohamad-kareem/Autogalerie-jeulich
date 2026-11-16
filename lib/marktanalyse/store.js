/**
 * Marktanalyse – Datenbank (nur Server): Einstellungen, Verlauf, Gedächtnis,
 * unbekannte Hinweise, Regelzähler, Änderungsprotokoll und die Käufe des Händlers.
 */

import { connectDB } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";
import MarktAnalyse from "@/models/MarktAnalyse";
import MarktHinweis from "@/models/MarktHinweis";
import MarktOffer from "@/models/MarktOffer";
import { normalizeSettings } from "./brain.js";
import { regression } from "./comparables.js";
import { PORTAL_LABEL, PRICE_LIST, TUNING } from "./knowledge/defaults.js";
import { DICTIONARY } from "./knowledge/dictionary.js";
import { MODEL_KNOWLEDGE } from "./knowledge/models.js";
import { RULES } from "./knowledge/rules.js";
import { GENERATIONS } from "./knowledge/generations.js";
import { TRIMS } from "./knowledge/trims.js";
import { DRIVE_LABEL, TIMING } from "./knowledge/timing.js";
import { makeName } from "./search.js";
import { norm, squash } from "./text.js";

const KEY = { settings: "marktanalyse.settings", learned: "marktanalyse.learned", rules: "marktanalyse.rules", log: "marktanalyse.log" };

const setting = async (key) => (await AppSetting.findById(key).lean())?.value ?? null;
const putSetting = (key, value, by = "") =>
  AppSetting.updateOne({ _id: key }, { $set: { value, updatedBy: by } }, { upsert: true });

async function logChange(text, by = "Marktanalyse") {
  const entries = (await setting(KEY.log)) || [];
  entries.unshift({ at: new Date().toISOString(), by, text });
  await putSetting(KEY.log, entries.slice(0, 200), by);
}

/* ------------------------------------------------------------ Einstellungen */

export async function getSettings() {
  await connectDB();
  return normalizeSettings((await setting(KEY.settings)) || {});
}

export async function saveSettings(input, by) {
  await connectDB();
  const before = normalizeSettings((await setting(KEY.settings)) || {});
  const next = normalizeSettings({ ...input, aiSummaryEnabled: input.aiSummaryEnabled ?? before.aiSummaryEnabled, portals: input.portals ?? before.portals, kmWarn: input.kmWarn ?? before.kmWarn });
  await putSetting(KEY.settings, next, by);
  const changed = [];
  if (before.aiSummaryEnabled !== next.aiSummaryEnabled) changed.push(`KI-Kurzfazit ${next.aiSummaryEnabled ? "aktiviert" : "deaktiviert"}`);
  if (before.kmWarn !== next.kmWarn) changed.push(`Kilometer-Grenze ${next.kmWarn.toLocaleString("de-DE")} km`);
  if (before.portals.join() !== next.portals.join()) changed.push(`Vergleich auf ${next.portals.map((name) => PORTAL_LABEL[name] || name).join(", ")}`);
  if (before.profitMin !== next.profitMin || before.profitGoal !== next.profitGoal) changed.push(`Gewinn ${next.profitMin}–${next.profitGoal} €`);
  for (const item of PRICE_LIST) {
    if (before.prices[item.key] !== next.prices[item.key]) changed.push(`${item.label} ${next.prices[item.key]} €`);
  }
  if (changed.length) await logChange(`Einstellungen geändert: ${changed.slice(0, 8).join(", ")}${changed.length > 8 ? " …" : ""}`, by);
  return next;
}

/* ------------------------------------------------------------ Gedächtnis */

export const scopeOf = (car) => [squash(makeName(car.make)), squash(car.model), car.fuel || "", car.gearbox || ""].join("|");

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
};

/** Was die Marktanalyse aus früheren Analysen über dieses Modell weiß. */
export async function getMemory(subject) {
  await connectDB();
  const [offers, learned] = await Promise.all([
    MarktOffer.find({ scope: scopeOf(subject), sellerType: { $ne: "PRIVATE" }, regMonths: { $gte: subject.regMonths - 48, $lte: subject.regMonths + 48 } })
      .select("price mileageKm regMonths firstSeen goneAt").limit(600).lean(),
    setting(KEY.learned),
  ]);
  const fit = regression(offers.filter((o) => Number.isFinite(o.price) && Number.isFinite(o.mileageKm) && Number.isFinite(o.regMonths)));
  const gone = offers.filter((o) => o.goneAt).map((o) => (new Date(o.goneAt) - new Date(o.firstSeen)) / 86_400_000).filter((days) => days >= 1);
  return {
    perKm: fit?.perKm ?? null,
    perMonth: fit?.perMonth ?? null,
    n: fit?.n ?? 0,
    daysToSell: gone.length ? { median: median(gone), n: gone.length } : null,
    sellDiscountPct: learned?.sellDiscountPct ?? null,
  };
}

/**
 * Angebote dieser Analyse merken. Angebote, die im vollständig gelesenen
 * Suchbereich nicht mehr auftauchen, gelten als verkauft ("goneAt").
 */
async function remember(subject, items, meta) {
  const scope = scopeOf(subject);
  const now = new Date();
  const usable = items.filter((item) => item?.key && Number.isFinite(item.price) && Number.isFinite(item.mileageKm) && Number.isFinite(item.regMonths)).slice(0, 400);
  if (!usable.length) return;
  const known = new Map((await MarktOffer.find({ _id: { $in: usable.map((item) => item.key) } }).select("price").lean()).map((o) => [o._id, o]));
  await MarktOffer.bulkWrite(usable.map((item) => {
    const previous = known.get(item.key);
    const dropped = previous && Number.isFinite(previous.price) && item.price < previous.price;
    return {
      updateOne: {
        filter: { _id: item.key },
        update: {
          $set: { source: item.source, scope, make: norm(makeName(subject.make)), model: norm(subject.model), sellerType: item.sellerType || "UNKNOWN", price: item.price, mileageKm: item.mileageKm, regMonths: item.regMonths, powerPs: item.powerPs ?? null, lastSeen: now, goneAt: null },
          $setOnInsert: { firstSeen: now, firstPrice: item.price },
          ...(dropped ? { $inc: { priceDrops: 1 } } : {}),
        },
        upsert: true,
      },
    };
  }), { ordered: false });

  const filter = meta?.filter;
  if (!filter) return;
  for (const [source, portal] of Object.entries(meta.portals || {})) {
    if (!portal?.ok || !portal.complete) continue;
    await MarktOffer.updateMany({
      scope, source, goneAt: null, lastSeen: { $lt: new Date(now.getTime() - 20 * 3_600_000) },
      _id: { $nin: usable.filter((item) => item.source === source).map((item) => item.key) },
      mileageKm: { $gte: filter.kmMin, $lte: filter.kmMax },
      regMonths: { $gte: filter.yearMin * 12, $lte: filter.yearMax * 12 + 11 },
      ...(filter.psMin ? { powerPs: { $gte: filter.psMin, $lte: filter.psMax } } : {}),
    }, { $set: { goneAt: now } });
  }
}

async function recordUnknown(unknown, url) {
  const now = new Date();
  const ops = (unknown || []).slice(0, 12).map((entry) => ({
    updateOne: {
      filter: { _id: norm(entry.quote).slice(0, 200) },
      update: { $set: { lastSeen: now }, $inc: { count: 1 }, $setOnInsert: { quote: entry.quote, signal: entry.signal, firstSeen: now, example: url } },
      upsert: true,
    },
  })).filter((op) => op.updateOne.filter._id.length >= 6);
  if (ops.length) await MarktHinweis.bulkWrite(ops, { ordered: false });
}

async function countRules(ids) {
  if (!ids?.length) return;
  const inc = {};
  for (const id of ids) inc[`value.${String(id).replace(/[.$]/g, "_")}`] = 1;
  await AppSetting.updateOne({ _id: KEY.rules }, { $inc: inc }, { upsert: true });
}

/* ------------------------------------------------------------ Verlauf */

const trimCars = (cars, max) => (cars || []).slice(0, max).map(({ key, source, url, title, price, mileageKm, firstRegistration, regMonths: months, powerPs, sellerType, location, adjusted, weight, reason, alsoOn, trim, rating, notCounted }) =>
  ({ key, source, url, title, price, mileageKm, firstRegistration, regMonths: months, powerPs, sellerType, location, adjusted, weight, reason, alsoOn, trim, rating, notCounted }));

export async function saveAnalysis({ subject, items, report, meta, user }) {
  await connectDB();
  const stored = {
    ...report,
    market: { ...report.market, dealer: trimCars(report.market.dealer, 60), private: trimCars(report.market.private, 20), excluded: trimCars(report.market.excluded, 40) },
  };
  const doc = await MarktAnalyse.create({
    url: subject.url, source: subject.source, listingId: subject.id || "", title: subject.title || "", make: subject.make || "", model: subject.model || "",
    image: subject.image || "", ask: subject.price, verdict: report.verdict.key, headline: report.verdict.headline,
    marketValue: report.prices?.marketValue ?? null, limit: report.prices?.limit ?? null,
    subject: { ...subject, description: String(subject.description || "").slice(0, 6000) }, report: stored, createdBy: user?.name || "",
  });
  // Lernen darf die Analyse nie scheitern lassen.
  await Promise.allSettled([remember(subject, items, meta), recordUnknown(report.unknown, subject.url), countRules(report.rulesFired)]);
  return { id: String(doc._id), report: stored, createdAt: doc.createdAt };
}

export async function listAnalyses(limit = 60) {
  await connectDB();
  const docs = await MarktAnalyse.find({}).sort({ createdAt: -1 }).limit(limit)
    .select("url source title image ask verdict headline marketValue limit createdAt createdBy feedback").lean();
  return docs.map((doc) => ({ ...doc, id: String(doc._id), _id: undefined }));
}

export async function getAnalysis(id) {
  await connectDB();
  const doc = await MarktAnalyse.findById(id).lean();
  return doc ? { ...doc, id: String(doc._id), _id: undefined } : null;
}

export async function updateAnalysisReport(id, report) {
  await connectDB();
  const result = await MarktAnalyse.updateOne({ _id: id }, {
    $set: {
      report,
      verdict: report.verdict.key,
      headline: report.verdict.headline,
      marketValue: report.prices?.marketValue ?? null,
      limit: report.prices?.limit ?? null,
    },
    $unset: { aiSummary: 1 },
  });
  return result.matchedCount > 0;
}

export async function saveAnalysisSummary(id, updatedAt, summary) {
  const result = await MarktAnalyse.updateOne({ _id: id, updatedAt }, {
    $set: { aiSummary: summary },
  }, { timestamps: false });
  return result.matchedCount > 0;
}

export async function deleteAnalysis(id) {
  await connectDB();
  await MarktAnalyse.deleteOne({ _id: id });
}

/* ------------------------------------------------------------ Käufe */

/**
 * Der Händler meldet im Bericht "Gekauft" mit dem Kaufpreis – oder nimmt es zurück.
 * Es gibt keine automatische Zuordnung: gekauft ist nur, was er selbst einträgt.
 * @param price  Kaufpreis in Euro, oder null zum Zurücknehmen
 */
export async function setPurchase(id, price, by = "") {
  await connectDB();
  const update = price === null
    ? { $set: { "feedback.boughtAt": null, "feedback.boughtPrice": null, "feedback.boughtBy": "" } }
    : { $set: { "feedback.boughtAt": new Date(), "feedback.boughtPrice": price, "feedback.boughtBy": by } };
  const doc = await MarktAnalyse.findByIdAndUpdate(id, update, { new: true }).select("feedback").lean();
  return doc ? doc.feedback : null;
}

/** Wie der Händler im Vergleich zum Einkaufslimit gekauft hat. */
async function purchaseSummary() {
  const bought = await MarktAnalyse.find({ "feedback.boughtPrice": { $gt: 0 } })
    .select("title ask limit marketValue feedback report.prices.sell report.prices.costs createdAt").sort({ "feedback.boughtAt": -1 }).limit(300).lean();
  const withLimit = bought.filter((a) => Number.isFinite(a.limit));
  const profits = bought.map((a) => (Number.isFinite(a.report?.prices?.sell) ? a.report.prices.sell - (a.report.prices.costs || 0) - a.feedback.boughtPrice : null)).filter(Number.isFinite);
  const mean = (values) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null);
  return {
    bought: bought.length,
    overLimit: withLimit.filter((a) => a.feedback.boughtPrice > a.limit).length,
    avgVsLimit: mean(withLimit.map((a) => a.feedback.boughtPrice - a.limit)), // < 0: unter dem Limit gekauft
    avgVsAsk: mean(bought.filter((a) => Number.isFinite(a.ask)).map((a) => a.feedback.boughtPrice - a.ask)), // < 0: heruntergehandelt
    avgExpectedProfit: mean(profits),
    purchases: bought.slice(0, 100).map((a) => ({ title: a.title, at: a.feedback.boughtAt, ask: a.ask, limit: a.limit, paid: a.feedback.boughtPrice })),
  };
}

/* ------------------------------------------------------------ Wissensansicht */

export async function knowledgeView() {
  await connectDB();
  const purchases = await purchaseSummary().catch(() => ({ bought: 0, purchases: [] }));
  const [learned, counts, log, hints, settings, analyses, offerCount, scopes] = await Promise.all([
    setting(KEY.learned), setting(KEY.rules), setting(KEY.log),
    MarktHinweis.find({}).sort({ count: -1, lastSeen: -1 }).limit(200).lean(),
    getSettings(), MarktAnalyse.countDocuments({}), MarktOffer.estimatedDocumentCount(),
    MarktOffer.aggregate([
      { $match: { sellerType: { $ne: "PRIVATE" } } },
      { $group: { _id: "$scope", make: { $first: "$make" }, model: { $first: "$model" }, n: { $sum: 1 }, gone: { $sum: { $cond: [{ $ifNull: ["$goneAt", false] }, 1, 0] } }, drops: { $sum: { $cond: [{ $gt: ["$priceDrops", 0] }, 1, 0] } } } },
      { $sort: { n: -1 } }, { $limit: 40 },
    ]),
  ]);

  const market = [];
  for (const scope of scopes) {
    const offers = await MarktOffer.find({ scope: scope._id, sellerType: { $ne: "PRIVATE" } }).select("price firstPrice mileageKm regMonths firstSeen goneAt").limit(600).lean();
    const fit = regression(offers);
    const days = offers.filter((o) => o.goneAt).map((o) => (new Date(o.goneAt) - new Date(o.firstSeen)) / 86_400_000).filter((d) => d >= 1);
    const drops = offers.filter((o) => o.firstPrice > o.price).map((o) => (1 - o.price / o.firstPrice) * 100);
    const [, , fuel, gearbox] = String(scope._id).split("|");
    market.push({
      scope: scope._id, make: scope.make, model: scope.model, fuel, gearbox, offers: scope.n,
      perKm: fit && fit.perKm > 0 ? Math.round(fit.perKm * 1000) / 1000 : null,
      perMonth: fit && fit.perMonth > 0 ? Math.round(fit.perMonth) : null,
      goneCount: days.length, daysToSell: days.length >= 3 ? Math.round(median(days)) : null,
      dropCount: drops.length, dropPct: drops.length >= 3 ? Math.round(median(drops) * 10) / 10 : null,
    });
  }

  const priceLabel = Object.fromEntries(PRICE_LIST.map((item) => [item.key, item.label]));
  return {
    summary: {
      analyses, offers: offerCount, bought: purchases.bought, sold: 0,
      sellDiscountPct: learned?.sellDiscountPct ?? TUNING.sellDiscountPct, suggestion: null,
      overLimit: purchases.overLimit ?? 0, avgVsLimit: purchases.avgVsLimit ?? null, avgVsAsk: purchases.avgVsAsk ?? null, avgExpectedProfit: purchases.avgExpectedProfit ?? null,
    },
    purchases: purchases.purchases,
    settings,
    tuning: TUNING,
    rules: RULES.map((rule) => ({ id: rule.id, rule: rule.rule, count: counts?.[rule.id] || 0 })),
    dictionary: DICTIONARY.map((entry) => ({ id: entry.id, label: entry.label, kind: entry.kind, severity: entry.severity, cost: entry.cost ? priceLabel[entry.cost] : null, patterns: entry.patterns, mention: entry.mention || [] })),
    models: MODEL_KNOWLEDGE.map((entry) => ({ ...entry, count: counts?.[`modell:${entry.id}`] || 0 })),
    timing: TIMING.map((entry) => ({ makes: entry.makes, fuel: entry.fuel, ccm: entry.ccm, years: entry.years, ps: entry.ps || null, name: entry.name,
      drive: DRIVE_LABEL[entry.drive], km: entry.km || null, interval: entry.interval || null, est: !!entry.est, unsure: !!entry.unsure })),
    trims: Object.entries(TRIMS).map(([make, levels]) => ({ make, ...levels })),
    generations: GENERATIONS.map((entry) => ({ makes: entry.makes, label: entry.label, gens: entry.gens.map((gen) => ({ name: gen.name, from: gen.from, to: gen.to })) })),
    market,
    unknown: hints.map((hint) => ({ quote: hint.quote, signal: hint.signal, count: hint.count, lastSeen: hint.lastSeen, example: hint.example })),
    log: log || [],
  };
}
