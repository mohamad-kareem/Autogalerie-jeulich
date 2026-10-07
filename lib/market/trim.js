/**
 * Ausstattungslinie (trim), Sportmodell and Karosserie read from an ad's
 * title, model and variant text.
 *
 * Why it matters: a "Golf 1.5 TSI Highline" and a "Golf 1.5 TSI Trendline"
 * have the same engine, year and km, but not the same price. A "Golf GTD" is
 * a different car from a "Golf 2.0 TDI" even though both are 2.0 diesels.
 * And a "Golf Variant" (Kombi) or a cabrio is priced differently again.
 *
 * Each brand names its lines differently, so the table is per brand. The rank
 * is only an order inside one brand: 1 = Basis, 2 = Mitte, 3 = Oben,
 * 3.5 = Sport-Optik-Linie (R-Line, S line, AMG Line …), 4 = Topausstattung.
 */

import { normalizeText } from "./utils";

/* ---------------------------------------------------------------- trims */

// Phrases are written normalised: lower case, single spaces, no hyphens.
const BRAND_TRIMS = {
  volkswagen: {
    trendline: 1, basis: 1, startline: 1, life: 2, comfortline: 2, move: 2, united: 2, join: 2,
    "iq drive": 2.5, highline: 3, style: 3, "r line": 3.5, "black style": 3.5, elegance: 3, "goal": 2,
  },
  skoda: {
    active: 1, easy: 1, ambition: 2, cool: 2, clever: 2.5, style: 3, elegance: 3,
    sportline: 3.5, "monte carlo": 3.5, scout: 3.5, "laurin klement": 4, "l k": 4, selection: 3,
  },
  seat: { reference: 1, entry: 1, style: 2, xcellence: 3, fr: 3.5, "black edition": 3.5 },
  cupra: { vz: 3.5 },
  audi: {
    basis: 1, attraction: 1, ambiente: 2, advanced: 2, sport: 2.5, ambition: 2.5,
    design: 3, "s line": 3.5, "black edition": 3.5, "edition one": 4,
  },
  "mercedes benz": {
    classic: 1, style: 2, urban: 2, elegance: 2.5, sport: 2.5, progressive: 3,
    avantgarde: 3, exclusive: 3.5, "amg line": 3.5, "night edition": 3.5,
  },
  bmw: {
    advantage: 2, "sport line": 3, "luxury line": 3, "modern line": 3, xline: 3,
    "m sport": 3.5, "m sportpaket": 3.5, "m paket": 3.5,
  },
  opel: {
    selection: 1, essentia: 1, edition: 1.5, enjoy: 2, active: 2, design: 2, cosmo: 3,
    dynamic: 3, elegance: 3, innovation: 3, ultimate: 4, "gs line": 3.5, "opc line": 3.5,
  },
  ford: {
    ambiente: 1, trend: 1.5, "cool connect": 2, "cool sound": 2, titanium: 3, active: 3,
    "st line": 3.5, vignale: 4,
  },
  renault: {
    life: 1, authentique: 1, expression: 1.5, zen: 2, experience: 2, evolution: 2, business: 2,
    limited: 2.5, intens: 3, techno: 3, iconic: 3.5, "rs line": 3.5, "esprit alpine": 3.5, "initiale paris": 4,
  },
  peugeot: { access: 1, like: 1, active: 2, allure: 3, "gt line": 3.5, gt: 4 },
  citroen: { live: 1, feel: 2, "c series": 2.5, shine: 3, max: 3 },
  ds: { chic: 2, "so chic": 2, performance: 3.5, rivoli: 4 },
  hyundai: {
    pure: 1, select: 1.5, trend: 2, intro: 2, style: 3, prime: 3.5, premium: 3.5, "n line": 3.5,
  },
  kia: { attract: 1, "edition 7": 2, vision: 2.5, spirit: 3, platinum: 4, "gt line": 3.5 },
  toyota: {
    cool: 1, comfort: 1.5, business: 2, "team d": 2.5, "team deutschland": 2.5, club: 2.5,
    lounge: 3, style: 3, executive: 3.5, "gr sport": 3.5,
  },
  fiat: { pop: 1, easy: 1.5, cross: 2.5, lounge: 3, sport: 3, dolcevita: 3 },
  dacia: {
    access: 1, essential: 1.5, ambiance: 1.5, comfort: 2, expression: 2.5, laureate: 2.5,
    prestige: 3, journey: 3, extreme: 3,
  },
  mini: { classic: 2, salt: 2, pepper: 2.5, chili: 3, yours: 4 },
  mazda: {
    "prime line": 1, "center line": 2, "exclusive line": 3, homura: 3.5, "sports line": 4, takumi: 4,
  },
  nissan: { visia: 1, acenta: 2, "n connecta": 3, "n design": 3.5, tekna: 4 },
  volvo: { kinetic: 1, momentum: 2, core: 2, plus: 3, summum: 3.5, inscription: 3.5, "r design": 3.5, ultimate: 4 },
  porsche: {},
};

