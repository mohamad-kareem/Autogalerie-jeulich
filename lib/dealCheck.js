// "Ankauf-Check" – dealer calculation and risk checks for a car listing.
// Pure JS (client + server): the numbers are always computed here, never by the AI.

export const DEFAULT_PARAMS = {
  recon: 300, // Aufbereitung
  transport: 150, // Abholung / Überführung
  standDays: 45, // expected days until sold
  costPerDay: 6, // Standkosten je Tag (Kapital, Versicherung, Stellplatz, Inserat)
  warrantyPct: 3, // Rückstellung Gewährleistung (% of sale price)
  saleDiscountPct: 5, // buyers negotiate the dealer price down by this much
  margin25a: true, // Differenzbesteuerung: 19 % VAT on the margin
  negotiateRangePct: 15, // negotiating makes sense up to this much below the asking price
  calibration: 1, // learned: real sale prices ÷ predicted sale prices
  minProfit: 1500, // the dealer wants at least this much per car → Einkaufslimit
  targetProfit: 2500, // ideal profit per car → Wunschpreis
  driverHourly: 12, // Fahrer: Lohn pro Stunde
  trainTimeFactor: 1.5, // Bahn braucht so viel länger als das Auto
  trainExtraMin: 30, // Weg zum Bahnhof, Umsteigen
  trainCostPerKm: 0.2, // Bahnticket je km
  fuelCostPerKm: 0.15, // Sprit für die Rückfahrt je km
};

/**
 * Driver fetches the car: by train there, with the car back.
 * travel = { minutes, km } (driving time company → car) → { total, wage, ticket, fuel, hours }
 */
export function driverCost(travel, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const minutes = num(travel?.minutes);
  const km = num(travel?.km);
  if (!(minutes > 0) || !(km > 0)) return null;
  const trainMin = minutes * (Number(p.trainTimeFactor) || 1) + (Number(p.trainExtraMin) || 0);
  const hours = (trainMin + minutes) / 60;
  const wage = Math.round(hours * (Number(p.driverHourly) || 0));
  const ticket = Math.round(km * (Number(p.trainCostPerKm) || 0));
  const fuel = Math.round(km * (Number(p.fuelCostPerKm) || 0));
  return { total: wage + ticket + fuel, wage, ticket, fuel, hours: Math.round(hours * 10) / 10, minutes, km };
}

export const VERDICTS = {
  buy: { label: "Kaufen", tone: "good" },
  negotiate: { label: "Verhandeln", tone: "warn" },
  pass: { label: "Nicht kaufen", tone: "bad" },
  offer: { label: "Angebot machen", tone: "warn" },
  review: { label: "Vor Ankauf prüfen", tone: "warn" },
};

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const round100 = (v) => Math.floor(v / 100) * 100;
const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const quantile = (a, q) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
};

/** "03/2019" | "2019" → 2019.17 (decimal year) */
export function regYear(fr) {
  const s = String(fr || "");
  let m = s.match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return Number(m[2]) + (Number(m[1]) - 1) / 12;
  m = s.match(/\b((?:19|20)\d{2})-(0[1-9]|1[0-2])\b/);
  if (m) return Number(m[1]) + (Number(m[2]) - 1) / 12;
  m = s.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) + 0.5 : null;
}

// Match within a clause so a denial never suppresses a separate reported defect.
export function listingEvidence(pattern, text) {
  if (!pattern) return null;
  const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
  const clauses = String(text || "").toLowerCase().split(/\n|[!?;]|,\s+|\.\s+|\b(?:aber|jedoch|allerdings)\b/);
  for (const clause of clauses) {
    for (const match of clause.matchAll(regex)) {
      const before = clause.slice(Math.max(0, match.index - 50), match.index);
      const after = clause.slice(match.index + match[0].length);
      if (/(?:^|\s)(?:kein\w*|ohne|weder|keinerlei|frei von)\s+(?:(?:hinweise? auf|anzeichen für|bekannt\w*|sichtbar\w*|aktuell\w*|feststellbar\w*)\s+)*(?:[\wäöüß]+-\s*(?:oder|und)\s+)?$/.test(before)) continue;
      if (/^\s+(?:(?:ist|sind|wurde|wurden)\s+)?(?:nicht vorhanden|nicht feststellbar|nicht bekannt|nicht fällig|ausgeschlossen|behoben|repariert|erneuert)\b/.test(after)) continue;
      if (!/\b(?:nicht defekt|nicht undicht|nicht verschlissen|nicht fällig)\b/.test(match[0])) return match;
    }
  }
  return null;
}

