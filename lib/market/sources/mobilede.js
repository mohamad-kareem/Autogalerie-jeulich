/**
 * mobile.de — official Search API first, public page as fallback.
 *
 * The project already talks to the Seller API (lib/mobile.js) for our own
 * stock. This module uses the same credentials against the *Search* API,
 * which covers the whole marketplace. Not every mobile.de account is
 * entitled to it, so a 401/403 is treated as "source unavailable" and the
 * analysis continues with the other sources.
 */

import { MOBILE_CREDENTIALS, POLICY } from "../config";
import { fetchWithBrowser } from "../browser";
import { request, requestJson } from "../http";
import {
  allEmbeddedJson,
  equipmentFromHtml,
  galleryFromJson,
  extractLabelled,
  jsonLdBlocks,
  jsonLdOfType,
  metaContent,
  textContent,
} from "../html";
import {
  cleanText,
  normalizeText,
  toNumber,
  tokenSimilarity,
  unique,
  deepCollect,
} from "../utils";
import {
  createVehicle,
  detectPriceType,
  detectTuv,
  detectServiceHistory,
  detectConditionFromText,
} from "../vehicle";
import { parsePastedListing } from "../paste";
import {
  cooldownRemaining,
  minutesRemaining,
  noteRefusal,
  noteSuccess,
  pace,
  readCache,
  writeCache,
} from "../throttle";
import { listingId } from "./urls";
import { summarizeVehicle } from "../../feed/details";

const API = "https://services.mobile.de";
const ACCEPT = "application/vnd.de.mobile.api+json";

/** Reference data is small and stable — cache it for the life of the lambda. */
const refDataCache = new Map();

function authHeader() {
  const token = Buffer.from(
    `${MOBILE_CREDENTIALS.username}:${MOBILE_CREDENTIALS.password}`,
  ).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: ACCEPT };
}

export function isConfigured() {
  return MOBILE_CREDENTIALS.enabled;
}

/* --------------------------------------------------------------- refdata */

/** Nodes that carry a reference-data key plus a human readable name. */
function looksLikeRefEntry(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  if (typeof node.key !== "string" || !node.key) return false;
  return Boolean(
    node.description ||
      node.localizedValue ||
      node.value ||
      node.name ||
      node.label,
  );
}

function refEntryName(entry) {
  const raw =
    entry.description ?? entry.localizedValue ?? entry.value ?? entry.name ?? entry.label;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    return cleanText(raw.value ?? raw["#text"] ?? raw.text ?? "");
  }
  return "";
}

async function loadRefData(path) {
  if (refDataCache.has(path)) return refDataCache.get(path);

  const result = await requestJson(`${API}/${path}`, {
    headers: authHeader(),
    label: "mobile.de refdata",
    timeoutMs: 8_000,
    retries: 1,
  });

  const entries = result.data
    ? deepCollect(result.data, looksLikeRefEntry, 4_000).map((entry) => ({
        key: entry.key,
        name: refEntryName(entry),
      }))
    : [];

  refDataCache.set(path, entries);
  return entries;
}