const BRAND_ALIASES = {
  vw: "volkswagen",
  mercedes: "mercedes benz",
  "mercedes benz": "mercedes benz",
  "mb": "mercedes benz",
  "citroen": "citroen",
};

/** Normalised brand key for the table, or null. */
export function brandKey(make) {
  const text = normalizeText(make);
  if (!text) return null;
  if (BRAND_TRIMS[text]) return text;
  if (BRAND_ALIASES[text]) return BRAND_ALIASES[text];
  for (const key of Object.keys(BRAND_TRIMS)) {
    if (text.startsWith(key) || key.startsWith(text)) return key;
  }
  return null;
}

/* ---------------------------------------------------- performance models */

// A different car, not just more equipment. Checked on the whole text.
const PERFORMANCE = [
  { id: "GTI", test: /\bgti\b/ },
  { id: "GTD", test: /\bgtd\b/ },
  { id: "GTE", test: /\bgte\b/ },
  { id: "R", test: /\b(golf|t roc|tiguan|arteon|touareg|passat|scirocco) r\b(?! line)/ },
  { id: "RS", test: /\brs ?[2-7q]\d?\b|\brs ?e tron\b|\b(octavia|fabia|enyaq|kodiaq|megane|clio|focus|fiesta) rs\b(?! line)/ },
  { id: "AMG", test: /\b(35|43|45|53|55|63|65) amg\b|\bamg (gt|35|43|45|53|55|63|65)\b|\bmercedes amg\b/ },
  { id: "M", test: /\bm[2-8]\b(?! sport)|\bm\d{3}[id]\b|\bx[3-7] m\b(?! sport)|\bx[3-7] m\d{2}[id]\b/ },
  { id: "ST", test: /\b(fiesta|focus|puma|mondeo|kuga) st\b(?! line)/ },
  { id: "OPC", test: /\bopc\b(?! line)/ },
  { id: "GSI", test: /\bgsi\b/ },
  { id: "CUPRA", test: /\bcupra\b(?! born)(?! formentor)(?! ateca)(?! leon)(?! tavascan)/ },
  { id: "TYPE R", test: /\btype r\b/ },
  { id: "N", test: /\b(i20|i30|kona|elantra) n\b(?! line)/ },
  { id: "JCW", test: /\bjcw\b|\bjohn cooper works\b/ },
  { id: "ABARTH", test: /\babarth\b/ },
];

/* ------------------------------------------------------------- body */

const BODY_PATTERNS = [
  { id: "CABRIO", test: /\b(cabrio|cabriolet|roadster|spider|spyder|convertible)\b/ },
  { id: "KOMBI", test: /\b(variant|avant|touring|kombi|turnier|sports ?tourer|sportstourer|estate|sw|break|combi|shooting brake|caravan|t modell|alltrack|allroad|cross country)\b/ },
  { id: "COUPE", test: /\b(coupe|gran coupe)\b/ },
  { id: "VAN", test: /\b(sportsvan|sports van|touran|sharan|grand|tourer|space ?tourer|multivan|caddy|transporter|kastenwagen)\b/ },
];

const BODYTYPE_FIELD = [
  { id: "CABRIO", test: /cabrio|roadster/ },
  { id: "KOMBI", test: /kombi|estate|station/ },
  { id: "COUPE", test: /coupe|sportwagen/ },
  { id: "VAN", test: /van|minibus|transporter/ },
];

/* ------------------------------------------------------------- reading */