/* ------------------------------ risks ------------------------------ */

const RULES = [
  // level: critical = deal breaker without inspection, warn = check / price in, info = note
  { re: /motorschaden|motor\s*(ist\s*)?defekt|kolbenfresser|pleuelschaden|pleuel gebrochen/, level: "critical", text: "Motorschaden erwähnt", repair: "engine" },
  { re: /getriebeschaden|getriebe\s*(ist\s*)?defekt|getriebe\s*rutscht/, level: "critical", text: "Getriebeschaden erwähnt", repair: "transmission" },
  { re: /(?:zylinder)?kopfdichtung\s*(?:ist\s*)?(?:defekt|undicht|durch)/, level: "critical", text: "Defekte Zylinderkopfdichtung angegeben", repair: "head" },
  { re: /wasserschaden|flutschaden|hochwasser/, level: "critical", text: "Wasserschaden erwähnt", repair: "water" },
  { re: /\btotal\s*schaden\b/, level: "critical", text: "Totalschaden angegeben", repair: "total" },
  { re: /rahmenschaden/, level: "critical", text: "Rahmenschaden angegeben", repair: "body" },
  { re: /nicht fahrbereit|springt nicht an|nicht fahrtüchtig/, level: "critical", text: "Fahrzeug nicht fahrbereit", repair: "diagnosis" },
  { re: /(brief|papiere|zulassungsbescheinigung( teil)? ii)\s*(fehlt|fehlen|verloren|nicht vorhanden)|ohne (brief|papiere)/, level: "critical", text: "Fahrzeugpapiere fehlen" },
  { re: /(km|laufleistung|kilometer)(stand)?\s*(ist\s*)?nicht garantiert|tacho\s*(getauscht|manipul)/, level: "critical", text: "Kilometerstand nicht garantiert" },
  { re: /unfallschaden\s*(nicht|un)\s*repariert|unrepariert|nicht reparierte?r? (unfall|schaden)/, level: "critical", text: "Unreparierter Schaden", repair: "body" },
  { re: /(?:unfall|vorschaden)(?:schaden)?\s+(?:(?:wurde|ist|fachgerecht)\s+)*repariert|reparierte[rn]? (?:unfall|vorschaden)(?:schaden)?|unfallwagen|unfallfahrzeug|unfallschaden|nicht unfallfrei|vorschaden/, level: "warn", text: "Unfall/Vorschaden – Gutachten anfordern" },
  { re: /hagelschaden/, level: "warn", text: "Hagelschaden" },
  { re: /\bbastler|für bastler|bastlerfahrzeug/, level: "warn", text: "Als Bastlerfahrzeug angeboten" },
  { re: /(?:motorkontrollleuchte|motorleuchte|warnleuchte|abs[- ]leuchte|airbag[- ]leuchte)\s*(?:leuchtet|brennt|ist an)/, level: "warn", text: "Aktive Warnleuchte angegeben" },
  { re: /ölverlust|verliert öl|ölt\b/, level: "warn", text: "Ölverlust erwähnt" },
  { re: /(?:steuer)?kette\s*(?:rasselt|gelängt)|rasseln beim kaltstart/, level: "warn", text: "Kettengeräusch oder Kettenlängung angegeben" },
  { re: /kupplung\s*(rutscht|kommt spät|verschlissen|muss)/, level: "warn", text: "Kupplung verschlissen" },
  { re: /nur (an |für )?(export|gewerbe|händler)|exportfahrzeug|export\s*(oder|\/|und|&)\s*gewerbe|gewerbe\s*(oder|\/|und|&)\s*export/, level: "warn", text: "Nur an Export/Gewerbe – meist Mängel" },
  { re: /ohne tüv|tüv (ist )?abgelaufen|kein tüv|ohne hu\b|hu abgelaufen/, level: "warn", text: "Kein gültiger TÜV" },
  { re: /mietwagen|taxi\b|fahrschul|ex-?mietwagen/, level: "warn", text: "Gewerbliche Vornutzung (Taxi/Miet-/Fahrschulwagen)" },
  { re: /\brost\b|durchgerostet|\bkorrosion\b/, level: "warn", text: "Korrosion angegeben" },
  { re: /reimport|eu-?fahrzeug|eu-?neuwagen|eu-?import/, level: "info", text: "Importfahrzeug – Historie und Ausstattung abgleichen" },
  { re: /scheckheft\s*(nicht|un)vollständig|kein scheckheft|ohne scheckheft/, level: "info", text: "Kein/unvollständiges Scheckheft" },
  { re: /\braucherfahrzeug\b|\bnichtraucher(?:fahrzeug)?\s*:?\s*nein\b|\braucher\b/, level: "info", text: "Raucherfahrzeug" },
  { re: /tieferlegung|tiefergelegt|chiptuning|leistungssteigerung|\btuning\b/, level: "info", text: "Tuning/Umbauten – Abnahmen prüfen" },
];

