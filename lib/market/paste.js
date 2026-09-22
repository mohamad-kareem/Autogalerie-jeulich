/**
 * Reads a vehicle out of ad text the user copied from the portal.
 *
 * This exists because mobile.de rate-limits server-side fetches of its ads:
 * the first request from an IP tends to succeed and the following ones are
 * refused, which no amount of retrying or header tuning fixes. The dealer
 * already has the ad open, so `Strg+A, Strg+C` on the page and a paste here
 * removes the dependency on the portal's server entirely — and works the same
 * for every portal, including ones we do not support yet.
 *
 * Parsing leans on the German data labels, which are far more stable than any
 * markup: "Erstzulassung", "Kilometerstand", "Leistung", "Getriebe".
 */

import { extractLabelled } from "./html";
import { cleanText, toNumber } from "./utils";
import {
  detectConditionFromText,
  detectPriceType,
  detectServiceHistory,
  detectTuv,
  normalizeFuel,
  normalizeGearbox,
} from "./vehicle";

/** Words that start a line we should never mistake for the vehicle title. */
const TITLE_NOISE =
  /^(startseite|suche|merkliste|anmelden|registrieren|men[üu]|cookie|datenschutz|impressum|zur[üu]ck|weiter|filter|sortieren|angebote|fahrzeuge|parken|home|suchen|login|mein)/i;

const MAKES = [
  "Volkswagen", "VW", "Mercedes-Benz", "Mercedes", "BMW", "Audi", "Opel",
  "Ford", "Škoda", "Skoda", "Seat", "Cupra", "Renault", "Peugeot", "Citroën",
  "Citroen", "Fiat", "Alfa Romeo", "Toyota", "Lexus", "Honda", "Mazda",
  "Mitsubishi", "Nissan", "Subaru", "Suzuki", "Hyundai", "Kia", "Volvo",
  "Polestar", "Jaguar", "Land Rover", "Range Rover", "Mini", "Porsche",
  "Tesla", "Smart", "Dacia", "Jeep", "Chevrolet", "Chrysler", "Dodge",
  "Cadillac", "Maserati", "Ferrari", "Lamborghini", "Bentley", "Rolls-Royce",
  "Aston Martin", "MG", "BYD", "SsangYong", "Isuzu", "Iveco", "Abarth",
  "Lancia", "Saab", "Daihatsu", "Chery", "Genesis", "Chrysler",
];

/**
 * Finds the make mentioned earliest in the text.
 * Returns the canonical name plus the spelling actually used, so the model
 * can be split off a title that says "VW" where the make is "Volkswagen".
 */
function detectMake(text) {
  let best = null;

  for (const make of MAKES) {
    const pattern = new RegExp(`\\b${make.replace(/[-.]/g, "[-. ]?")}\\b`, "i");
    const hit = text.match(pattern);
    if (!hit) continue;
    if (best && hit.index >= best.index) continue;

    best = {
      index: hit.index,
      matched: hit[0],
      name:
        make === "VW"
          ? "Volkswagen"
          : make === "Mercedes"
            ? "Mercedes-Benz"
            : make === "Range Rover"
              ? "Land Rover"
              : make,
    };
  }

  return best;
}

/**
 * The headline of the ad — normally the first substantial line, and the line
 * that contains the make.
 */
function detectTitle(lines, make) {
  const candidates = lines.filter(
    (line) =>
      line.length >= 6 &&
      line.length <= 120 &&
      !TITLE_NOISE.test(line) &&
      !/^\d+[.,\d]*\s*(€|km|kW|PS)\b/i.test(line),
  );

  if (make) {
    const withMake = candidates.find((line) =>
      new RegExp(`\\b${make.split(/[\s-]/)[0]}`, "i").test(line),
    );
    if (withMake) return withMake;
  }

  return candidates[0] || null;
}

/**
 * Title from a body of text that has no useful line breaks — which is what a
 * rendered HTML page gives us once the tags are stripped. Takes the words
 * around the make and cuts at the first thing that cannot be part of a car
 * name.
 */
