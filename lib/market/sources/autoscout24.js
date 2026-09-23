/**
 * AutoScout24 — the workhorse source.
 *
 * Listing pages and search pages are both server rendered and ship their data
 * as JSON inside the HTML, so we read that instead of scraping the DOM. Three
 * extraction layers run in order and the first complete one wins.
 */

import { POLICY } from "../config";
import { request } from "../http";
import {
  scriptJsonById,
  jsonLdOfType,
  metaContent,
  textContent,
  detailPairs,
  detailValue,
} from "../html";
import {
  cleanText,
  deepCollect,
  pick,
  toNumber,
  normalizeText,
  slugify,
  unique,
} from "../utils";
import {
  createVehicle,
  detectPriceType,
  detectTuv,
  detectServiceHistory,
  detectConditionFromText,
  normalizeFuel,
  normalizeGearbox,
} from "../vehicle";

const BASE = "https://www.autoscout24.de";

/** AutoScout24 uses its own slugs for a handful of makes. */
const MAKE_SLUGS = {
  vw: "volkswagen",
  volkswagen: "volkswagen",
  "vw nutzfahrzeuge": "volkswagen",
  mercedes: "mercedes-benz",
  "mercedes benz": "mercedes-benz",
  "mercedes-benz": "mercedes-benz",
  benz: "mercedes-benz",
  bmw: "bmw",
  audi: "audi",
  opel: "opel",
  ford: "ford",
  skoda: "skoda",
  "škoda": "skoda",
  seat: "seat",
  cupra: "cupra",
  renault: "renault",
  peugeot: "peugeot",
  citroen: "citroen",
  "citroën": "citroen",
  ds: "ds-automobiles",
  fiat: "fiat",
  alfa: "alfa-romeo",
  "alfa romeo": "alfa-romeo",
  toyota: "toyota",
  lexus: "lexus",
  honda: "honda",
  mazda: "mazda",
  mitsubishi: "mitsubishi",
  nissan: "nissan",
  subaru: "subaru",
  suzuki: "suzuki",
  hyundai: "hyundai",
  kia: "kia",
  volvo: "volvo",
  polestar: "polestar",
  jaguar: "jaguar",
  "land rover": "land-rover",
  landrover: "land-rover",
  mini: "mini",
  porsche: "porsche",
  tesla: "tesla",
  smart: "smart",
  dacia: "dacia",
  jeep: "jeep",
  chevrolet: "chevrolet",
  chrysler: "chrysler",
  dodge: "dodge",
  cadillac: "cadillac",
  maserati: "maserati",
  ferrari: "ferrari",
  lamborghini: "lamborghini",
  bentley: "bentley",
  "rolls royce": "rolls-royce",
  "aston martin": "aston-martin",
  "mg": "mg",
  byd: "byd",
  ssangyong: "ssangyong",
  isuzu: "isuzu",
  iveco: "iveco",
  abarth: "abarth",
};

const FUEL_CODES = {
  PETROL: "B",
  DIESEL: "D",
  ELECTRIC: "E",
  HYBRID: "2",
  PLUGIN_HYBRID: "3",
  LPG: "L",
  CNG: "C",
};

const GEARBOX_CODES = {
  MANUAL: "M",
  AUTOMATIC: "A",
  SEMI_AUTOMATIC: "S",
};

export function makeSlug(make) {
  const key = normalizeText(make);
  return MAKE_SLUGS[key] || slugify(make);
}

export function modelSlug(model) {
  return slugify(String(model || "").replace(/\s*\(.*?\)\s*/g, ""));
}

/* ------------------------------------------------------------------ detail */

/** Recognises an object that carries the essentials of a listing. */
function looksLikeListing(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  const keys = Object.keys(node);
  if (keys.length < 3) return false;

  const hasPrice = keys.some((key) => /^(price|prices|priceRaw)$/i.test(key));
  const hasVehicle = keys.some((key) =>
    /^(mileage|firstRegistration|firstRegistrationDate|vehicleDetails|rawMileage|rawFirstRegistrationDate)$/i.test(
      key,
    ),
  );
  const hasIdentity = keys.some((key) =>
    /^(id|guid|listingId|make|makeName|model|modelName)$/i.test(key),
  );

  return hasPrice && hasVehicle && hasIdentity;
}

