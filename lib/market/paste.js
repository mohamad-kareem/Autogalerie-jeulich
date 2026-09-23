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
 * The seller's postcode and town — "DE-53879 Euskirchen" on mobile.de,
 * "53879 Euskirchen" elsewhere. Needed for the pickup route.
 */
function locationFrom(lines) {
  for (const line of lines) {
    const match = line.match(/^(?:DE[-\s])?(\d{5})\s+([A-ZÄÖÜ][\wÄÖÜäöüß .()/-]{1,40})$/);
    if (match) return `${match[1]} ${match[2].trim()}`;
  }
  return null;
}

/** Where the seller's description ends and the page's own furniture begins. */
const DESCRIPTION_END =
  /^(händler|privatanbieter|preis|standort|dein ansprechpartner|mehr anzeigen|rechtliche angaben|nachricht schreiben|anzeige teilen|kontakt|finanzierung|über diesen verkäufer)\b/i;

/**
 * The seller's own description, under "Fahrzeugbeschreibung". Dealers list
 * half their equipment there ("Keyless Start", "Lenkradheizung"), and it is
 * where damage is admitted, if anywhere.
 */
function descriptionFrom(lines) {
  const start = lines.findIndex((line) =>
    /^(fahrzeugbeschreibung|beschreibung)(\s+laut anbieter)?:?$/i.test(line),
  );
  if (start < 0) return null;

  const body = [];
  for (const line of lines.slice(start + 1, start + 80)) {
    if (DESCRIPTION_END.test(line)) break;
    body.push(line);
  }
  return body.join(" · ").slice(0, 6_000) || null;
}

/** Where "similar vehicles" and other people's cars begin. Nothing below counts. */
const AD_END =
  /^(ähnliche fahrzeuge|ähnliche angebote|ähnliche anzeigen|das könnte dich auch interessieren|andere anzeigen des anbieters|weitere angebote (des|dieses) (händlers|anbieters)|weitere fahrzeuge (des|dieses)|mehr von diesem (händler|anbieter)|vergleichbare fahrzeuge|passende angebote)\b/i;

/** The portal's own verdict, printed right under the ad price on mobile.de. */
const PRICE_RATING =
  /^(sehr guter preis|guter preis|fairer preis|erhöhter preis|hoher preis|ohne bewertung|top[- ]preis)$/i;

/** A line with one of these carries a euro amount that is not the car's price. */
const NOT_THE_PRICE =
  /(mtl|monat|\brate\b|raten|finanzierung|leasing|anzahlung|schlussrate|zzgl|geb[üu]hr|versand|jahr|€\s*\/|energiekosten|kraftstoff|co₂|co2|steuer|versicherung|haftpflicht|kasko|netto|mwst|ust\b|ersparnis|statt|uvp|neupreis|listenpreis|\/l\b|\/t\b|\/km\b)/i;

/** The same boundaries, for text whose line breaks were lost. */
const AD_END_INLINE =
  /(ähnliche fahrzeuge|ähnliche angebote|ähnliche anzeigen|das könnte dich auch interessieren|andere anzeigen des anbieters|vergleichbare fahrzeuge)/i;

const NOT_THE_PRICE_INLINE =
  /(mtl|monat|\brate\b|raten|finanzierung|leasing|anzahlung|schlussrate|zzgl|geb[üu]hr|versand|jahr|energiekosten|kraftstoff|co₂|co2|steuer|versicherung|haftpflicht|kasko)/i;

/** A price label on its own line ("Preis") or with the value ("Preis: 21.990 €"). */
const PRICE_LABEL =
  /^(preis|kaufpreis|verkaufspreis|bruttopreis|barpreis|angebotspreis|endpreis|festpreis|händlerpreis)\s*:?\s*(.*)$/i;

/** "21.990 €", "€ 21.990", "21990,- €" — the amount, as a number. */
function amountIn(line) {
  const match = String(line).match(
    /(\d{1,3}(?:[.\s]\d{3})+|\d{3,6})(?:,-|,00)?\s*(?:€|eur\b)|€\s*(\d{1,3}(?:[.\s]\d{3})+|\d{3,6})/i,
  );
  if (!match) return null;
  const value = toNumber(match[1] || match[2]);
  return Number.isFinite(value) && value >= 300 && value <= 500_000 ? value : null;
}

/** The part of the copied page that is this ad — everything above "Ähnliche Fahrzeuge". */
export function adLines(lines) {
  const end = lines.findIndex((line) => AD_END.test(line));
  return end > 0 ? lines.slice(0, end) : lines;
}

/**
 * The asking price.
 *
 * An ad page is full of euro amounts: financing rates, annual fuel costs, CO₂
 * scenarios, insurance quotes, the net price, and the prices of "similar
 * vehicles". Taking the first amount on the page is how a 21.990 € Opel was
 * once read as a 1.517 € car (its annual energy cost). So, in order:
 *
 *   1. an amount under a "Preis" label
 *   2. an amount directly above the portal's price verdict ("Fairer Preis")
 *   3. the amount repeated most often in the ad (the price appears two or
 *      three times on every portal; a fuel cost appears once)
 *
 * and never anything below "Ähnliche Fahrzeuge".
 */