const damagedCondition = "Fahrzeugzustand als beschädigt angegeben – Schadenumfang klären";
const repairLabels = {
  engine: "Motorschaden",
  head: "Zylinderkopfdichtung",
  transmission: "Getriebeschaden",
  water: "Wasserschaden",
  body: "Karosserie-/Unfallschaden",
  diagnosis: "Schadenursache",
  total: "Totalschaden",
};
const legacyRepairs = new Map(RULES.filter((rule) => rule.repair).map(({ text, repair }) => [text, repair]));
legacyRepairs.set(damagedCondition, "diagnosis");
legacyRepairs.set("Rahmen-/Totalschaden erwähnt", "body");

export function requiredRepairs(risks) {
  const repairs = new Set((risks || []).map((risk) => risk.repair || legacyRepairs.get(risk.text)).filter((id) => Object.hasOwn(repairLabels, id)));
  if (repairs.size > 1) repairs.delete("diagnosis");
  if (repairs.has("engine")) repairs.delete("head");
  return [...repairs].map((id) => ({ id, label: repairLabels[id] }));
}

const engineSource = "https://www.autohaus-dethloff.de/blog/motorschaden-anzeichen-erkennen/";
const transmissionSource = "https://www.boschcarservice.com/de/de/werkstattleistungen/getriebereparatur/";
const waterSource = "https://www.adac.de/rund-ums-fahrzeug/unfall-schaden-panne/schaden/wasserschaden-auto/";

// Planning ranges in euros, including parts and labor. The high scenario allows for additional damage.
function estimateRepairs(vehicle, repairNeeds) {
  const power = vehicle.powerPs || Number(String(vehicle.power || "").match(/(\d+)\s*kW/i)?.[1]) * 1.36;
  const ranges = {
    engine: power >= 240 ? [4500, 6500, 9500, engineSource] : [3500, 4500, 6500, engineSource],
    head: [700, 1800, 3500, engineSource],
    transmission: vehicle.gearbox === "Schaltgetriebe" ? [1200, 2200, 3500, transmissionSource] : [2000, 3500, 5500, transmissionSource],
    body: [2000, 4500, 8500],
    water: [1500, 5000, 10000, waterSource],
    diagnosis: [500, 2000, 5500],
  };
  return repairNeeds.filter(({ id }) => id !== "total").map(({ id, label }) => {
    const [low, expected, high, source] = ranges[id];
    return { id, label, low, expected, high, source };
  });
}

const repairOverlap = {
  engine: ["oil-leak", "coolant", "chain", "timing-belt", "turbo"],
  head: ["coolant"],
  transmission: ["transmission"],
  body: ["body"],
};