/** AS24 ships some fields as an icon/value list; this reads it. */
function fromVehicleDetails(node) {
  const details = node?.vehicleDetails || node?.details;
  if (!Array.isArray(details)) return {};

  const result = {};
  for (const entry of details) {
    const icon = normalizeText(entry?.iconName || entry?.icon || entry?.type);
    const value = cleanText(entry?.data ?? entry?.value ?? entry?.text);
    if (!value) continue;

    if (/mileage|road/.test(icon)) result.mileageKm = toNumber(value);
    else if (/calendar|registration/.test(icon)) result.firstRegistration = value;
    else if (/gas|fuel/.test(icon)) result.fuel = value;
    else if (/transmission|gear/.test(icon)) result.gearbox = value;
    else if (/speed|power/.test(icon)) {
      const kw = value.match(/(\d[\d.,]*)\s*kW/i);
      const ps = value.match(/(\d[\d.,]*)\s*(?:PS|hp)/i);
      if (kw) result.powerKw = toNumber(kw[1]);
      if (ps) result.powerPs = toNumber(ps[1]);
    } else if (/people|seller|dealer/.test(icon)) result.sellerType = value;
  }

  return result;
}

function priceFrom(node) {
  const direct = toNumber(
    pick(node, ["priceRaw", "price", "priceInEuro", "consumerPriceGross"]),
  );
  if (Number.isFinite(direct) && direct > 100) return direct;

  const nested =
    node?.prices?.public?.priceRaw ??
    node?.prices?.public?.price ??
    node?.price?.priceRaw ??
    node?.price?.amount ??
    node?.price?.value;

  const parsed = toNumber(nested);
  return Number.isFinite(parsed) && parsed > 100 ? parsed : null;
}

