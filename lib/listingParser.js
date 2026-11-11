// Reads vehicle data from a listing on mobile.de, Kleinanzeigen or AutoScout24.
// Works on the page HTML (server fetch) or on text copied from the listing.
// Pure JS – no Node or browser APIs.

import { listingEvidence } from "./dealCheck.js";
import { berlinDay } from "./sales.js";

export const LISTING_HOSTS = [
  { re: /(^|\.)mobile\.de$/i, source: "mobile.de" },
  { re: /(^|\.)kleinanzeigen\.de$/i, source: "Kleinanzeigen" },
  { re: /(^|\.)autoscout24\.[a-z.]+$/i, source: "AutoScout24" },
];

/** null when the link is not from one of the supported sites */
export function listingSource(url) {
  try {
    const u = new URL(String(url).trim());
    if (!/^https?:$/.test(u.protocol)) return null;
    return LISTING_HOSTS.find((h) => h.re.test(u.hostname))?.source || null;
  } catch {
    return null;
  }
}

/* ------------------------------ helpers ------------------------------ */

const MONTHS = {
  januar: 1, jan: 1, februar: 2, feb: 2, märz: 3, maerz: 3, mär: 3, mrz: 3, april: 4, apr: 4, mai: 5, juni: 6, jun: 6,
  juli: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12,
};

const ENTITIES = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", euro: "€", ndash: "–", mdash: "—", middot: "·", times: "×" };

export function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n] ?? m);
}

const clean = (s) => decodeEntities(s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const digits = (s) => {
  const d = String(s ?? "").replace(/[^\d]/g, "");
  return d ? Number(d) : null;
};

/** "01/2014", "1.2014", "März 2015", "2014-01-01", "2014" → "01/2014" (or "2014") */
export function normMonthYear(v) {
  const s = clean(v).toLowerCase();
  if (!s) return "";
  let m = s.match(/(\d{4})-(\d{2})(?:-\d{2})?/);
  if (m) return `${m[2]}/${m[1]}`;
  m = s.match(/\b(\d{1,2})\s*[/.]\s*(\d{4})\b/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return `${m[1].padStart(2, "0")}/${m[2]}`;
  m = s.match(/([a-zäöü]+)\.?\s+(\d{4})/);
  if (m && MONTHS[m[1]]) return `${String(MONTHS[m[1]]).padStart(2, "0")}/${m[2]}`;
  m = s.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function normListingDate(value, asOf = new Date()) {
  const text = clean(value);
  const relative = text.match(/^(heute|gestern)(?:,?\s+(?:um\s+)?\d{1,2}:\d{2}(?:\s+uhr)?)?$/i)?.[1];
  if (relative && Number.isFinite(new Date(asOf).getTime())) {
    const day = new Date(berlinDay(asOf));
    if (relative.toLowerCase() === "gestern") day.setUTCDate(day.getUTCDate() - 1);
    return day.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) {
    const timestamp = new Date(text);
    return Number.isFinite(timestamp.getTime()) ? berlinDay(timestamp) : "";
  }
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
  const german = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,?\s+\d{1,2}:\d{2}(?:\s+uhr)?)?$/i);
  const day = iso || (german ? `${german[3]}-${german[2].padStart(2, "0")}-${german[1].padStart(2, "0")}` : "");
  const date = new Date(day);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(day) ? day : "";
}

const SAVED_NUMBER = "\\d{1,3}(?:\\.\\d{3})+|\\d+";
const savedCountValue = new RegExp(`^(${SAVED_NUMBER})(?:\\s*(?:×|x|mal))?$`, "i");
const savedCountText = new RegExp(`^\\**\\s*(${SAVED_NUMBER})\\s*(?:[- ]?mal gemerkt|[×x]\\s*gemerkt|(?:personen|nutzer|accounts|menschen) haben sich (?:diese|die) anzeige gemerkt)[.!]?\\s*\\**$`, "i");

function normSavedCount(value) {
  const count = clean(value).match(savedCountValue)?.[1];
  const number = count == null ? NaN : Number(count.replace(/\./g, ""));
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function savedCountFromLines(lines) {
  for (const line of lines) {
    const count = normSavedCount(line.match(savedCountText)?.[1]);
    if (count != null) return count;
  }
  return null;
}

// Kleinanzeigen puts the publication date immediately below the listing's location.
function dateBelowLocation(lines, asOf) {
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!/^\d{5}\s+\S/.test(lines[index])) continue;
    const date = normListingDate(lines[index + 1], asOf);
    if (date) return date;
  }
  return "";
}