function bestRefMatch(entries, wanted) {
  if (!entries.length || !wanted) return null;
  const needle = normalizeText(wanted);

  const exact = entries.find(
    (entry) =>
      normalizeText(entry.name) === needle || normalizeText(entry.key) === needle,
  );
  if (exact) return exact;

  let best = null;
  let bestScore = 0;
  for (const entry of entries) {
    const score = Math.max(
      tokenSimilarity(entry.name, wanted),
      tokenSimilarity(entry.key.replace(/_/g, " "), wanted),
    );
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= 0.6 ? best : null;
}

/** Fallback key shape when reference data is unavailable. */
function guessKey(value) {
  return normalizeText(value).replace(/\s+/g, "_").toUpperCase();
}

/**
 * Builds the `classification` values to try, most specific first.
 * @returns {Promise<string[]>}
 */
async function classifications(target) {
  const variants = [];

  const makes = await loadRefData("refdata/classes/Car/makes");
  const makeEntry = bestRefMatch(makes, target.make);
  const makeKey = makeEntry?.key || guessKey(target.make);

  if (target.model) {
    const models = await loadRefData(
      `refdata/classes/Car/makes/${encodeURIComponent(makeKey)}/models`,
    );
    const modelEntry = bestRefMatch(models, target.model);
    const modelKey = modelEntry?.key || guessKey(target.model);
    variants.push(
      `refdata/classes/Car/makes/${makeKey}/models/${modelKey}`,
    );
  }

  variants.push(`refdata/classes/Car/makes/${makeKey}`);
  return unique(variants);
}

/* ------------------------------------------------------------------ mapping */

/**
 * mobile.de photo URLs need a rendition rule to render; the bare path returns
 * nothing. Normalises whatever shape arrived to a 1024 px JPEG.
 */
function mobileImage(url) {
  if (typeof url !== "string" || !url) return null;
  let absolute = url.startsWith("//") ? `https:${url}` : url;
  if (!/^https?:\/\//.test(absolute)) absolute = `https://${absolute.replace(/^\/+/, "")}`;
  if (/classistatic\.de/.test(absolute) && !/[?&]rule=/.test(absolute)) {
    absolute += "?rule=mo-1024.jpg";
  }
  return absolute;
}

/** mobile.de interior codes, in the words a German buyer uses. */
const INTERIOR_TYPES = {
  LEATHER: "Vollleder",
  PARTIAL_LEATHER: "Teilleder",
  ALCANTARA: "Alcantara",
  FABRIC: "Stoff",
  VELOUR: "Velours",
  OTHER: null,
};

function mapApiAd(ad) {
  const price =
    toNumber(ad?.price?.consumerPriceGross) ??
    toNumber(ad?.price?.consumerPriceNet) ??
    toNumber(ad?.price?.amount);

  const vatText = [
    ad?.price?.type,
    ad?.price?.vatRate,
    typeof ad?.price?.vatable === "boolean"
      ? ad.price.vatable
        ? "MwSt. ausweisbar"
        : "Differenzbesteuert"
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const seller = ad?.seller || {};
  const address = seller?.address || {};

  const damage = [
    ad?.damageUnrepaired ? "Unrepariert beschädigt" : null,
    ad?.accidentDamaged ? "Unfallfahrzeug" : null,
    ad?.roadworthy === false ? "Nicht fahrbereit" : null,
  ].filter(Boolean);

  let condition = "UNKNOWN";
  if (ad?.damageUnrepaired || ad?.accidentDamaged) condition = "DAMAGED";
  else if (ad?.accidentDamaged === false && ad?.damageUnrepaired === false) {
    condition = "ACCIDENT_FREE";
  }

  return {
    source: "MOBILE_DE",
    sourceLevel: "RETAIL",
    listingId: ad?.mobileAdId ? String(ad.mobileAdId) : null,
    listingUrl:
      ad?.detailPageUrl ||
      (ad?.mobileAdId
        ? `https://suchen.mobile.de/fahrzeuge/details.html?id=${ad.mobileAdId}`
        : null),
    title: cleanText(
      [ad?.make, ad?.model, ad?.modelDescription].filter(Boolean).join(" "),
    ),
    make: cleanText(ad?.make),
    model: cleanText(ad?.model),
    variant: cleanText(ad?.modelDescription),
    price,
    priceType: detectPriceType(vatText),
    firstRegistration: ad?.firstRegistration,
    mileageKm: toNumber(ad?.mileage),
    fuel: ad?.fuel,
    gearbox: ad?.gearbox,
    powerKw: toNumber(ad?.power),
    displacementCcm: toNumber(ad?.cubicCapacity),
    bodyType: cleanText(ad?.category),
    doors: toNumber(ad?.doors),
    seats: toNumber(ad?.seats),
    color: cleanText(ad?.exteriorColor || ad?.manufacturerColorName),
    ownerCount: toNumber(ad?.numberOfPreviousOwners),
    condition,
    damageNote: damage.join(", ") || null,
    tuvUntil: cleanText(ad?.newHuAu) || detectTuv(ad?.description),
    serviceHistory:
      ad?.fullServiceHistory === true
        ? "YES"
        : ad?.fullServiceHistory === false
          ? "NO"
          : detectServiceHistory(ad?.description),
    sellerType: seller?.type || (seller?.commercial ? "DEALER" : null),
    sellerName: cleanText(seller?.companyName || seller?.name),
    location: cleanText(
      [address?.zipcode || address?.zipCode, address?.city]
        .filter(Boolean)
        .join(" "),
    ),
    images: (ad?.images || [])
      .map((image) => image?.ref || image?.url || image?.uri)
      .map(mobileImage)
      .filter(Boolean),
    // The API sends codes ("NAVIGATION_SYSTEM"); equipment.js reads both
    // those and the German labels the public page shows.
    equipment: Array.isArray(ad?.features)
      ? ad.features
          .map((feature) =>
            typeof feature === "string" ? feature.replace(/_/g, " ") : feature?.label || feature?.name,
          )
          .filter(Boolean)
      : [],
    upholstery: INTERIOR_TYPES[ad?.interiorType] || cleanText(ad?.interiorType) || null,
    listedAt: ad?.creationDate || ad?.created || null,
    description: cleanText(ad?.description),
    extractedFrom: "search-api",
  };
}

/* ------------------------------------------------------------------ detail */

async function fetchListingViaApi(adId) {
  if (!isConfigured()) {
    return { ok: false, vehicle: null, error: "Keine mobile.de-Zugangsdaten hinterlegt." };
  }

  // The ad endpoint has been served under two paths over the years; try the
  // documented one first and fall back rather than failing on a 404.
  const paths = [`${API}/search-api/ad/${adId}`, `${API}/search-api/ads/${adId}`];

  let result = null;
  for (const path of paths) {
    result = await requestJson(path, {
      headers: authHeader(),
      label: "mobile.de Ad-API",
      timeoutMs: 10_000,
      retries: 1,
    });
    if (result.ok && result.data) break;
    // Credentials or entitlement problems will not change with another path.
    if (result.status === 401 || result.status === 403) break;
  }

  if (!result?.ok || !result?.data) {
    return {
      ok: false,
      vehicle: null,
      status: result?.status ?? 0,
      error:
        result?.status === 401 || result?.status === 403
          ? "Kein Zugriff auf die mobile.de Search-API (Konto nicht freigeschaltet)."
          : result?.error || "mobile.de Ad-API nicht erreichbar.",
    };
  }

  const ad = result.data?.ad || result.data;
  const vehicle = createVehicle(mapApiAd(ad));

  if (!vehicle.price && !vehicle.make) {
    return { ok: false, vehicle: null, error: "mobile.de lieferte keine Fahrzeugdaten." };
  }

  return { ok: true, vehicle, error: null };
}

/**
 * Reads a mobile.de ad from its public page.
 *
 * The diagnostic run showed the page itself is served fine (HTTP 200, ~850 KB)
 * — what failed before was the extraction. So this deliberately avoids
 * depending on mobile.de's class names or state-blob naming, which change
 * often. Four independent layers run and the results are merged, earlier
 * layers winning:
 *
 *   1. any embedded JSON node that looks like a vehicle
 *   2. JSON-LD
 *   3. the German labels in the visible text  (most durable)
 *   4. meta tags
 */
function looksLikeVehicleNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;

  const keys = Object.keys(node).map((key) => key.toLowerCase());
  const has = (...names) => names.some((name) => keys.includes(name));

  const price = has("price", "priceraw", "grossprice", "consumerpricegross", "amount");
  const spec =
    has("mileage", "mileageinkm", "firstregistration", "firstregistrationdate") &&
    true;
  const identity = has("make", "makename", "model", "modelname", "modeldescription");

  return price && spec && identity;
}

/** Offer price of a JSON-LD block, whichever shape it uses. */
function jsonLdPrice(block) {
  const offer = Array.isArray(block?.offers) ? block.offers[0] : block?.offers;
  return toNumber(
    offer?.price ??
      offer?.priceSpecification?.price ??
      block?.price ??
      block?.priceSpecification?.price,
  );
}

/** The JSON-LD block describing the vehicle, not the breadcrumb or the seller. */
function bestVehicleJsonLd(html) {
  const blocks = jsonLdBlocks(html).filter(
    (block) => block && typeof block === "object",
  );

  const scored = blocks
    .map((block) => {
      let score = 0;
      if (plausiblePrice(jsonLdPrice(block))) score += 4;
      if (block.mileageFromOdometer) score += 3;
      if (block.dateVehicleFirstRegistered || block.productionDate) score += 2;
      if (block.brand || block.model) score += 2;
      if (block.name) score += 1;
      const type = []
        .concat(block["@type"] || [])
        .map((entry) => String(entry).toLowerCase());
      if (type.some((entry) => ["car", "vehicle", "product"].includes(entry))) {
        score += 1;
      }
      return { block, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.length && scored[0].score > 0 ? scored[0].block : {};
}

/** A car price that is not a car price is worse than no price at all. */
function plausiblePrice(value) {
  return Number.isFinite(value) && value >= 300 && value <= 500_000;
}

/* ------------------------------------------------------ app-router pages */

/**
 * mobile.de's ad pages are now a Next.js app: the data is streamed as
 * `self.__next_f.push([1,"…"])` chunks rather than one JSON blob. Joined, the
 * chunks contain exactly one `"listing":{…}` object with everything on the
 * page: the labelled data rows, the equipment list, photos, description,
 * seller, and mobile.de's own price verdict.
 */
export function flightListing(html) {
  const source = String(html ?? "");
  const pattern = /self\.__next_f\.push\((\[[\s\S]*?\])\)\s*;?\s*<\/script>/g;

  let stream = "";
  let hit;
  while ((hit = pattern.exec(source)) !== null) {
    try {
      const chunk = JSON.parse(hit[1]);
      if (typeof chunk[1] === "string") stream += chunk[1];
    } catch {
      /* a chunk that is not plain JSON carries no listing */
    }
  }
  if (!stream) return null;

  const key = stream.indexOf('"listing":{"attributes"');
  const start = key >= 0 ? key : stream.indexOf('"listing":{');
  if (start < 0) return null;

  const body = objectAt(stream, stream.indexOf("{", start));
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/** The balanced {...} starting at `from`, respecting strings and escapes. */
function objectAt(text, from) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = from; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(from, index + 1);
    }
  }
  return null;
}

/** mobile.de's verdict words, e.g. "Fairer Preis". "Ohne Bewertung" says nothing. */
function ratingFrom(priceRating) {
  const label = cleanText(priceRating?.ratingLabel);
  if (!label || priceRating?.rating === "NO_RATING" || /ohne bewertung/i.test(label)) {
    return null;
  }
  return { source: "mobile.de", median: null, label };
}

function fromFlightData(html) {
  const listing = flightListing(html);
  if (!listing) return null;

  // Data rows by label as well as by tag: the labels are what a German reader
  // sees and have outlived every redesign so far.
  const rows = Array.isArray(listing.attributes) ? listing.attributes : [];
  const byTag = new Map(rows.map((row) => [row?.tag, cleanText(row?.value)]));
  const byLabel = (pattern) =>
    cleanText(rows.find((row) => pattern.test(String(row?.label || "")))?.value) || null;

  const power = byTag.get("power") || byLabel(/^leistung/i) || "";
  const kw = power.match(/(\d{2,4})\s*kW/i);
  const ps = power.match(/(\d{2,4})\s*PS/i);

  // Climate and parking come as data rows, not in the feature list.
  const equipment = [
    ...(Array.isArray(listing.features) ? listing.features : []),
    byTag.get("climatisation") || byLabel(/klimatisierung/i),
    // "Kamera, Vorne, Hinten" is three things: a camera and sensors at both ends.
    ...(byTag.get("parkAssists") || byLabel(/einparkhilfe/i) || "")
      .split(/\s*,\s*/)
      .filter(Boolean)
      .map((part) =>
        /360|umgebung|rundum/i.test(part)
          ? "360°-Kamera"
          : /kamera/i.test(part)
            ? "Rückfahrkamera"
            : /selbstlenk|assist/i.test(part)
              ? "Einparkassistent"
              : `Einparkhilfe ${part.toLowerCase()}`,
      ),
  ].filter((entry) => typeof entry === "string" && entry.trim());

  const contact = listing.contact || {};
  const place = cleanText(contact.address2 || contact.address || "").replace(/^[A-Z]{2}-/, "");

  const price = listing.price || {};
  const priceJson = JSON.stringify(price).toLowerCase();

  return {
    listingId: listing.id ? String(listing.id) : null,
    title: cleanText(listing.title) || null,
    make: cleanText(listing.make?.localized || listing.makeKey) || null,
    model: cleanText(listing.model?.localized || listing.modelKey) || null,
    variant: cleanText(listing.subTitle) || null,
    price: toNumber(price.grs?.amount ?? price.gross?.amount ?? price.amount),
    // A net price or a VAT rate is only shown when VAT can be deducted.
    priceType: /"nt"|"net"|mwst|vatrate|"vat"/.test(priceJson) ? "VAT_DEDUCTIBLE" : null,
    mileageKm: toNumber(byTag.get("mileage") || byLabel(/^kilometerstand/i)),
    firstRegistration: byTag.get("firstRegistration") || byLabel(/^erstzulassung/i),
    powerKw: kw ? toNumber(kw[1]) : null,
    powerPs: ps ? toNumber(ps[1]) : null,
    displacementCcm: toNumber(byTag.get("cubicCapacity") || byLabel(/^hubraum/i)),
    lastBeltService: byLabel(/zahnriemen/i),
    fuel: byTag.get("fuel") || byLabel(/^kraftstoffart/i),
    gearbox: byTag.get("transmission") || byLabel(/^getriebe/i),
    bodyType: cleanText(listing.category) || byTag.get("category"),
    tuvUntil: byTag.get("hu") || byLabel(/^hu\b|hauptuntersuchung/i),
    ownerCount: toNumber(byLabel(/fahrzeughalter/i)),
    doors: toNumber(byLabel(/türen/i)),
    seats: toNumber(byLabel(/sitzpl/i)),
    color: byLabel(/^farbe$/i) || byLabel(/^farbe/i),
    upholstery: (() => {
      const interior = byLabel(/innenausstattung/i);
      const match = interior?.match(/(Vollleder|Teilleder|Kunstleder|Leder|Alcantara|Stoff|Velours)/i);
      return match ? match[1] : null;
    })(),
    condition: (() => {
      const state = byTag.get("damageCondition") || byLabel(/fahrzeugzustand/i);
      if (!state) return null;
      const read = detectConditionFromText(`Fahrzeugzustand: ${state}`);
      return read === "UNKNOWN" ? null : read;
    })(),
    sellerType: /privat/i.test(contact.type || "") || contact.enumType === "FSBO"
      ? "PRIVATE"
      : contact.type
        ? "DEALER"
        : null,
    sellerName: cleanText(contact.name || contact.companyName) || null,
    location: place || null,
    images: (Array.isArray(listing.images) ? listing.images : [])
      .map((image) => mobileImage(image?.uri || image?.src || image?.url))
      .filter(Boolean),
    equipment,
    description: cleanText(
      String(listing.htmlDescription || "")
        .replace(/<\s*br\s*\/?>/gi, " · ")
        .replace(/<[^>]+>/g, " "),
    ) || null,
    listedAt: listing.created || null,
    portalValuation: ratingFrom(listing.priceRating),
  };
}

function fromEmbeddedJson(html) {
  for (const blob of allEmbeddedJson(html)) {
    const [node] = deepCollect(blob, looksLikeVehicleNode, 5);
    if (!node) continue;

    const mapped = mapApiAd(node);
    if (mapped.price || mapped.make) return mapped;
  }
  return null;
}

/** Pulls the standard mobile.de data rows straight out of the page text. */
function fromPageText(text) {
  const near = (labels, pattern, window) =>
    extractLabelled(text, labels, pattern, window);

  const powerText = near(
    ["Leistung"],
    /(\d{2,4})\s*kW\s*\(?\s*(\d{2,4})?\s*PS?/i,
    80,
  );
  const powerMatch = powerText
    ? String(powerText).match(/(\d{2,4})\s*kW(?:[^\d]{0,6}(\d{2,4})\s*PS)?/i)
    : null;

  return {
    mileageKm: toNumber(near(["Kilometerstand", "Laufleistung"], /([\d.\s]{3,12})\s*km/i, 60)),
    firstRegistration: near(
      ["Erstzulassung", "Erstzul.", "EZ"],
      /(\d{1,2}\/\d{4})/,
      60,
    ),
    fuel: near(
      ["Kraftstoffart", "Kraftstoff"],
      /(Benzin|Diesel|Elektro|Hybrid[\w-]*|Autogas[\w\s()]*|Erdgas[\w\s()]*|Wasserstoff)/i,
      60,
    ),
    gearbox: near(
      ["Getriebe", "Getriebeart"],
      /(Schaltgetriebe|Automatik|Halbautomatik)/i,
      60,
    ),
    powerKw: powerMatch ? toNumber(powerMatch[1]) : null,
    powerPs: powerMatch && powerMatch[2] ? toNumber(powerMatch[2]) : null,
    displacementCcm: toNumber(near(["Hubraum"], /(\d[\d.\s]{2,6})\s*cm/i, 40)),
    ownerCount: toNumber(near(["Fahrzeughalter", "Anzahl der Fahrzeughalter"], /(\d{1,2})/, 40)),
    bodyType: near(
      ["Kategorie", "Fahrzeugtyp", "Karosserieform"],
      /(Limousine|Kombi|SUV[\w/]*|Gel[äa]ndewagen|Cabrio[\w]*|Coup[ée]|Kleinwagen|Van[\w/]*|Transporter|Sportwagen)/i,
      60,
    ),
    color: near(["Außenfarbe", "Farbe"], /([A-Za-zÄÖÜäöüß]{3,20})/, 40),
    tuvUntil: near(["HU", "TÜV", "Hauptuntersuchung"], /(\d{1,2}\/\d{4})/, 40),
    doors: toNumber(near(["Anzahl der Türen", "Türen"], /(\d)/, 30)),
    seats: toNumber(near(["Anzahl der Sitzplätze", "Sitzplätze"], /(\d)/, 30)),
  };
}

async function fetchListingViaPage(url) {
  // Already in a cooldown? Then do not touch mobile.de at all. Requesting an
  // ad while blocked fails anyway and only extends the block.
  const cooling = cooldownRemaining(url);
  if (cooling > 0) {
    return {
      ok: false,
      vehicle: null,
      blocked: true,
      error: `mobile.de hat den Zugriff vorübergehend gesperrt. Automatische Abrufe pausieren noch rund ${minutesRemaining(cooling)} Minuten – so lange bitte den Anzeigentext unten einfügen.`,
      debug: { stage: "cooldown", minutesRemaining: minutesRemaining(cooling) },
    };
  }

  // A page we fetched minutes ago needs no second request.
  const cached = readCache(url);

  let html = cached;
  let via = cached ? "cache" : null;
  let response = { ok: Boolean(cached), status: 0, error: null, blocked: false };
  let browserAttempt = null;

  if (!html) {
    await pace(url);

    // One attempt only: mobile.de blocks by IP, so retrying a refusal makes
    // things worse rather than better.
    response = await request(url, { label: "mobile.de", retries: 0 });

    if (response.ok) {
      html = response.body;
      via = "http";
    } else {
      browserAttempt = await fetchWithBrowser(url, {
        timeoutMs: 25_000,
        waitForText: "Kilometerstand",
      });
      if (browserAttempt.ok) {
        html = browserAttempt.html;
        via = "browser";
      }
    }
  }

  if (html) {
    noteSuccess(url);
    writeCache(url, html);
  } else if (response.status === 403 || response.status === 429 || browserAttempt?.status === 403) {
    noteRefusal(url);
  }

  if (!html) {
    return {
      ok: false,
      vehicle: null,
      error: browserAttempt?.unavailable
        ? `${browserAttempt.error} – danach funktioniert mobile.de automatisch.`
        : response.error,
      blocked: response.blocked,
      debug: {
        stage: "abruf",
        httpStatus: response.status,
        httpError: response.error,
        browserTried: Boolean(browserAttempt),
        browserError: browserAttempt?.error || null,
        browserUnavailable: Boolean(browserAttempt?.unavailable),
        bodyExcerpt: response.bodyExcerpt,
      },
    };
  }
  return parseListingPage(html, url, { via, status: response.status });
}

/**
 * Reads one mobile.de ad page. Used for pages the server fetched and for pages
 * the buyer's own browser sent over with the one-click import, which is the
 * dependable route: mobile.de refuses servers, not people.
 */
export function parseListingPage(html, url, { via = "import", status = null } = {}) {
  // The head of the document carries the ad itself; the tail is full of
  // "similar vehicles", whose prices must never be mistaken for this one.
  const text = textContent(html).slice(0, 12_000);
  const fullText = textContent(html).slice(0, 40_000);

  // A page carries several JSON-LD blocks (breadcrumbs, organisation, the
  // vehicle). Take the one that actually looks like the car: a plausible
  // price, or at least mileage. Picking "the first of a matching type" is what
  // produced a 117 € vehicle.
  const ld = bestVehicleJsonLd(html);
  const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;

  // Parsed once and shared: equipment, gallery and the vehicle node all come
  // out of the same embedded state.
  const blobs = allEmbeddedJson(html);

  const layers = [
    fromFlightData(html),
    fromEmbeddedJson(html),
    {
      equipment: equipmentFromHtml(html, { blobs }),
      images: galleryFromJson(html, /classistatic\.de|mobile\.de/i, { blobs })
        .map(mobileImage)
        .filter(Boolean),
    },
    {
      title: cleanText(ld.name),
      make: cleanText(ld.brand?.name || ld.brand),
      model: cleanText(ld.model?.name || ld.model),
      variant: cleanText(ld.vehicleConfiguration),
      price: toNumber(offer?.price),
      firstRegistration: ld.dateVehicleFirstRegistered || ld.productionDate,
      mileageKm: toNumber(ld.mileageFromOdometer?.value ?? ld.mileageFromOdometer),
      fuel: cleanText(ld.fuelType),
      gearbox: cleanText(ld.vehicleTransmission),
      powerKw: toNumber(
        typeof ld.vehicleEngine?.enginePower === "object"
          ? ld.vehicleEngine.enginePower.value
          : ld.vehicleEngine?.enginePower,
      ),
      color: cleanText(ld.color),
      ownerCount: toNumber(ld.numberOfPreviousOwners),
      description: cleanText(ld.description),
    },
    // The visible text of an ad page is the same material the paste box
    // receives, so the same tested parser reads it — including make, model,
    // title and a price that ignores financing rates and neighbouring ads.
    (() => {
      const parsed = parsePastedListing(fullText, { headChars: 9_000 });
      return {
        ...parsed.fields,
        price: plausiblePrice(parsed.fields.price) ? parsed.fields.price : null,
      };
    })(),
    fromPageText(text),
    {
      title: metaContent(html, ["og:title", "twitter:title"]),
      price: toNumber(metaContent(html, ["product:price:amount", "og:price:amount"])),
      description: metaContent(html, ["og:description", "description"]),
      images: [metaContent(html, ["og:image"])].filter(Boolean),
    },
  ].filter(Boolean);

  for (const layer of layers) {
    if (layer && "price" in layer && !plausiblePrice(toNumber(layer.price))) {
      layer.price = null;
    }
  }

  const merged = {};
  const used = [];
  const names = ["anzeigendaten", "embedded-json", "ausstattung", "json-ld", "anzeigentext", "seitenlabels", "meta"];

  layers.forEach((layer, index) => {
    let contributed = false;
    for (const [key, value] of Object.entries(layer)) {
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value) && !value.length) continue;
      if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
        merged[key] = value;
        contributed = true;
      }
    }
    if (contributed) used.push(names[index] || `layer-${index}`);
  });

  // The headline price, taken from the ad itself rather than a sidebar entry.
  if (!merged.price) {
    merged.price = toNumber(
      extractLabelled(text, ["Preis", "Bruttopreis"], /([\d.\s]{4,12})\s*€/, 60) ||
        (text.match(/([\d.]{4,12})\s*€/) || [])[1],
    );
  }

  // Title fallbacks, in order of reliability.
  if (!merged.title) {
    const h1 = cleanText(
      textContent((html.match(/<h1[^>]*>([\s\S]{0,400}?)<\/h1>/i) || [])[1] || ""),
    );
    const og = metaContent(html, ["og:title", "twitter:title"]);
    const pageTitle = cleanText(
      (html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i) || [])[1],
    )
      // "VW Golf … | mobile.de" -> "VW Golf …"
      .replace(/\s*[|·–-]\s*mobile\.de.*$/i, "")
      .trim();

    merged.title = h1 || og || pageTitle || null;
  }

  // Make and model can be derived from the title when nothing else supplied them.
  if (!merged.make && merged.title) {
    const [first, ...rest] = cleanText(merged.title).split(" ");
    merged.make = first || null;
    if (!merged.model && rest.length) merged.model = rest[0];
  }

  const vehicle = createVehicle({
    ...merged,
    source: "MOBILE_DE",
    sourceLevel: "RETAIL",
    listingId: listingId(url),
    listingUrl: url,
    priceType:
      merged.priceType && merged.priceType !== "UNKNOWN"
        ? merged.priceType
        : detectPriceType(fullText),
    tuvUntil: merged.tuvUntil || detectTuv(fullText),
    serviceHistory:
      merged.serviceHistory && merged.serviceHistory !== "UNKNOWN"
        ? merged.serviceHistory
        : detectServiceHistory(fullText),
    // Only the ad's own area: headline, data rows and description. The rest
    // of the document mentions accident vehicles in menus and other ads.
    condition:
      merged.condition && merged.condition !== "UNKNOWN"
        ? merged.condition
        : detectConditionFromText(`${text} ${merged.description || ""}`.slice(0, 8_000)),
    sellerType:
      merged.sellerType ||
      (/privatanbieter|privatverkauf|privater anbieter/i.test(fullText) ? "PRIVATE" : "DEALER"),
    description: merged.description || text.slice(0, 2_000),
    extractedFrom: `${via || "http"}: ${used.join(" + ") || "seitentext"}`,
  });

  if (!vehicle.price || !vehicle.make) {
    return {
      ok: false,
      vehicle: null,
      // The page WAS delivered — saying "blocked" here would be wrong and send
      // the user chasing a proxy they do not need.
      blocked: false,
      error:
        "Die mobile.de-Seite wurde geladen, aber Preis oder Fahrzeugdaten liessen sich nicht sicher herauslesen. Die Angaben können unten von Hand ergänzt werden.",
      debug: {
        stage: "auswertung",
        via,
        status,
        bytes: html.length,
        layers: used,
        foundPrice: vehicle.price,
        foundMake: vehicle.make,
        foundTitle: vehicle.title,
        foundMileage: vehicle.mileageKm,
        foundRegistration: vehicle.firstRegistration,
      },
    };
  }

  return { ok: true, vehicle, error: null, blocked: false };
}

