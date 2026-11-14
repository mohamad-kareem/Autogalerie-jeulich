/**
 * AutoScout24 — reads one ad page.
 *
 * Ad pages are server rendered and ship their data
 * as JSON inside the HTML, so we read that instead of scraping the DOM. Three
 * extraction layers run in order and the first complete one wins.
 */

import { request } from "./http";
import {
  scriptJsonById,
  jsonLdOfType,
  metaContent,
  textContent,
  mileageFromText,
  detailPairs,
  detailValue,
} from "./html";
import {
  cleanText,
  deepCollect,
  pick,
  toNumber,
  normalizeText,
  slugify,
} from "./utils";
import {
  createVehicle,
  detectPriceType,
  detectTuv,
  detectServiceHistory,
  detectConditionFromText,
} from "./vehicle";

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
export function makeSlug(make) {
  const key = normalizeText(make);
  return MAKE_SLUGS[key] || slugify(make);
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
    toNumber(pick(node, ["rawMileageInKm", "mileageInKmRaw"])) ??
    toNumber(pick(node?.vehicle, ["rawMileageInKm", "mileageInKmRaw"])) ??
    details.mileageKm ??
    toNumber(pick(node, ["mileageInKm", "mileage", "km"]));

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
          [
            pick(node, ["make", "makeName"]) ?? pick(node?.vehicle, ["make", "makeName"]),
            pick(node, ["model", "modelName"]) ?? pick(node?.vehicle, ["model", "modelName"]),
            pick(node, ["modelVersion", "versionName"]) ?? pick(node?.vehicle, ["modelVersionInput", "modelVersion", "variant"]),
          ].filter(Boolean).join(" "),
      ) || null,
    // Search results keep make and model in a nested "vehicle" block.
    make: pick(node, ["make", "makeName", "manufacturer", "brand"]) ?? pick(node?.vehicle, ["make", "makeName"]),
    model: pick(node, ["model", "modelName", "modelGroup"]) ?? pick(node?.vehicle, ["model", "modelName", "modelGroup"]),
    variant:
      pick(node, ["modelVersion", "versionName", "subtitle", "trim"]) ??
      pick(node?.vehicle, ["modelVersionInput", "modelVersion", "variant", "subtitle"]),
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
    country: pick(location, ["countryCode", "country"]),
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
    // The numbers the seller shows in the ad ("phones": [{ formattedNumber, callTo }]).
    sellerPhones: [
      ...(Array.isArray(seller.phones) ? seller.phones : []),
      seller.phone,
      seller.phoneNumber,
    ]
      .map((entry) => (entry && typeof entry === "object" ? entry.callTo || entry.formattedNumber || entry.number : entry))
      .filter(Boolean),
    sellerEmail: seller.email || seller.contactEmail || null,
    location:
      cleanText([location.zip, location.city].filter(Boolean).join(" ")) || null,
    country: location.countryCode || null,

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
    mileageKm: toNumber(detailValue(pairs, ["kilometerstand", "mileage"])) ?? mileageFromText(text),
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