export function normGearbox(v) {
  const s = clean(v).toLowerCase();
  if (!s) return "";
  if (s.includes("halbautomat")) return "Halbautomatik";
  if (s.includes("automat")) return "Automatik";
  if (/schalt|manuell|manual/.test(s)) return "Schaltgetriebe";
  return clean(v);
}

export function normFuel(v) {
  const s = clean(v).toLowerCase();
  if (!s) return "";
  if (s.includes("plug-in") || s.includes("hybrid")) return s.includes("diesel") ? "Hybrid (Diesel)" : "Hybrid (Benzin)";
  if (s.includes("elektro") || s === "electric") return "Elektro";
  if (s.includes("diesel")) return "Diesel";
  if (s.includes("benzin") || s.includes("super") || s === "b") return "Benzin";
  if (s.includes("lpg") || s.includes("autogas")) return "Autogas (LPG)";
  if (s.includes("cng") || s.includes("erdgas")) return "Erdgas (CNG)";
  return clean(v);
}

/** "184 kW (250 PS)" | "140 PS" | 110 (kW) → { kw, ps, label } */
export function normPower(v, { kw: kwIn, ps: psIn } = {}) {
  const s = clean(v);
  let kw = kwIn ?? (s.match(/(\d+)\s*kW/i) ? Number(s.match(/(\d+)\s*kW/i)[1]) : null);
  let ps = psIn ?? (s.match(/(\d+)\s*PS/i) ? Number(s.match(/(\d+)\s*PS/i)[1]) : null);
  if (kw && !ps) ps = Math.round(kw * 1.35962);
  if (ps && !kw) kw = Math.round(ps / 1.35962);
  return { kw, ps, label: kw ? `${kw} kW (${ps} PS)` : "" };
}

const BRANDS = [
  "Alfa Romeo", "Aston Martin", "Land Rover", "Mercedes-Benz", "Mercedes", "Rolls-Royce", "Abarth", "Audi", "Bentley", "BMW", "BYD",
  "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Citroen", "Cupra", "Dacia", "Daihatsu", "Dodge", "DS", "Ferrari", "Fiat", "Ford",
  "Honda", "Hyundai", "Infiniti", "Isuzu", "Iveco", "Jaguar", "Jeep", "Kia", "Lada", "Lamborghini", "Lancia", "Lexus", "Lotus", "Maserati",
  "Mazda", "McLaren", "MG", "MINI", "Mitsubishi", "Nissan", "Opel", "Peugeot", "Polestar", "Porsche", "Renault", "Saab", "Seat", "Skoda",
  "Škoda", "Smart", "SsangYong", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "VW", "Volvo",
];

/** "Audi S8 Plus 4.0 TFSI …" → "Audi" */
export function brandFromTitle(title) {
  const t = String(title || "").toLowerCase();
  return BRANDS.find((b) => t.startsWith(`${b.toLowerCase()} `) || t === b.toLowerCase()) || "";
}

/* ------------------------- label / value pairs ------------------------- */