function mapListingNode(node, pageUrl) {
  const details = fromVehicleDetails(node);

  const id =
    pick(node, ["id", "guid", "listingId"]) ||
    pick(node?.tracking || {}, ["id", "guid"]);

  const rawUrl = pick(node, ["url", "detailPageUrl", "link", "href"]);
  let listingUrl = pageUrl || null;
  if (rawUrl) {
    try {
      listingUrl = new URL(String(rawUrl), BASE).toString();
    } catch {
      /* keep the page url */
    }
  } else if (id && !pageUrl) {
    listingUrl = `${BASE}/angebote/${id}`;
  }

  const seller = node?.seller || node?.vendor || {};
  const location = node?.location || seller?.location || {};

  const powerKw =
    toNumber(pick(node, ["rawPowerInKw", "powerInKw", "powerKw", "kw"])) ??
    details.powerKw ??
    null;
  const powerPs =
    toNumber(pick(node, ["rawPowerInHp", "powerInHp", "powerPs", "hp", "ps"])) ??
    details.powerPs ??
    null;

  const firstRegistration =
    pick(node, [
      "rawFirstRegistrationDate",
      "firstRegistrationDate",
      "firstRegistration",
      "registrationDate",
    ]) ??
    details.firstRegistration ??
    null;

  const mileageKm =
    toNumber(pick(node, ["rawMileageInKm", "mileageInKm", "mileage", "km"])) ??
    details.mileageKm ??
    null;

  const vatText = [
    node?.priceType,
    node?.vat,
    node?.vatRate,
    node?.prices?.public?.vatRate,
    node?.prices?.public?.priceType,
    typeof node?.vatDeductible === "boolean"
      ? node.vatDeductible
        ? "MwSt. ausweisbar"
        : "Differenzbesteuert"
      : null,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ");

  return {
    listingId: id ? String(id) : null,
    listingUrl,
    title:
      cleanText(
        pick(node, ["title", "name", "headline"]) ||
          [node?.make, node?.model, node?.modelVersion].filter(Boolean).join(" "),
      ) || null,
    make: pick(node, ["make", "makeName", "manufacturer", "brand"]),
    model: pick(node, ["model", "modelName", "modelGroup"]),
    variant: pick(node, ["modelVersion", "versionName", "subtitle", "trim"]),
    price: priceFrom(node),
    priceType: detectPriceType(vatText),
    firstRegistration,
    mileageKm,
    fuel: pick(node, ["fuelType", "fuel", "fuelCategory"]) ?? details.fuel,
    gearbox:
      pick(node, ["transmissionType", "transmission", "gearbox"]) ??
      details.gearbox,
    powerKw,
    powerPs,
    bodyType: pick(node, ["bodyType", "category", "vehicleType"]),
    doors: toNumber(pick(node, ["doors", "numberOfDoors"])),
    seats: toNumber(pick(node, ["seats", "numberOfSeats"])),
    color: pick(node, ["bodyColor", "color", "exteriorColor"]),
    ownerCount: toNumber(pick(node, ["previousOwners", "numberOfPreviousOwners"])),
    sellerType:
      pick(seller, ["type", "sellerType", "customerType"]) ??
      details.sellerType ??
      null,
    sellerName: pick(seller, ["companyName", "name"]),
    // Search results carry small thumbnails — enough to spot a wreck in the
    // comparables list without opening every ad.
    images: Array.isArray(node?.images)
      ? node.images.filter((image) => typeof image === "string").slice(0, 3)
      : [],
    location: cleanText(
      [pick(location, ["zip", "zipCode", "postalCode"]), pick(location, ["city", "town"])]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

/** An ad description arrives as HTML; lists become comma-separated text. */
function htmlToText(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return (
    cleanText(
      value
        .replace(/<\s*br\s*\/?>/gi, ", ")
        .replace(/<\/(li|p|div|ul)>/gi, ", ")
        .replace(/<[^>]+>/g, " ")
        .replace(/(\s*,\s*){2,}/g, ", "),
    ).replace(/^,\s*|,\s*$/g, "") || null
  );
}

/**
 * The ad page's own record: `props.pageProps.listingDetails`.
 *
 * Far richer than the generic scan below — the equipment list by category,
 * the full photo set, AutoScout24's own price assessment for this car, when
 * the ad went up and how many people saved it. Read by name because these
 * fields sit where the generic listing detector does not look.
 */
function fromListingDetails(nextData) {
  const detail = nextData?.props?.pageProps?.listingDetails;
  if (!detail || typeof detail !== "object") return null;

  const vehicle = detail.vehicle || {};

  // { comfortAndConvenience: [{ id: "Sitzheizung", … }], safetyAndSecurity: … }
  const equipment = [];
  if (vehicle.equipment && typeof vehicle.equipment === "object") {
    for (const list of Object.values(vehicle.equipment)) {
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        const label =
          typeof entry === "string" ? entry : entry?.id ?? entry?.name ?? entry?.label;
        if (label) equipment.push(String(label));
      }
    }
  }

  const prices = detail.prices?.public || detail.prices?.dealer || null;
  const median = toNumber(prices?.median);
  const portalValuation =
    Number.isFinite(median) && median > 300
      ? {
          source: "AutoScout24",
          median,
          category: toNumber(prices.category),
          ranges: Array.isArray(prices.evaluationRanges)
            ? prices.evaluationRanges.map((range) => ({
                minimum: toNumber(range?.minimum),
                maximum: toNumber(range?.maximum),
                category: toNumber(range?.category),
              }))
            : [],
        }
      : null;

  const statistics = detail.dpvStatistics;

  // Fields arrive either as plain values or as { raw, formatted } pairs.
  const plain = (value) =>
    value && typeof value === "object" ? value.formatted ?? value.raw ?? null : value ?? null;

  const location = detail.location || {};
  const seller = detail.seller || {};
  const variant = plain(vehicle.modelVersionInput) || plain(vehicle.variant);

  return {
    // The core record, so the ad reads even if the page's JSON-LD goes away.
    title:
      cleanText([plain(vehicle.make), plain(vehicle.model), variant].filter(Boolean).join(" ")) ||
      null,
    make: plain(vehicle.make),
    model: plain(vehicle.model),
    variant,
    price: toNumber(prices?.priceRaw ?? detail.price?.priceRaw),
    priceType: prices?.taxDeductible === true ? "VAT_DEDUCTIBLE" : null,
    negotiable: prices?.negotiable === true,
    mileageKm: toNumber(vehicle.mileageInKmRaw ?? plain(vehicle.mileageInKm)),
    firstRegistration:
      plain(vehicle.firstRegistrationDate) || plain(vehicle.firstRegistrationDateRaw),
    powerKw: toNumber(vehicle.rawPowerInKw),
    powerPs: toNumber(vehicle.rawPowerInHp),
    displacementCcm: toNumber(
      vehicle.rawDisplacementInCCM ??
        vehicle.displacementInCCM ??
        plain(vehicle.displacement) ??
        plain(vehicle.cubicCapacity),
    ),
    fuel: plain(vehicle.fuelCategory) || plain(vehicle.primaryFuel),
    gearbox: plain(vehicle.transmissionType),
    bodyType: plain(vehicle.bodyType),
    color: plain(vehicle.bodyColor),
    sellerType: plain(seller.type),
    sellerName: cleanText(seller.companyName || seller.contactName) || null,
    location:
      cleanText([location.zip, location.city].filter(Boolean).join(" ")) || null,

    equipment,
    images: Array.isArray(detail.images)
      ? detail.images.filter((image) => typeof image === "string")
      : [],
    description: htmlToText(detail.description),

    upholstery: vehicle.upholstery,
    driveTrain: vehicle.driveTrain,
    paintType: vehicle.paintType,
    ownerCount: toNumber(vehicle.noOfPreviousOwners),
    nonSmoking: typeof vehicle.nonSmoking === "boolean" ? vehicle.nonSmoking : null,
    newInspection:
      typeof vehicle.newInspection === "boolean" ? vehicle.newInspection : null,
    lastBeltService: vehicle.lastBeltServiceDate || null,
    tuvUntil: vehicle.nextVehicleSafetyInspection || null,
    serviceHistory: vehicle.hasFullServiceHistory === true ? "YES" : null,

    // A structured yes/no beats any reading of the text.
    condition:
      vehicle.hadAccident === false &&
      !(Array.isArray(vehicle.damageConditions) && vehicle.damageConditions.length)
        ? "ACCIDENT_FREE"
        : vehicle.hadAccident === true
          ? "REPAIRED_DAMAGE"
          : null,

    warranty: detail.warrantyExists
      ? cleanText(
          typeof detail.warranty === "string"
            ? detail.warranty
            : detail.warranty?.duration || detail.warranty?.text || "",
        ) || "Garantie vorhanden"
      : null,

    listedAt: detail.createdTimestampWithOffset || null,
    interest: statistics
      ? { views: toNumber(statistics.interaction), favorites: toNumber(statistics.favorites) }
      : null,
    portalValuation,
  };
}

function fromJsonLd(html, pageUrl) {
  const block =
    jsonLdOfType(html, ["Car", "Vehicle", "Product", "Offer"]) || null;
  if (!block) return null;

  const offer = Array.isArray(block.offers) ? block.offers[0] : block.offers;

  return {
    listingUrl: pageUrl,
    title: cleanText(block.name),
    make: cleanText(block.brand?.name || block.manufacturer?.name || block.brand),
    model: cleanText(block.model?.name || block.model),
    variant: cleanText(block.vehicleConfiguration || block.trim),
    price: toNumber(offer?.price ?? block.price),
    firstRegistration:
      block.productionDate || block.dateVehicleFirstRegistered || block.modelDate,
    mileageKm: toNumber(
      block.mileageFromOdometer?.value ?? block.mileageFromOdometer,
    ),
    fuel: cleanText(block.fuelType),
    gearbox: cleanText(block.vehicleTransmission),
    powerKw: toNumber(
      typeof block.vehicleEngine?.enginePower === "object"
        ? block.vehicleEngine.enginePower.value
        : block.vehicleEngine?.enginePower,
    ),
    bodyType: cleanText(block.bodyType),
    doors: toNumber(block.numberOfDoors),
    seats: toNumber(block.seatingCapacity),
    color: cleanText(block.color),
    ownerCount: toNumber(block.numberOfPreviousOwners),
    description: cleanText(block.description),
    images: []
      .concat(block.image || [])
      .map((image) => (typeof image === "string" ? image : image?.url))
      .filter(Boolean),
  };
}

function fromVisibleHtml(html, pageUrl) {
  const pairs = detailPairs(html);
  const text = textContent(html).slice(0, 20_000);

  const priceMeta = metaContent(html, [
    "product:price:amount",
    "og:price:amount",
  ]);
  const priceText =
    priceMeta || (text.match(/€\s?\d[\d.\s]{2,}/) || [])[0] || null;

  return {
    listingUrl: pageUrl,
    title: metaContent(html, ["og:title", "twitter:title"]),
    price: toNumber(priceText),
    mileageKm: toNumber(
      detailValue(pairs, ["kilometerstand", "mileage"]) ||
        (text.match(/(\d[\d.\s]{2,})\s*km\b/) || [])[1],
    ),
    firstRegistration:
      detailValue(pairs, ["erstzulassung", "first registration", "ez"]) ||
      (text.match(/Erstzulassung[^0-9]{0,12}(\d{1,2}\/\d{4})/i) || [])[1],
    fuel: detailValue(pairs, ["kraftstoff", "fuel"]),
    gearbox: detailValue(pairs, ["getriebe", "transmission"]),
    powerPs: toNumber((text.match(/(\d{2,4})\s*PS\b/) || [])[1]),
    powerKw: toNumber((text.match(/(\d{2,4})\s*kW\b/) || [])[1]),
    ownerCount: toNumber(detailValue(pairs, ["fahrzeughalter", "vorbesitzer"])),
    description: metaContent(html, ["og:description", "description"]),
    images: [metaContent(html, ["og:image"])].filter(Boolean),
  };
}

/**
 * Loads one AutoScout24 ad.
 * @returns {Promise<{ok:boolean,vehicle:object|null,error:string|null,blocked:boolean}>}
 */
export async function fetchListing(url) {
  const response = await request(url, { label: "AutoScout24" });

  if (!response.ok) {
    return {
      ok: false,
      vehicle: null,
      error: response.error,
      blocked: response.blocked,
    };
  }

  return parseListingPage(response.body, url);
}

/**
 * Reads one AutoScout24 ad page. Separate from the request so it can be
 * tested against saved pages.
 */
export function parseListingPage(html, url) {
  const layers = [];

  const nextData = scriptJsonById(html, "__NEXT_DATA__");
  if (nextData) {
    const own = fromListingDetails(nextData);
    if (own) layers.push({ from: "anzeigendaten", data: own });

    const candidates = deepCollect(nextData, looksLikeListing, 40);
    const best = candidates.sort(
      (a, b) => Object.keys(b).length - Object.keys(a).length,
    )[0];
    if (best) layers.push({ from: "__NEXT_DATA__", data: mapListingNode(best, url) });
  }

  const ld = fromJsonLd(html, url);
  if (ld) layers.push({ from: "json-ld", data: ld });

  layers.push({ from: "html", data: fromVisibleHtml(html, url) });

  // Merge layers by priority: earlier layers win, later ones fill gaps.
  const merged = {};
  const usedLayers = [];
  for (const layer of layers) {
    let contributed = false;
    for (const [key, value] of Object.entries(layer.data)) {
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value) && !value.length) continue;
      if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
        merged[key] = value;
        contributed = true;
      }
    }
    if (contributed) usedLayers.push(layer.from);
  }

  const fullText = textContent(html).slice(0, 30_000);

  const vehicle = createVehicle({
    ...merged,
    source: "AUTOSCOUT24",
    sourceLevel: "RETAIL",
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
    // The portal's own yes/no when it has one. Otherwise the text, restricted
    // to the ad itself — scanning the whole page flags every car as damaged,
    // because the words appear in menus and neighbouring ads.
    condition:
      merged.condition ||
      detectConditionFromText(
        `${fullText.slice(0, 6_000)} ${merged.description || ""}`.slice(0, 8_000),
      ),
    description: merged.description || fullText.slice(0, 2_000),
    extractedFrom: usedLayers.join(" + ") || "html",
  });

  if (!vehicle.price && !vehicle.make) {
    return {
      ok: false,
      vehicle: null,
      error:
        "Die AutoScout24-Anzeige konnte nicht gelesen werden (Seitenstruktur unerwartet).",
      blocked: false,
    };
  }

  return { ok: true, vehicle, error: null, blocked: false };
}