export async function fetchListing(url) {
  const adId = listingId(url);

  if (adId && isConfigured()) {
    const viaApi = await fetchListingViaApi(adId);
    if (viaApi.ok) return { ...viaApi, blocked: false };
    // Fall through to the public page when the API is not entitled.
  }

  return fetchListingViaPage(url);
}

/* ------------------------------------------------------------------ search */

export async function searchComparables(target, { limit = POLICY.perSourceLimit } = {}) {
  if (!isConfigured()) {
    return {
      ok: false,
      vehicles: [],
      error: "mobile.de-Zugangsdaten fehlen.",
      blocked: false,
      skipped: true,
    };
  }

  let variants;
  try {
    variants = await classifications(target);
  } catch {
    variants = [`refdata/classes/Car/makes/${guessKey(target.make)}`];
  }

  const errors = [];

  for (const classification of variants) {
    const parameters = new URLSearchParams();
    parameters.set("classification", classification);
    parameters.set("page.size", "50");
    parameters.set("page.number", "1");
    parameters.set("sort.field", "price");
    parameters.set("sort.order", "ASCENDING");

    if (Number.isFinite(target.registrationMonths)) {
      const year = Math.floor(target.registrationMonths / 12);
      const month = (target.registrationMonths % 12) + 1;
      const pad = (value) => String(value).padStart(2, "0");
      parameters.set("firstRegistrationDate.min", `${year - 2}-${pad(month)}`);
      parameters.set("firstRegistrationDate.max", `${year + 2}-${pad(month)}`);
    }

    if (Number.isFinite(target.mileageKm)) {
      parameters.set(
        "mileage.min",
        String(Math.max(0, Math.round(target.mileageKm * 0.55))),
      );
      parameters.set(
        "mileage.max",
        String(Math.round(target.mileageKm * 1.45 + 15_000)),
      );
    }

    if (Number.isFinite(target.powerKw) && target.powerKw > 0) {
      parameters.set("power.min", String(Math.round(target.powerKw * 0.75)));
      parameters.set("power.max", String(Math.round(target.powerKw * 1.3)));
    }

    if (target.fuel && target.fuel !== "UNKNOWN") {
      const fuelMap = {
        PETROL: "PETROL",
        DIESEL: "DIESEL",
        ELECTRIC: "ELECTRICITY",
        HYBRID: "HYBRID",
        PLUGIN_HYBRID: "HYBRID_PLUGIN",
        LPG: "LPG",
        CNG: "CNG",
      };
      if (fuelMap[target.fuel]) parameters.set("fuel", fuelMap[target.fuel]);
    }

    const result = await requestJson(
      `${API}/search-api/search?${parameters.toString()}`,
      {
        headers: authHeader(),
        label: "mobile.de Suche",
        timeoutMs: 12_000,
        retries: 1,
      },
    );

    if (!result.ok || !result.data) {
      errors.push(
        result.status === 401 || result.status === 403
          ? "mobile.de Search-API ist für dieses Konto nicht freigeschaltet."
          : result.error || "mobile.de Suche fehlgeschlagen.",
      );
      // A credentials problem will not improve with another classification.
      if (result.status === 401 || result.status === 403) break;
      continue;
    }

    const ads =
      result.data?.searchResult?.ads ||
      result.data?.ads ||
      result.data?.searchResults ||
      [];

    const vehicles = [];
    for (const ad of Array.isArray(ads) ? ads : []) {
      const vehicle = createVehicle(mapApiAd(ad));
      if (vehicle.price && vehicle.listingUrl) vehicles.push(vehicle);
      if (vehicles.length >= limit) break;
    }

    if (vehicles.length) {
      return { ok: true, vehicles, error: null, blocked: false, skipped: false };
    }
  }

  return {
    ok: false,
    vehicles: [],
    error: unique(errors).join(" · ") || "Keine mobile.de-Treffer.",
    blocked: false,
    skipped: false,
  };
}