const LABELS = {
  marke: "brand",
  hersteller: "brand",
  modell: "model",
  kilometerstand: "mileage",
  laufleistung: "mileage",
  erstzulassung: "firstRegistration",
  kraftstoffart: "fuel",
  kraftstoff: "fuel",
  leistung: "power",
  getriebe: "gearbox",
  getriebeart: "gearbox",
  tüv: "tuev",
  "tüv bis": "tuev",
  "tüv / hu": "tuev",
  "tüv/hu": "tuev",
  hu: "tuev",
  "hu bis": "tuev",
  "hu/au": "tuev",
  "hu/au bis": "tuev",
  "nächste hu": "tuev",
  "fahrzeughalter": "owners",
  "anzahl der fahrzeughalter": "owners",
  "anzahl fahrzeughalter": "owners",
  vorbesitzer: "owners",
  "anzahl vorbesitzer": "owners",
  außenfarbe: "color",
  farbe: "color",
  "farbe (hersteller)": "colorMaker",
  preis: "adPrice",
  kaufpreis: "adPrice",
  fahrzeugzustand: "condition",
  zustand: "condition",
  unfallfrei: "accidentFree",
  unfall: "accident",
  unfallschaden: "accident",
  unfallwagen: "accident",
  unfallhistorie: "accident",
  steuertrieb: "timingDrive",
  scheckheft: "serviceHistory",
  verkäufer: "seller",
  anbietertyp: "seller",
  standort: "location",
  "online seit": "listedSince",
  "eingestellt am": "listedSince",
  "inseriert am": "listedSince",
  "veröffentlicht am": "listedSince",
  gemerkt: "savedCount",
  fahrzeugtyp: "bodyType",
  kategorie: "bodyType",
  karosserieform: "bodyType",
  karosserie: "bodyType",
  "anzahl türen": "doors",
  "anzahl der türen": "doors",
  türen: "doors",
  "anzahl sitzplätze": "seats",
  sitzplätze: "seats",
  sitze: "seats",
  umweltplakette: "sticker",
  schadstoffklasse: "emissionClass",
  "material innenausstattung": "interior",
  innenausstattung: "interior",
  polsterung: "interior",
  hubraum: "displacement",
  fin: "vin",
  "fahrzeug-identifikationsnummer": "vin",
  fahrgestellnummer: "vin",
  "fahrzeugidentnummer": "vin",
};

const labelKey = (line) => LABELS[clean(line).toLowerCase().replace(/[:*]+$/, "").trim()];

function explicitAccidentStatus(value) {
  const text = clean(value).toLowerCase()
    .replace(/^(?:gebrauchtfahrzeug|neufahrzeug)\b/, "")
    .replace(/^[\s,;–-]+|[\s.]+$/g, "");
  if (/^(?:unfallfrei|(?:kein|ohne) unfall(?:schaden)?|keine unfälle)$/.test(text)) return "free";
  if (/^(?:nicht unfallfrei|unfallfahrzeug|unfallwagen|unfallbeschädigt|(?:reparierter )?unfallschaden|unfallschaden repariert)$/.test(text)) return "accident";
  return "";
}

function listingAccidentStatus(raw, lines) {
  const free = clean(raw.accidentFree).toLowerCase();
  const damage = clean(raw.accident).toLowerCase();
  const reported = new Set([
    explicitAccidentStatus(raw.condition),
    /^(ja|yes)$/.test(free) ? "free" : /^(nein|no)$/.test(free) ? "accident" : "",
    /^(ja|yes)$/.test(damage) ? "accident" : /^(nein|no)$/.test(damage) ? "free" : explicitAccidentStatus(damage),
  ]);
  // A listing may put the usage category and accident status in separate spans.
  for (let i = 0; i < lines.length; i++) {
    const key = labelKey(lines[i]);
    if (key !== "condition" && key !== "accident") continue;
    const value = clean(lines[i + 1]);
    reported.add(explicitAccidentStatus(value));
    if (key === "condition" && /^(gebrauchtfahrzeug|neufahrzeug)\s*,?$/i.test(value)) {
      reported.add(explicitAccidentStatus(lines[i + 2]));
    }
  }
  reported.delete("");
  return reported.size === 1 ? reported.values().next().value : "";
}