/* ------------------------------------------------------------------ search */

function buildSearchUrl(target, { page = 1, relaxed = false } = {}) {
  const make = makeSlug(target.make);
  const model = relaxed ? "" : modelSlug(target.model);
  const path = model ? `/lst/${make}/${model}` : `/lst/${make}`;

  const parameters = new URLSearchParams({
    atype: "C",
    cy: "D",
    desc: "0",
    sort: "price",
    ustate: "N,U",
    page: String(page),
    size: "20",
    damaged_listing: "exclude",
  });

  if (Number.isFinite(target.registrationMonths)) {
    const year = Math.floor(target.registrationMonths / 12);
    const window = relaxed ? 3 : 2;
    parameters.set("fregfrom", String(year - window));
    parameters.set("fregto", String(year + window));
  }

  if (Number.isFinite(target.mileageKm)) {
    const window = relaxed ? 0.65 : 0.45;
    parameters.set(
      "kmfrom",
      String(Math.max(0, Math.round(target.mileageKm * (1 - window)))),
    );
    parameters.set(
      "kmto",
      String(Math.round(target.mileageKm * (1 + window) + 15_000)),
    );
  }

  const fuelCode = FUEL_CODES[target.fuel];
  if (fuelCode) parameters.set("fuel", fuelCode);

  const gearboxCode = GEARBOX_CODES[target.gearbox];
  if (gearboxCode && !relaxed) parameters.set("gear", gearboxCode);

  if (Number.isFinite(target.powerKw) && !relaxed) {
    parameters.set("powertype", "kw");
    parameters.set("powerfrom", String(Math.round(target.powerKw * 0.75)));
    parameters.set("powerto", String(Math.round(target.powerKw * 1.3)));
  }

  return `${BASE}${path}?${parameters.toString()}`;
}