function titleFromText(head, spellings) {
  const aliases = [].concat(spellings).filter(Boolean);
  if (!aliases.length) return null;

  // Search for the spelling the ad actually uses ("VW"), not only the
  // canonical make ("Volkswagen") — otherwise nothing matches.
  const pattern = aliases
    .map((alias) => alias.replace(/[-.]/g, "[-. ]?"))
    .sort((a, b) => b.length - a.length)
    .join("|");

  const hit = head.match(new RegExp(`\\b(?:${pattern})\\b`, "i"));
  if (!hit) return null;

  const window = head.slice(hit.index, hit.index + 90);

  const title = window
    // Stop at a price, a separator, or the portal's own name.
    .split(/\s[|·•]\s|\s[–-]\s|€|\bmobile\.de\b|\bautoscout24\b|\bkleinanzeigen\b/i)[0]
    .replace(/\s+/g, " ")
    .trim();

  return title.length >= 4 ? title.slice(0, 80) : null;
}

/**
 * The asking price. Ad text is full of euro amounts (financing rates, similar
 * cars, fees), so we prefer a labelled price, then the largest plausible
 * amount near the top, and explicitly ignore anything that reads as a rate.
 */
function detectPrice(text, head) {
  const labelled = toNumber(
    extractLabelled(head, ["Preis", "Bruttopreis", "Barpreis"], /([\d.\s]{4,12})\s*€/, 60),
  );
  if (labelled && labelled >= 300) return labelled;

  const amounts = [];
  const pattern = /([\d]{1,3}(?:[.\s]\d{3})+|\d{4,6})\s*€/g;
  let hit;

  while ((hit = pattern.exec(head)) !== null) {
    const context = head.slice(Math.max(0, hit.index - 60), hit.index + 40);
    // Monthly instalments, deposits and fees are not the vehicle price.
    if (/(mtl|monat|rate|finanzierung|leasing|ab\s*€|zzgl|geb[üu]hr|versand)/i.test(context)) {
      continue;
    }
    const value = toNumber(hit[1]);
    if (value && value >= 300 && value <= 500_000) amounts.push(value);
  }

  if (!amounts.length) return null;

  // The ad's own price is normally the first one shown.
  return amounts[0];
}

/**
 * @param {string} raw   text copied from the ad page, or a page's own text
 * @param {object} [options]
 * @param {number} [options.headChars]  how much counts as "the ad itself"
 * @returns {{fields:object, found:string[], missing:string[], confidence:number}}
 */
/** Headings that end an "Ausstattung" block in a copied ad page. */
const SECTION_END =
  /^(fahrzeugbeschreibung|beschreibung|standort|anbieter|h[äa]ndler|finanzierung|kontakt|technische daten|umwelt|energie|verbrauch|[äa]hnliche|weitere angebote|rechtliche|preis|das k[öo]nnte|andere anzeigen|nachricht|anzeige melden)/i;

/**
 * The lines under an "Ausstattung" heading, one feature per line — how every
 * portal lays it out once the page is copied as text.
 */
function equipmentLines(lines) {
  const start = lines.findIndex((line) => /^(sonder)?ausstattung(smerkmale)?:?$/i.test(line));
  if (start < 0) return [];

  const items = [];
  for (const line of lines.slice(start + 1, start + 120)) {
    if (SECTION_END.test(line)) break;
    if (line.length < 2 || line.length > 60) continue;
    // Several features on one line, "Navi, Sitzheizung, AHK".
    for (const part of line.split(/\s*[,;•·|]\s*/)) {
      if (part.length >= 2 && part.length <= 60) items.push(part);
    }
  }
  return [...new Set(items)];
}