/**
 * Newest ads for the "Neue Angebote" feed, through the official Search API —
 * the only route mobile.de leaves open to a server. Needs an account with
 * Search-API access; without it the feed says so and runs on the other portals.
 *
 * @param {object} f  normalised feed filters (lib/feed/filters.js)
 */
export async function searchNewest(f, { page = 1 } = {}) {
  const parameters = new URLSearchParams();
  // Feed searches are Germany-only, including searches without a postcode.
  parameters.set("country", "DE");
  if (f.zip) {
    parameters.set("ambit.country", "DE");
    parameters.set("ambit.zipcode", f.zip);
    parameters.set("ambit.radius", String(f.radius));
  }
  parameters.set(
    "classification",
    f.make ? `refdata/classes/Car/makes/${guessKey(f.make)}` : "refdata/classes/Car",
  );
  parameters.set("page.size", "30");
  parameters.set("page.number", String(page));
  if (f.priceMin !== null) parameters.set("price.min", String(f.priceMin));
  if (f.priceMax !== null) parameters.set("price.max", String(f.priceMax));
  if (f.kmMin !== null) parameters.set("mileage.min", String(f.kmMin));
  if (f.kmMax !== null) parameters.set("mileage.max", String(f.kmMax));
  if (f.yearMin !== null) parameters.set("firstRegistrationDate.min", `${f.yearMin}-01`);
  if (f.yearMax !== null) parameters.set("firstRegistrationDate.max", `${f.yearMax}-12`);
  // The API counts power in kW.
  if (f.powerMin !== null) parameters.set("power.min", String(Math.floor(f.powerMin * 0.7355)));
  if (f.powerMax !== null) parameters.set("power.max", String(Math.ceil(f.powerMax * 0.7355)));
  const fuelMap = { PETROL: "PETROL", DIESEL: "DIESEL", ELECTRIC: "ELECTRICITY", HYBRID: "HYBRID", LPG: "LPG" };
  for (const fuel of f.fuels) if (fuelMap[fuel]) parameters.append("fuel", fuelMap[fuel]);
  if (f.gearbox === "MANUAL") parameters.set("gearbox", "MANUAL_GEAR");
  if (f.gearbox === "AUTOMATIC") parameters.set("gearbox", "AUTOMATIC_GEAR");
  const bodyMap = {
    SMALL: "SmallCar", SEDAN: "Limousine", ESTATE: "EstateCar", SUV: "OffRoad",
    VAN: "Van", COUPE: "SportsCar", CABRIO: "Cabrio",
  };
  for (const body of f.bodies) if (bodyMap[body]) parameters.append("category", bodyMap[body]);
  if (f.hideDamaged) parameters.set("damageUnrepaired", "false");

  const run = (sorted) => {
    const query = new URLSearchParams(parameters);
    if (sorted) {
      query.set("sort.field", "creationTime");
      query.set("sort.order", "DESCENDING");
    }
    return requestJson(`${API}/search-api/search?${query.toString()}`, {
      headers: authHeader(),
      label: "mobile.de Neu",
      timeoutMs: 9_000,
      retries: 0,
    });
  };

  let result = await run(true);
  // An API version without that sort field answers 400 — then unsorted.
  if (!result.ok && result.status === 400) result = await run(false);

  if (!result.ok || !result.data) {
    return {
      ok: false,
      items: [],
      url: null,
      error:
        result.status === 401 || result.status === 403
          ? "mobile.de: Such-API ist für dieses Konto nicht freigeschaltet."
          : result.error || "mobile.de-Suche fehlgeschlagen.",
    };
  }

  const ads = result.data?.searchResult?.ads || result.data?.ads || [];
  const items = [];
  for (const ad of Array.isArray(ads) ? ads : []) {
    const v = createVehicle(mapApiAd(ad));
    if (!v.price || !v.listingUrl) continue;
    if (f.seller === "PRIVATE" && v.sellerType !== "PRIVATE") continue;
    if (f.seller === "DEALER" && v.sellerType === "PRIVATE") continue;
    items.push({
      key: `MOBILE_DE:${v.listingId || v.listingUrl}`,
      source: "MOBILE_DE",
      id: v.listingId || v.listingUrl,
      numericId: Number(v.listingId) || null,
      url: v.listingUrl,
      title: v.title || [v.make, v.model].filter(Boolean).join(" ") || "Fahrzeug",
      make: v.make,
      model: v.model,
      price: v.price,
      priceNote: null,
      mileageKm: v.mileageKm,
      firstRegistration: v.firstRegistration,
      powerPs: v.powerPs,
      fuel: v.fuel,
      gearbox: v.gearbox,
      location: v.location,
      distanceKm: null,
      sellerType: v.sellerType,
      image: v.images?.[0] || null,
      rating: null,
      // The API already carries HU, accident status and owners.
      details: summarizeVehicle(v),
      postedAt: (() => {
        const date = new Date(ad?.creationDate || ad?.creationTime || "");
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      })(),
      promoted: false,
    });
  }
  return { ok: true, items, error: null, url: null, page, hasMore: page * 30 < 2000 && Array.isArray(ads) && ads.length >= 30 };
}