/** Risks from the listing text and the data. Returns [{ level, text }] */
export function riskChecks(vehicle = {}, text = "", { marketValue: mv = null, now = new Date(), fraudPct = 30 } = {}) {
  const t = String(text || "").toLowerCase();
  const out = [];
  const seen = new Set();
  for (const r of RULES) {
    if (listingEvidence(r.re, t) && !seen.has(r.text)) {
      seen.add(r.text);
      out.push({ level: r.level, text: r.text, ...(r.repair ? { repair: r.repair } : {}) });
    }
  }
  if (listingEvidence(/\b(?:beschädigt|unfallfahrzeug)\b/i, vehicle.condition) && !out.some((risk) => risk.repair)) {
    out.push({ level: "critical", text: damagedCondition, repair: "diagnosis" });
  }
  if (listingEvidence(/(?:anzahlung|vorkasse)\s+(?:vor (?:der )?besichtigung|zwingend|erforderlich)/, t)) {
    out.push({ level: "critical", text: "Vorkasse oder Anzahlung vor Besichtigung gefordert" });
  }

  const yr = regYear(vehicle.firstRegistration);
  const age = yr ? now.getFullYear() + now.getMonth() / 12 - yr : null;
  const km = num(vehicle.mileage);
  if (age != null && km != null && age > 0.5) {
    const perYear = km / age;
    if (perYear > 25000) out.push({ level: "warn", text: `Viel gefahren: ca. ${fmtInt(perYear)} km pro Jahr` });
    else if (perYear < 3000 && age > 3) out.push({ level: "info", text: `Sehr wenig gefahren (${fmtInt(perYear)} km/Jahr) – Standschäden und Kilometer prüfen` });
  }
  if (age != null && age > 15) out.push({ level: "warn", text: `Hohes Alter (${Math.floor(age)} Jahre) – schwerer verkäuflich` });
  if (km != null && km > 200000) out.push({ level: "warn", text: `Hohe Laufleistung (${fmtInt(km)} km)` });
  if (vehicle.owners != null && vehicle.owners >= 4) out.push({ level: "warn", text: `${vehicle.owners} Vorbesitzer` });

  const tuev = String(vehicle.tuevUntil || "");
  const ty = regYear(tuev);
  if (tuev !== "neu" && ty != null && ty - (now.getFullYear() + now.getMonth() / 12) < 0.25) {
    out.push({ level: "warn", text: "TÜV läuft ab / ist abgelaufen – HU-Kosten einplanen" });
  }

  const price = num(vehicle.adPrice);
  if (price && mv?.value && mv.confidence !== "low" && price < mv.value * (1 - fraudPct / 100)) {
    out.push({ level: "critical", text: `Preis über ${fraudPct} % unter Marktwert – Schaden oder Betrug möglich, genau prüfen` });
  }
  if (!vehicle.vin) out.push({ level: "info", text: "Keine FIN im Inserat – beim Verkäufer erfragen (Historie prüfen)" });

  const order = { critical: 0, warn: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

const fmtInt = (n) => new Intl.NumberFormat("de-DE").format(Math.round(n));

/* ------------------------------ calculation ------------------------------ */

/** Calculate the resale scenarios and the cost-covering purchase limit from the listing. */
export function calculate({ vehicle = {}, market = null, params = {}, extras = [], risks = [], issues = [], demand = null, ownSales = [], travel = null }) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const asking = num(vehicle.adPrice) > 0 ? vehicle.adPrice : null;
  const repairNeeds = requiredRepairs(risks);
  const repairs = estimateRepairs(vehicle, repairNeeds);
  const repairCosts = Object.fromEntries(["low", "expected", "high"].map((key) => [key, repairs.reduce((sum, repair) => sum + repair[key], 0)]));
  const base = { asking, repairs, repairCosts, marketValue: market?.value ?? null };
  if (repairNeeds.some(({ id }) => id === "total") || listingEvidence(/\btotal\s*schaden\b/i, vehicle.name)) {
    return { ...base, ok: false, verdict: "pass", reasons: ["Als Totalschaden inseriert. Für den regulären Wiederverkauf ist kein belastbarer Erlös ableitbar."] };
  }
  if (!(num(market?.value) > 0)) {
    return { ...base, ok: false, verdict: "review", reasons: ["Die verfügbaren Marktdaten reichen für eine Schätzung von Wiederverkauf und Gewinn nicht aus."] };
  }
  const reasons = [];
  const factors = [];

  const discount = market.basis === "sales" ? 0 : Math.min(30, Math.max(0, p.saleDiscountPct));
  const discountFactor = 1 - discount / 100;
  const saleFromMarket = market.value * discountFactor;
  let sale = saleFromMarket;
  let saleLow = Math.min(market.low || market.value, market.value) * discountFactor;
  let saleHigh = Math.max(market.high || market.value, market.value) * discountFactor;
  factors.push({ tone: "neutral", label: market.proxy ? "Marktorientierung" : "Marktbasis", detail: `${fmtInt(market.value)} € (${market.count ? `${market.count} Preise, ` : ""}${market.method})${discount ? ` mit ${discount} % Verkaufsnachlass` : ""}` });
  const own = ownSales.map((x) => num(Number(x.price))).filter((price) => price > 0);
  if (own.length >= 2 && market.basis !== "sales" && !market.proxy) {
    const ownMed = median(own);
    const weight = Math.min(0.55, own.length / (own.length + 5));
    sale = (1 - weight) * sale + weight * ownMed;
    saleLow = (1 - weight) * saleLow + weight * quantile(own, 0.2);
    saleHigh = (1 - weight) * saleHigh + weight * quantile(own, 0.8);
    factors.push({ tone: ownMed >= saleFromMarket ? "good" : "bad", label: "Eigene Verkäufe", detail: `${own.length} ähnliche Autos zum Median von ${fmtInt(ownMed)} € · ${Math.round(weight * 100)} % Gewicht` });
  }
  const saleBeforeCalibration = Math.round(sale);
  if (p.calibration && p.calibration !== 1 && market.basis !== "sales" && !market.proxy) {
    sale *= p.calibration;
    saleLow *= p.calibration;
    saleHigh *= p.calibration;
    factors.push({ tone: "neutral", label: "Gelernte Korrektur", detail: `${Math.round(p.calibration * 100)} % der ursprünglichen Verkaufsschätzung` });
  }
  sale = Math.round(sale);
  saleLow = Math.min(sale, Math.round(saleLow));
  saleHigh = Math.max(sale, Math.round(saleHigh));

  const standDays = Math.round(num(params?.standDays) ?? demand?.days ?? p.standDays);
  const standing = Math.round(standDays * p.costPerDay);
  // not drivable → tow truck; otherwise the driver (train there, car back) when the distance is known
  const notDrivable = risks.some((risk) => risk.text === "Fahrzeug nicht fahrbereit");
  const driver = notDrivable ? null : driverCost(travel, p);
  const transport = notDrivable ? Math.max(p.transport, 350) : driver ? driver.total : p.transport;
  const covered = new Set(repairs.flatMap(({ id }) => repairOverlap[id] || []));
  const includedExtras = extras.filter((e) => e.on !== false && !covered.has(e.id));
  const extra = includedExtras.reduce((sum, e) => sum + (num(Number(e.cost)) || 0), 0);
  const fixed = p.recon + transport + standing + extra;
  const warrantyAt = (price) => Math.round(price * p.warrantyPct / 100);
  const costsAt = (price, repairCost) => fixed + warrantyAt(price) + repairCost;
  const net = p.margin25a ? 100 / 119 : 1;
  const taxAt = (price, purchase) => Math.max(0, price - purchase) * (1 - net);
  const profitAt = (price, repairCost) => asking ? Math.round(price - asking - taxAt(price, asking) - costsAt(price, repairCost)) : null;
  const profit = profitAt(sale, repairCosts.expected);
  const profitLow = profitAt(saleLow, repairCosts.high);
  const profitHigh = profitAt(saleHigh, repairCosts.low);
  const breakEven = Math.max(0, round100(sale - costsAt(sale, repairCosts.expected) / net));
  const conservativeBreakEven = Math.max(0, round100(saleLow - costsAt(saleLow, repairCosts.high) / net));
  // Einkaufslimit: highest price that still leaves the minimum profit (after costs and margin tax)
  const minProfit = Math.max(0, Number(p.minProfit) || 0);
  const targetProfit = Math.max(minProfit, Number(p.targetProfit) || 0);
  const buyLimit = Math.max(0, round100(sale - (costsAt(sale, repairCosts.expected) + minProfit) / net));
  const buyTarget = Math.max(0, round100(sale - (costsAt(sale, repairCosts.expected) + targetProfit) / net));
  const buyLimitSafe = Math.max(0, round100(saleLow - (costsAt(saleLow, repairCosts.high) + minProfit) / net));
  if (extra) factors.push({ tone: "bad", label: "Weitere Kosten", detail: `${fmtInt(extra)} € (${includedExtras.map((e) => e.item).join(", ")})` });
  if (repairs.length) factors.push({ tone: "bad", label: "Geschätzte Instandsetzung", detail: `${fmtInt(repairCosts.expected)} € kalkuliert · Spanne ${fmtInt(repairCosts.low)}–${fmtInt(repairCosts.high)} €` });
  if (driver) factors.push({ tone: "neutral", label: "Fahrer holt ab", detail: `Bahn hin, Auto zurück: ca. ${String(driver.hours).replace(".", ",")} Std. × ${fmtInt(p.driverHourly)} € + Ticket ${fmtInt(driver.ticket)} € + Sprit ${fmtInt(driver.fuel)} € = ${fmtInt(driver.total)} €` });
  if (demand) factors.push({ tone: "neutral", label: `Nachfrage ${demand.level}`, detail: `ca. ${standDays} Tage Standzeit · ${fmtInt(standing)} € Standkosten` });

  const critical = risks.filter((r) => r.level === "critical");
  const possibleCosts = issues.filter((i) => i.relevant && !i.due && i.level !== "info").reduce((sum, i) => sum + (Number(i.costTo) || 0), 0);
  let verdict = "review";
  if (asking == null) {
    reasons.push("Das Inserat enthält keinen Angebotspreis. Die Kalkulation zeigt den kostendeckenden Einkauf.");
  } else if (profit <= 0) {
    const reachable = conservativeBreakEven > 0 && conservativeBreakEven >= asking * (1 - p.negotiateRangePct / 100);
    verdict = reachable && profitHigh > 0 && !critical.length && market.confidence !== "low" ? "negotiate" : "pass";
    reasons.push(`Beim Angebotspreis ergibt die Schätzung ${profit < 0 ? `rund ${fmtInt(-profit)} € Verlust` : "keinen Überschuss"}.`);
    if (buyLimit > 0) reasons.push(`Einkaufslimit für mindestens ${fmtInt(minProfit)} € Gewinn: ${fmtInt(buyLimit)} €.`);
  } else if (profit < minProfit) {
    // profitable, but below the dealer's minimum per car → only at a lower price
    const reachable = buyLimit > 0 && buyLimit >= asking * (1 - p.negotiateRangePct / 100);
    verdict = reachable && !critical.length && market.confidence !== "low" ? "negotiate" : "pass";
    reasons.push(`Beim Angebotspreis bleiben nur rund ${fmtInt(profit)} € – Ziel sind mindestens ${fmtInt(minProfit)} € pro Auto.`);
    if (buyLimit > 0) reasons.push(`Einkaufslimit: höchstens ${fmtInt(buyLimit)} € zahlen.`);
  } else {
    reasons.push(`Beim Angebotspreis liegt das geschätzte Ergebnis bei ${fmtInt(profit)} €.`);
    if (profitLow > possibleCosts && !critical.length && market.confidence !== "low") verdict = "buy";
    if (profitLow <= 0) reasons.push("Im vorsichtigen Szenario deckt der Erlös die Kosten nicht.");
    else if (profitLow <= possibleCosts) reasons.push("Mögliche weitere Schäden können den Überschuss aufzehren.");
  }
  if (critical.length) factors.push({ tone: "bad", label: "Ernste Risiken", detail: critical.map((r) => r.text).join(" · ") });
  if (market.proxy) reasons.push("Die Verkaufsspanne stützt sich auf ein verwandtes Modell. Die Preisorientierung ist grob.");
  else if (market.confidence === "low") reasons.push("Die Verkaufsschätzung beruht auf einer schwachen Datenbasis.");
  if (saleLow < sale || repairs.length) factors.push({ tone: "neutral", label: "Vorsichtiges Szenario", detail: `Verkauf ${fmtInt(saleLow)} €${repairs.length ? `, Reparatur ${fmtInt(repairCosts.high)} €` : ""}` });

  return {
    ...base,
    ok: true, verdict, reasons, factors, sale, saleBeforeCalibration, saleLow, saleHigh,
    costs: { recon: p.recon, transport, standing, extra, repair: repairCosts.expected, warranty: warrantyAt(sale), total: costsAt(sale, repairCosts.expected) },
    includedExtras, profit, profitLow, profitHigh, breakEven, conservativeBreakEven,
    buyLimit, buyTarget, buyLimitSafe, minProfit, targetProfit, driver,
    marginTax: asking ? Math.round(taxAt(sale, asking)) : null,
  };
}