function detectPrice(text, head, lines = []) {
  const ad = adLines(lines);

  if (ad.length > 3) {
    // 1 — labelled
    for (let index = 0; index < ad.length; index += 1) {
      const label = ad[index].match(PRICE_LABEL);
      if (!label) continue;
      const inline = amountIn(label[2]);
      if (inline && !NOT_THE_PRICE.test(label[2])) return { price: inline, rating: ratingAfter(ad, index) };
      for (const offset of [1, 2]) {
        const next = ad[index + offset];
        if (next && !NOT_THE_PRICE.test(next) && amountIn(next)) {
          return { price: amountIn(next), rating: ratingAfter(ad, index + offset) };
        }
      }
    }

    // 2 — right above the portal's verdict
    for (let index = 1; index < ad.length; index += 1) {
      if (!PRICE_RATING.test(ad[index])) continue;
      const above = ad[index - 1];
      if (amountIn(above) && !NOT_THE_PRICE.test(above)) {
        return { price: amountIn(above), rating: ad[index] };
      }
    }

    // 3 — the amount repeated most often, earliest on ties
    const counts = new Map();
    ad.forEach((line, index) => {
      if (NOT_THE_PRICE.test(line)) return;
      const value = amountIn(line);
      if (!value) return;
      const entry = counts.get(value) || { count: 0, first: index };
      entry.count += 1;
      counts.set(value, entry);
    });
    const best = [...counts.entries()].sort(
      (a, b) => b[1].count - a[1].count || a[1].first - b[1].first,
    )[0];
    if (best) return { price: best[0], rating: null };
  }

  // Text without line breaks (a page's stripped HTML): the older heuristic,
  // on the part before "Ähnliche Fahrzeuge".
  const end = head.search(AD_END_INLINE);
  const scope = end > 0 ? head.slice(0, end) : head;

  const labelled = toNumber(
    extractLabelled(scope, ["Preis", "Bruttopreis", "Barpreis"], /([\d.\s]{4,12})\s*€/, 60),
  );
  if (labelled && labelled >= 300) return { price: labelled, rating: null };

  const amounts = [];
  const pattern = /([\d]{1,3}(?:[.\s]\d{3})+|\d{4,6})\s*€/g;
  let hit;

  while ((hit = pattern.exec(scope)) !== null) {
    // Without line breaks the context runs into neighbouring rows, and the
    // gross price sits right beside "MwSt. ausweisbar" — so VAT words cannot
    // disqualify an amount here, only rates and running costs can.
    const context = scope.slice(Math.max(0, hit.index - 60), hit.index + 40);
    if (NOT_THE_PRICE_INLINE.test(context)) continue;
    const value = toNumber(hit[1]);
    if (value && value >= 300 && value <= 500_000) amounts.push(value);
  }

  return { price: amounts.length ? amounts[0] : null, rating: null };
}

function ratingAfter(lines, index) {
  for (const offset of [1, 2]) {
    const line = lines[index + offset];
    if (line && PRICE_RATING.test(line)) return line;
  }
  return null;
}

/**
 * The model, from the short "Make Model" line portals print beside the price
 * ("Opel Astra", three times on a mobile.de page). The headline is less
 * reliable for this: "Opel Astra L Edition 1.2 …" gives "Astra L", and no
 * portal lists an "Astra L".
 */
function modelFromShortTitle(lines, aliases) {
  const pattern = new RegExp(
    `^(?:${aliases.map((alias) => alias.replace(/[-.]/g, "[-. ]?")).join("|")})\\s+([A-Za-zÄÖÜäöüß][\\wÄÖÜäöüß-]{1,20})$`,
    "i",
  );
  const counts = new Map();
  for (const line of lines) {
    const match = line.match(pattern);
    if (match) counts.set(match[1], (counts.get(match[1]) || 0) + 1);
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
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

  const { price, rating: priceRating } = detectPrice(text, head, lines);

  // Model: what follows the make in the title. Both the canonical name and the
  // spelling used in the ad are stripped, so "VW Golf VII" yields "Golf VII"
  // rather than "VW Golf".
  const aliases = [makeHit?.matched, make, make?.split(/[\s-]/)[0]].filter(Boolean);
  let model = aliases.length ? modelFromShortTitle(adLines(lines), aliases) : null;
  if (!model && title && make) {
    let rest = title;
    for (const alias of aliases) {
      rest = rest.replace(
        new RegExp(`^.*?\\b${alias.replace(/[-.]/g, "[-. ]?")}\\b`, "i"),
        "",
      );
    }
    const words = rest.trim().replace(/[,;]/g, "").split(/\s+/).filter(Boolean);
    // "Golf Variant" is a model; "Astra L" and "Golf 1.5" are a model plus
    // noise that makes the comparables search come back empty.
    const second = words[1];
    const keepSecond = second && second.length >= 3 && !/[\d.]/.test(second);
    model = (keepSecond ? words.slice(0, 2) : words.slice(0, 1)).join(" ") || null;
  }

  const fields = {
    title,
    make,
    location: locationFrom(adLines(lines)),
    description: descriptionFrom(adLines(lines)),
    equipment: equipmentLines(adLines(lines)),
    upholstery: extractLabelled(
      text,
      ["Material Innenausstattung", "Innenausstattung", "Polsterung"],
      /(Vollleder|Teilleder|Kunstleder|Leder|Alcantara|Stoff|Velours)/i,
      40,
    ),
    // The portal's verdict on the price, when it prints one ("Fairer Preis").
    portalValuation: priceRating && !/ohne bewertung/i.test(priceRating)
      ? { source: null, median: null, label: priceRating }
      : null,
    model,
    variant: title || null,
    price,
    firstRegistration,
    mileageKm,
    displacementCcm: toNumber(
      extractLabelled(text, ["Hubraum"], /(\d[\d.\s]{2,6})\s*cm/i, 40),
    ),
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