export function canHandle(url) {
  return /mobile\.de/i.test(String(url));
}

/* -------------------------------------------------------------- diagnostics */

/**
 * Tests each mobile.de route on its own so a failure can be attributed:
 * seller API (known to work), search API, single-ad API, and the public page.
 * @param {string|null} sampleAdUrl  a real ad link makes the last two checks real
 */
export async function diagnose(sampleAdUrl = null) {
  const checks = {};

  if (!isConfigured()) {
    return {
      credentials: false,
      note: "MOBILEDE_USERNAME / MOBILEDE_PASSWORD fehlen in der Umgebung.",
      checks,
    };
  }

  const describe = (result) => ({
    status: result.status,
    ok: result.ok,
    durationMs: result.durationMs,
    error: result.error,
  });

  // 1. Seller API — proves the credentials themselves are valid.
  const sellerId = process.env.MOBILEDE_SELLER_ID;
  if (sellerId) {
    const seller = await requestJson(
      `${API}/seller-api/sellers/${sellerId}/ads?page.size=1`,
      { headers: authHeader(), label: "Seller-API", timeoutMs: 10_000, retries: 0 },
    );
    checks.sellerApi = {
      ...describe(seller),
      meaning: seller.ok
        ? "Zugangsdaten sind gültig."
        : "Zugangsdaten werden bereits vom Seller-API abgelehnt.",
    };
  }

  // 2. Search API — the entitlement this feature needs for comparables.
  const search = await requestJson(
    `${API}/search-api/search?classification=refdata/classes/Car/makes/VOLKSWAGEN/models/GOLF&page.size=1`,
    { headers: authHeader(), label: "Search-API", timeoutMs: 12_000, retries: 0 },
  );
  checks.searchApi = {
    ...describe(search),
    meaning:
      search.status === 401 || search.status === 403
        ? "Konto ist NICHT für die Search-API freigeschaltet – bei mobile.de anfragen."
        : search.ok
          ? "Search-API nutzbar – mobile.de liefert Vergleichsfahrzeuge."
          : "Search-API antwortet, aber nicht wie erwartet.",
  };

  // 3+4. The ad endpoint and the public page, for the link the user pasted.
  const adId = sampleAdUrl ? listingId(sampleAdUrl) : null;
  checks.parsedAdId = adId;

  if (adId) {
    const ad = await requestJson(`${API}/search-api/ad/${adId}`, {
      headers: authHeader(),
      label: "Ad-API",
      timeoutMs: 10_000,
      retries: 0,
    });
    checks.adApi = {
      ...describe(ad),
      meaning: ad.ok
        ? "Einzelanzeige kann direkt über die API gelesen werden."
        : ad.status === 401 || ad.status === 403
          ? "Keine Berechtigung für fremde Anzeigen."
          : ad.status === 404
            ? "Anzeige-ID im API-Bestand nicht gefunden."
            : "Ad-API nicht erreichbar.",
    };
  }

  if (sampleAdUrl) {
    const page = await request(sampleAdUrl, {
      label: "Seitenabruf",
      timeoutMs: 12_000,
      retries: 0,
    });
    checks.publicPage = {
      status: page.status,
      ok: page.ok,
      blocked: page.blocked,
      bytes: page.body?.length || 0,
      durationMs: page.durationMs,
      meaning: page.ok
        ? "Seite ist vom Server abrufbar."
        : page.blocked
          ? "mobile.de blockiert den Abruf vom Server (Bot-Schutz)."
          : "Seite nicht abrufbar.",
    };

    // What the page actually contains — so a failing parser can be fixed
    // against reality instead of guesswork.
    if (page.ok) {
      const html = page.body;
      const text = textContent(html).slice(0, 40_000);

      checks.pageSignals = {
        scriptIds: [...html.matchAll(/<script[^>]*id=["']([^"']+)["']/gi)]
          .map((hit) => hit[1])
          .slice(0, 15),
        jsonLdTypes: jsonLdBlocks(html)
          .map((block) => block["@type"])
          .flat()
          .filter(Boolean)
          .slice(0, 10),
        embeddedJsonBlocks: allEmbeddedJson(html).length,
        hasOgTitle: Boolean(metaContent(html, ["og:title"])),
        hasMetaPrice: Boolean(metaContent(html, ["product:price:amount"])),
        labelsFound: [
          "Kilometerstand",
          "Erstzulassung",
          "Leistung",
          "Kraftstoff",
          "Getriebe",
          "Fahrzeughalter",
        ].filter((label) => text.includes(label)),
        firstEuroAmount: (text.match(/([\d.]{4,12})\s*€/) || [])[1] || null,
        h1: cleanText((html.match(/<h1[^>]*>([\s\S]{0,160}?)<\/h1>/i) || [])[1]) || null,
      };

      // The decisive check: does the extractor produce a usable vehicle?
      const extraction = await fetchListingViaPage(sampleAdUrl);
      checks.pageExtraction = extraction.ok
        ? {
            ok: true,
            meaning: "Anzeige konnte aus der Seite gelesen werden.",
            vehicle: {
              title: extraction.vehicle.title,
              make: extraction.vehicle.make,
              model: extraction.vehicle.model,
              price: extraction.vehicle.price,
              firstRegistration: extraction.vehicle.firstRegistration,
              mileageKm: extraction.vehicle.mileageKm,
              powerPs: extraction.vehicle.powerPs,
              fuel: extraction.vehicle.fuel,
              gearbox: extraction.vehicle.gearbox,
              priceType: extraction.vehicle.priceType,
              condition: extraction.vehicle.condition,
              extractedFrom: extraction.vehicle.extractedFrom,
            },
          }
        : {
            ok: false,
            meaning: "Seite geladen, aber nicht auswertbar.",
            error: extraction.error,
          };
    }
  }

  return { credentials: true, checks };
}