/** Lines like ["Kilometerstand", "101.000 km", …] → { mileage: "101.000 km", … } */
export function pairsFromLines(lines) {
  const out = {};
  for (let i = 0; i < lines.length - 1; i++) {
    const key = labelKey(lines[i]);
    if (!key || out[key]) continue;
    const value = clean(lines[i + 1]);
    if (!value || labelKey(value) || value.length > 80) continue;
    out[key] = value;
  }
  // "MarkeOpel" / "Leistung140 PS" – label and value glued together (copied lists)
  const sorted = Object.keys(LABELS).sort((a, b) => b.length - a.length);
  for (const line of lines) {
    const c = clean(line);
    const low = c.toLowerCase();
    const label = sorted.find((l) => low.startsWith(l) && /^[A-ZÄÖÜ0-9]/.test(c.slice(l.length)));
    if (!label) continue;
    const key = LABELS[label];
    const value = c.slice(label.length).trim();
    if (!out[key] && value && value.length <= 80) out[key] = value;
  }
  // "Kilometerstand: 101.000 km" on one line (pasted text)
  for (const line of lines) {
    const text = clean(line);
    const m = text.match(/^([A-Za-zÄÖÜäöüß/ ().-]{2,32}):\s*(.{1,80})$/) ||
      text.match(/^(online seit|eingestellt am|inseriert am|veröffentlicht am|gemerkt)\s+(.{1,80})$/i);
    if (!m) continue;
    const key = labelKey(m[1]);
    if (key && !out[key]) out[key] = m[2];
  }
  if (!out.serviceHistory && lines.some((line) => /^scheckheftgepflegt$/i.test(line))) out.serviceHistory = "Scheckheftgepflegt";
  if (!out.seller) {
    const sellerType = lines.find((line) => /^(privater|gewerblicher) nutzer(?:$|\s+aktiv seit\b)/i.test(line));
    if (sellerType) out.seller = /^privater/i.test(sellerType) ? "Privat" : "Gewerblich";
  }
  return out;
}

/** Missing card details can still be available in a saved listing description. */
export function listingCardDetails(vehicle, description = "", asOf) {
  const lines = String(description || "").split(/\r?\n/).map(clean).filter(Boolean);
  const pairs = pairsFromLines(lines);
  const text = `${vehicle.name || ""}\n${lines.join("\n")}`;
  const belt = listingEvidence(/\b(?:neuer zahnriemen|mit zahnriemen|zahnriemen(?:\s+\S+){0,5}\s+(?:erneuert|gewechselt|ersetzt))\b/, text);
  const chain = listingEvidence(/\b(?:neue steuerkette|mit steuerkette|steuerkette(?:\s+\S+){0,5}\s+(?:erneuert|gewechselt|ersetzt))\b/, text);
  let serviceHistory = vehicle.serviceHistory || pairs.serviceHistory;
  if (!serviceHistory) {
    if (/\b(?:kein|ohne)\s+scheckheft\b/i.test(text)) serviceHistory = "Kein Scheckheft";
    else if (/\bscheckheft\s+(?:nicht\s+vollständig|unvollständig|lückenhaft)\b/i.test(text)) serviceHistory = "Unvollständig";
    else if (/\bnicht\s+s?checkheft\s*gepflegt\b|\bs?checkheft\s*gepflegt\s*:\s*nein\b/i.test(text)) serviceHistory = "Nicht scheckheftgepflegt";
    else if (listingEvidence(/\b(?:s?checkheft\s*gepflegt|(?:lückenloses|vollständiges) scheckheft)\b/, text)) serviceHistory = "Scheckheftgepflegt";
  }
  return {
    timingDrive: vehicle.timingDrive || pairs.timingDrive || (belt && !chain ? "Zahnriemen" : chain && !belt ? "Steuerkette" : ""),
    serviceHistory,
    condition: vehicle.condition || pairs.condition,
    seller: vehicle.seller || pairs.seller,
    location: vehicle.location || pairs.location,
    listedSince: vehicle.listedSince || normListingDate(pairs.listedSince, asOf) ||
      (vehicle.source === "Kleinanzeigen" ? dateBelowLocation(listingHeader(lines), asOf) : ""),
    savedCount: vehicle.savedCount ?? normSavedCount(pairs.savedCount) ?? savedCountFromLines(lines),
  };
}