function textOf(vehicle) {
  return normalizeText(
    [vehicle?.make, vehicle?.model, vehicle?.variant, vehicle?.title].filter(Boolean).join(" "),
  );
}

/** Finds the highest-ranked trim phrase of the brand in the text. */
function findTrim(text, brand) {
  const table = brand ? BRAND_TRIMS[brand] : null;
  if (!table) return null;
  let best = null;
  // Longer phrases first, so "r line" wins over a stray "line".
  const phrases = Object.keys(table).sort((a, b) => b.length - a.length);
  let rest = ` ${text} `;
  for (const phrase of phrases) {
    const needle = ` ${phrase} `;
    if (rest.includes(needle)) {
      const rank = table[phrase];
      if (!best || rank > best.rank) best = { name: phrase, rank };
      // "gt line" must not also count as "gt"
      rest = rest.split(needle).join(" | ");
    }
  }
  return best;
}

function findPerformance(text) {
  for (const entry of PERFORMANCE) {
    if (entry.test.test(text) && (!entry.needs || entry.needs.test(text))) return entry.id;
  }
  return null;
}

function findBody(vehicle, text) {
  for (const entry of BODY_PATTERNS) if (entry.test.test(text)) return entry.id;
  const field = normalizeText(vehicle?.bodyType);
  if (field) for (const entry of BODYTYPE_FIELD) if (entry.test.test(field)) return entry.id;
  return null;
}

/**
 * @returns {{ trim: {name:string,rank:number}|null, performance: string|null, body: string|null, brand: string|null }}
 */
export function readTrim(vehicle) {
  const text = textOf(vehicle);
  const brand = brandKey(vehicle?.make);
  return {
    brand,
    trim: findTrim(text, brand),
    performance: findPerformance(text),
    body: findBody(vehicle, text),
  };
}

/** "Highline", "R-Line" … for display. */
export function trimLabel(trim) {
  if (!trim) return null;
  if (trim.name === "l k" || trim.name === "laurin klement") return "Laurin & Klement";
  return trim.name
    .split(" ")
    .map((part) => (part.length <= 3 && !/^(cool|tour|pop|max|fr)$/.test(part) ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(" ")
    .replace(/^Fr$/, "FR");
}

const BODY_LABELS = { CABRIO: "Cabrio", KOMBI: "Kombi", COUPE: "Coupé", VAN: "Van" };
export function bodyLabel(body) {
  return BODY_LABELS[body] || null;
}

/**
 * Compares a comparable with the target.
 *  reject     – a different car (other performance model, cabrio vs. closed)
 *  trimScore  – 0..1 for the similarity score
 *  bodyScore  – 0..1
 *  notes      – short German differences for the table
 */
export function compareTrim(candidate, target) {
  const a = readTrim(candidate);
  const t = readTrim(target);
  const notes = [];

  // Performance model on one side only, or two different ones.
  if (a.performance !== t.performance && (a.performance || t.performance)) {
    return {
      reject: t.performance
        ? `Kein ${t.performance} – Zielfahrzeug ist ein Sportmodell.`
        : `Sportmodell (${a.performance}) – anderes Fahrzeug.`,
    };
  }

  // Body: a cabrio is never priced like a closed car.
  if (a.body !== t.body && (a.body === "CABRIO" || t.body === "CABRIO")) {
    return { reject: a.body === "CABRIO" ? "Cabrio – anderes Fahrzeug." : "Kein Cabrio – Zielfahrzeug ist ein Cabrio." };
  }

  let bodyScore = 1;
  if (a.body !== t.body) {
    // Both stated and different (Kombi vs. Van), or only one side named it.
    bodyScore = a.body && t.body ? 0.2 : 0.55;
    if (a.body) notes.push(bodyLabel(a.body));
  }

  let trimScore;
  if (a.trim && t.trim) {
    const gap = Math.abs(a.trim.rank - t.trim.rank);
    trimScore = gap === 0 ? 1 : gap <= 0.5 ? 0.8 : gap <= 1 ? 0.55 : 0.2;
    if (gap > 0) notes.push(`Linie: ${trimLabel(a.trim)}`);
  } else if (a.trim || t.trim) {
    trimScore = 0.6;
  } else {
    trimScore = 0.7;
  }

  return { reject: null, trimScore, bodyScore, notes, candidateTrim: a.trim, targetTrim: t.trim };
}