function parseSearchPage(html, pageUrl) {
  const results = [];

  const nextData = scriptJsonById(html, "__NEXT_DATA__");
  if (nextData) {
    for (const node of deepCollect(nextData, looksLikeListing, 120)) {
      const mapped = mapListingNode(node, null);
      if (mapped.price && (mapped.mileageKm !== null || mapped.firstRegistration)) {
        results.push(mapped);
      }
    }
  }

  if (results.length) return results;

  // Fallback: article blocks in the rendered list.
  const articles = html.match(/<article[\s\S]{0,6000}?<\/article>/gi) || [];
  for (const article of articles) {
    const idMatch = article.match(/data-guid=["']([^"']+)["']/i);
    const linkMatch = article.match(/href=["'](\/angebote\/[^"']+)["']/i);
    const text = textContent(article);

    const price = toNumber((text.match(/€\s?\d[\d.\s]{2,}/) || [])[0]);
    if (!price) continue;

    results.push({
      listingId: idMatch ? idMatch[1] : null,
      listingUrl: linkMatch ? new URL(linkMatch[1], BASE).toString() : pageUrl,
      title: cleanText((article.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1]),
      price,
      mileageKm: toNumber((text.match(/(\d[\d.\s]{2,})\s*km\b/) || [])[1]),
      firstRegistration: (text.match(/\b(0?[1-9]|1[0-2])\/((?:19|20)\d{2})\b/) || [])[0],
      powerPs: toNumber((text.match(/(\d{2,4})\s*PS\b/) || [])[1]),
      powerKw: toNumber((text.match(/(\d{2,4})\s*kW\b/) || [])[1]),
      fuel: (text.match(/\b(Benzin|Diesel|Elektro|Hybrid|Autogas|Erdgas)\b/i) || [])[1],
      gearbox: (text.match(/\b(Automatik|Schaltgetriebe|Halbautomatik)\b/i) || [])[1],
    });
  }

  return results;
}