export function htmlToLines(html) {
  const body = String(html || "")
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(dt|dd|li|span|div|p|td|th|h[1-6]|label|a|button|strong|b|time)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(body)
    .split("\n")
    .map((l) => l.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function listingHeader(lines) {
  const end = lines.findIndex((line) => /^(?:fahrzeug)?beschreibung$/i.test(line));
  return end < 0 ? lines : lines.slice(0, end);
}

/* ------------------------------ sources ------------------------------ */

function fromAutoScoutNextData(html) {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    const d = JSON.parse(m[1])?.props?.pageProps?.listingDetails;
    if (!d?.vehicle) return null;
    const v = d.vehicle;
    return {
      title: [v.make, v.model, v.modelVersionInput].filter(Boolean).join(" "),
      brand: v.make,
      model: v.model,
      mileage: v.mileageInKmRaw ?? null,
      firstRegistration: v.firstRegistrationDate || v.firstRegistrationDateRaw,
      powerKw: v.rawPowerInKw ?? null,
      powerPs: v.rawPowerInHp ?? null,
      gearbox: v.transmissionType,
      fuel: v.fuelCategory?.formatted || v.primaryFuel?.formatted,
      color: v.bodyColor,
      owners: v.noOfPreviousOwners ?? null,
      bodyType: v.bodyType,
      doors: v.numberOfDoors,
      seats: v.numberOfSeats,
      interior: [v.upholstery, v.upholsteryColor].filter(Boolean).join(", "),
      displacement: v.displacementInCCM,
      condition: v.hadAccident === false ? "Unfallfrei" : v.hadAccident === true ? "Unfallschaden" : "",
      tuev: v.nextVehicleSafetyInspection || (v.newInspection ? "neu" : ""),
      vin: v.vin || "",
      adPrice: d.prices?.public?.priceRaw ?? d.price?.priceRaw ?? null,
      image: Array.isArray(d.images) ? d.images[0] : "",
      location: [d.location?.zip, d.location?.city].filter(Boolean).join(" "),
      seller: d.seller?.companyName || ({ Private: "Privat", Dealer: "Händler" })[d.seller?.type],
      listedSince: normListingDate(d.datePosted || d.datePublished),
    };
  } catch {
    return null;
  }
}

function fromJsonLd(html) {
  const blocks = [...String(html).matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const items = (Array.isArray(data) ? data : data?.["@graph"] || [data]).filter(Boolean);
    const car = items.find((x) => /Car|Vehicle|Product/.test(String(x["@type"])) && (x.mileageFromOdometer || x.brand || x.model));
    if (!car) continue;
    const brand = typeof car.brand === "string" ? car.brand : car.brand?.name;
    return {
      title: car.name,
      brand,
      model: typeof car.model === "string" ? car.model : car.model?.name,
      mileage: car.mileageFromOdometer?.value ?? null,
      gearbox: car.vehicleTransmission,
      fuel: car.fuelType || car.vehicleEngine?.fuelType,
      firstRegistration: car.dateVehicleFirstRegistered || car.productionDate,
      color: car.color,
      vin: car.vehicleIdentificationNumber,
      adPrice: car.offers?.price != null ? Number(car.offers.price) : null,
      image: Array.isArray(car.image) ? car.image[0] : car.image,
      seller: car.offers?.seller?.name,
      listedSince: normListingDate(car.datePosted || car.datePublished || car.offers?.datePosted || car.offers?.datePublished),
    };
  }
  return null;
}

function metaContent(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  return clean(html.match(re)?.[1] || html.match(re2)?.[1] || "");
}

function firstMatch(html, re) {
  const m = String(html).match(re);
  return m ? clean(m[1].replace(/<[^>]+>/g, " ")) : "";
}

/* ------------------------------ public ------------------------------ */

// Sellers often append a mileage claim or a comma-separated equipment list
// after the model and trim. Keep trim names and engine designations intact.
const TITLE_MILEAGE_SUFFIX = /(?:\s+[–—-]\s*|[,;|]\s*|\s+)(?:(?:org\.?|original|nur)\s*)?\d+(?:[.,]\d{3})*\s*(?:t\s*km|tsd\.?\s*km|km)\b.*$/i;
const TITLE_EQUIPMENT_SUFFIX = /(?:\s+[–—-]\s*|[,;|]\s*|\s+)(?:pdc|shz|klima(?:anlage|automatik)?|navi(?:gation)?|garantie?)\b(?=\s*(?:[,;/|+&]|$)).*$/i;

/** Turn raw fields into the vehicle object used by the form. */
function finalize(raw, { url = "", source = "", lines = [] } = {}) {
  const power = normPower(raw.power || "", { kw: raw.powerKw ?? undefined, ps: raw.powerPs ?? undefined });
  const fr = normMonthYear(raw.firstRegistration);
  let title = clean(raw.title)
    .replace(/\s*[|–-]\s*(mobile\.de|kleinanzeigen.*|autoscout24.*)$/i, "")
    .split("*")[0]
    .replace(TITLE_MILEAGE_SUFFIX, "")
    .replace(TITLE_EQUIPMENT_SUFFIX, "")
    .replace(/\s+\|\s+/g, " ")
    .trim();
  const brand = clean(raw.brand);
  const model = clean(raw.model);
  if (!title || title.length < 3) title = [brand, model].filter(Boolean).join(" ");
  if (brand && !title.toLowerCase().includes(brand.toLowerCase())) title = `${brand} ${title}`;
  const tuevRaw = clean(raw.tuev);
  return {
    source,
    url,
    name: title.slice(0, 90),
    brand,
    model,
    firstRegistration: fr,
    mileage: typeof raw.mileage === "number" ? raw.mileage : digits(raw.mileage),
    fuel: normFuel(raw.fuel),
    power: power.label,
    powerPs: power.ps,
    gearbox: normGearbox(raw.gearbox),
    tuevUntil: /neu/i.test(tuevRaw) ? "neu" : normMonthYear(tuevRaw),
    color: clean(raw.color || raw.colorMaker),
    owners: raw.owners != null && raw.owners !== "" ? digits(raw.owners) : null,
    condition: clean(raw.condition),
    accidentStatus: listingAccidentStatus(raw, lines),
    bodyType: clean(raw.bodyType),
    doors: clean(raw.doors),
    seats: clean(raw.seats),
    interior: clean(raw.interior),
    sticker: clean(raw.sticker),
    emissionClass: clean(raw.emissionClass),
    displacement: clean(raw.displacement),
    vin: clean(raw.vin).replace(/\s+/g, "").toUpperCase().slice(0, 17),
    adPrice: typeof raw.adPrice === "number" ? raw.adPrice : digits(raw.adPrice),
    image: clean(raw.image),
    location: clean(raw.location),
    timingDrive: clean(raw.timingDrive),
    serviceHistory: clean(raw.serviceHistory),
    seller: clean(raw.seller),
    listedSince: normListingDate(raw.listedSince),
    savedCount: normSavedCount(raw.savedCount),
  };
}

/** How many of the important fields were found */
export const foundCount = (v) =>
  ["brand", "firstRegistration", "mileage", "fuel", "power", "gearbox"].filter((k) => v?.[k] !== "" && v?.[k] != null).length;

export function parseListingHtml(html, url = "") {
  const source = listingSource(url) || "";
  const lines = htmlToLines(html);
  const header = listingHeader(lines);
  const pairs = pairsFromLines(lines);
  const stats = pairsFromLines(header);
  const adInfo = source === "Kleinanzeigen" ? html.match(/\bid=["']viewad-extra-info["'][^>]*>([\s\S]{0,1500}?)<\/div>/i)?.[1] : "";
  const headerDate = source === "Kleinanzeigen" ? dateBelowLocation(header) : "";
  const adDateTime = adInfo?.match(/<time\b[^>]*\bdatetime=["']([^"']+)["']/i)?.[1];
  pairs.listedSince = normListingDate(stats.listedSince) || normListingDate(adDateTime) ||
    htmlToLines(adInfo).map((line) => normListingDate(line)).find(Boolean) || headerDate;
  pairs.savedCount = normSavedCount(stats.savedCount) ?? savedCountFromLines(header);
  const merged = {};
  const layers = [
    fromAutoScoutNextData(html) || {},
    fromJsonLd(html) || {},
    pairs,
    {
      title:
        firstMatch(html, /<h1[^>]*id="viewad-title"[^>]*>([\s\S]*?)<\/h1>/i) ||
        firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
        metaContent(html, "og:title"),
      adPrice: firstMatch(html, /id="viewad-price"[^>]*>([\s\S]*?)<\//i),
      image: firstMatch(html, /id="viewad-image"[^>]*src="([^"]+)"/i) || metaContent(html, "og:image"),
      location: firstMatch(html, /id="viewad-locality"[^>]*>([\s\S]*?)<\//i),
      listedSince: normListingDate(metaContent(html, "article:published_time")),
    },
  ];
  // the page headline is the best title (JSON-LD names are often cut off)
  const headline =
    firstMatch(html, /<h1[^>]*id="viewad-title"[^>]*>([\s\S]*?)<\/h1>/i) || firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (headline && headline.length > 3 && !layers[0].title) merged.title = headline;
  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer)) {
      if ((merged[k] == null || merged[k] === "") && v != null && v !== "") merged[k] = v;
    }
  }
  if (/logo|static\/img\/common/i.test(String(merged.image))) merged.image = "";
  return finalize(merged, { url, source, lines });
}

/** Text the user copied from the listing (Ctrl+A, Ctrl+C) */
export function parseListingText(text, url = "") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const pairs = pairsFromLines(lines);
  const source = listingSource(url) || "";
  const header = listingHeader(lines);
  pairs.listedSince = normListingDate(pairs.listedSince) || (source === "Kleinanzeigen" ? dateBelowLocation(header) : "");
  pairs.savedCount = normSavedCount(pairs.savedCount) ?? savedCountFromLines(lines);
  const priceLine = lines.find((l) => /^\d{1,3}(\.\d{3})*\s*€/.test(l));
  // the headline is usually repeated (gallery alt texts) – take the most frequent long line
  const freq = new Map();
  for (const l of lines) {
    if (l.length < 8 || l.length > 90 || labelKey(l) || /€|^\d|zurück|suchergebnis|pfeiltaste|zusammenfassung/i.test(l)) continue;
    freq.set(l, (freq.get(l) || 0) + 1);
  }
  const repeated = [...freq.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0]?.[0];
  const brandGuess = pairs.brand || brandFromTitle(repeated || "");
  const brandLow = String(brandGuess || "").toLowerCase();
  const title =
    repeated ||
    lines.find((l) => brandLow && l.toLowerCase().startsWith(brandLow) && l.length < 90 && !labelKey(l)) ||
    lines.find((l) => l.length > 3 && l.length < 90 && !labelKey(l) && !/€|zurück|suchergebnis/i.test(l)) ||
    "";
  return finalize(
    { ...pairs, brand: brandGuess, title, color: pairs.color || pairs.colorMaker, adPrice: pairs.adPrice || priceLine || null },
    { url, source, lines },
  );
}