export function parsePastedListing(raw, { headChars = 4_000 } = {}) {
  const text = cleanText(String(raw || "").replace(/\r/g, ""));
  const lines = String(raw || "")
    .split("\n")
    .map((line) => cleanText(line))
    .filter(Boolean);

  // The head holds the ad itself; further down come "similar vehicles".
  const head = text.slice(0, headChars);

  const makeHit = detectMake(head) || detectMake(text);
  const make = makeHit?.name || null;
  const title =
    detectTitle(lines, make) ||
    titleFromText(head, [makeHit?.matched, make, make?.split(/[\s-]/)[0]]);

  const mileageKm = toNumber(
    extractLabelled(text, ["Kilometerstand", "Laufleistung"], /([\d.\s]{3,12})\s*km/i, 60) ||
      (text.match(/([\d]{1,3}(?:[.\s]\d{3})+)\s*km\b/) || [])[1],
  );

  const firstRegistration =
    extractLabelled(text, ["Erstzulassung", "Erstzul", "EZ"], /(\d{1,2}\/\d{4})/, 60) ||
    (text.match(/\b(0?[1-9]|1[0-2])\/((?:19|20)\d{2})\b/) || [])[0] ||
    null;

  const powerRaw =
    extractLabelled(text, ["Leistung", "Motorleistung"], /(\d{2,4}\s*kW[^)]{0,18}\)?)/i, 80) ||
    (text.match(/(\d{2,4})\s*kW\s*\(?\s*(\d{2,4})\s*PS/i) || [])[0];

  const kwMatch = powerRaw ? String(powerRaw).match(/(\d{2,4})\s*kW/i) : null;
  const psMatch = powerRaw
    ? String(powerRaw).match(/(\d{2,4})\s*PS/i)
    : text.match(/(\d{2,4})\s*PS\b/i);

  const fuelRaw = extractLabelled(
    text,
    ["Kraftstoffart", "Kraftstoff", "Treibstoff"],
    /(Benzin|Diesel|Elektro\w*|Hybrid[\w\s()/-]{0,20}|Autogas[\w\s()]{0,12}|Erdgas[\w\s()]{0,12}|Wasserstoff)/i,
    60,
  );

  const gearboxRaw = extractLabelled(
    text,
    ["Getriebeart", "Getriebe"],
    /(Schaltgetriebe|Automatik\w*|Halbautomatik|Manuell)/i,
    60,
  );

  const price = detectPrice(text, head);

  // Model: what follows the make in the title. Both the canonical name and the
  // spelling used in the ad are stripped, so "VW Golf VII" yields "Golf VII"
  // rather than "VW Golf".
  let model = null;
  if (title && make) {
    const aliases = [makeHit?.matched, make, make.split(/[\s-]/)[0]].filter(Boolean);
    let rest = title;
    for (const alias of aliases) {
      rest = rest.replace(
        new RegExp(`^.*?\\b${alias.replace(/[-.]/g, "[-. ]?")}\\b`, "i"),
        "",
      );
    }
    model =
      rest
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .join(" ")
        .replace(/[,;]/g, "")
        .trim() || null;
  }

  const fields = {
    title,
    make,
    equipment: equipmentLines(lines),
    model,
    variant: title || null,
    price,
    firstRegistration,
    mileageKm,
    powerKw: kwMatch ? toNumber(kwMatch[1]) : null,
    powerPs: psMatch ? toNumber(psMatch[1]) : null,
    fuel: fuelRaw ? normalizeFuel(fuelRaw) : "UNKNOWN",
    gearbox: gearboxRaw ? normalizeGearbox(gearboxRaw) : "UNKNOWN",
    priceType: detectPriceType(text),
    condition: detectConditionFromText(text),
    serviceHistory: detectServiceHistory(text),
    tuvUntil: detectTuv(text),
    ownerCount: toNumber(
      extractLabelled(text, ["Fahrzeughalter", "Vorbesitzer", "Halter"], /(\d{1,2})/, 40),
    ),
    sellerType: /privatanbieter|privatverkauf|privater anbieter|von privat/i.test(text)
      ? "PRIVATE"
      : "DEALER",
    bodyType: extractLabelled(
      text,
      ["Kategorie", "Fahrzeugtyp", "Karosserie"],
      /(Limousine|Kombi|SUV[\w/]*|Gel[äa]ndewagen|Cabrio\w*|Coup[ée]|Kleinwagen|Van|Transporter|Sportwagen)/i,
      60,
    ),
  };

  const required = {
    make: "Marke",
    model: "Modell",
    price: "Preis",
    firstRegistration: "Erstzulassung",
    mileageKm: "Kilometerstand",
  };

  const found = [];
  const missing = [];
  for (const [key, label] of Object.entries(required)) {
    if (fields[key] === null || fields[key] === undefined || fields[key] === "") {
      missing.push(label);
    } else {
      found.push(label);
    }
  }

  const optional = ["powerPs", "fuel", "gearbox", "tuvUntil"].filter(
    (key) => fields[key] && fields[key] !== "UNKNOWN",
  ).length;

  return {
    fields,
    found,
    missing,
    // Rough share of what we managed to read, for the UI to show.
    confidence: Math.round(((found.length / 5) * 0.8 + (optional / 4) * 0.2) * 100),
  };
}

/** Enough text to be worth parsing at all. */
export function looksLikeListingText(raw) {
  const text = String(raw || "");
  if (text.trim().length < 80) return false;
  return /(km|€|Erstzulassung|Kilometerstand|Leistung)/i.test(text);
}