/**
 * Searches AutoScout24 for cars comparable to `target`.
 * Two pages are fetched in parallel; a relaxed query follows only if needed.
 */
export async function searchComparables(target, { limit = POLICY.perSourceLimit } = {}) {
  if (!target.make) {
    return { ok: false, vehicles: [], error: "Keine Marke bekannt.", blocked: false };
  }

  const collected = [];
  const errors = [];
  let blocked = false;

  const run = async (options) => {
    const url = buildSearchUrl(target, options);
    const response = await request(url, { label: "AutoScout24 Suche" });
    if (!response.ok) {
      errors.push(response.error);
      blocked = blocked || response.blocked;
      return;
    }
    collected.push(...parseSearchPage(response.body, url));
  };

  await Promise.all([run({ page: 1 }), run({ page: 2 })]);

  if (collected.length < 8 && !blocked) {
    await run({ page: 1, relaxed: true });
  }

  const vehicles = [];
  const seen = new Set();

  for (const raw of collected) {
    const key = raw.listingId || raw.listingUrl;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const vehicle = createVehicle({
      ...raw,
      source: "AUTOSCOUT24",
      sourceLevel: "RETAIL",
      fuel: raw.fuel ? normalizeFuel(raw.fuel) : "UNKNOWN",
      gearbox: raw.gearbox ? normalizeGearbox(raw.gearbox) : "UNKNOWN",
      extractedFrom: "search",
    });

    if (vehicle.price && vehicle.listingUrl) vehicles.push(vehicle);
    if (vehicles.length >= limit) break;
  }

  return {
    ok: vehicles.length > 0,
    vehicles,
    error: vehicles.length ? null : unique(errors).join(" · ") || "Keine Treffer.",
    blocked,
  };
}

export function canHandle(url) {
  return /autoscout24\./i.test(String(url));
}
