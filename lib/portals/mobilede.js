/**
 * mobile.de — newest ads through the official Search API.
 *
 * mobile.de refuses server requests to its pages, so the Search API is the
 * only route open to a server. It uses the same credentials as the Seller API
 * (lib/mobile.js). Not every account is entitled to it, so a 401/403 is
 * reported as "not enabled" and the feed runs on the other portals.
 */

import { MOBILE_CREDENTIALS } from "./config";
import { requestJson } from "./http";
import { cleanText, normalizeText, toNumber } from "./utils";
import { createVehicle, detectPriceType, detectTuv, detectServiceHistory } from "./vehicle";

const API = "https://services.mobile.de";
const ACCEPT = "application/vnd.de.mobile.api+json";

function authHeader() {
  const token = Buffer.from(
    `${MOBILE_CREDENTIALS.username}:${MOBILE_CREDENTIALS.password}`,
  ).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: ACCEPT };
}

export function isConfigured() {
  return MOBILE_CREDENTIALS.enabled;
}

/** Fallback key shape when reference data is unavailable. */
function guessKey(value) {
  return normalizeText(value).replace(/\s+/g, "_").toUpperCase();
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
    // The API sends codes ("NAVIGATION_SYSTEM").
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

/**
 * Newest ads for the "Neue Angebote" feed, through the official Search API —
 * the only route mobile.de leaves open to a server. Needs an account with
 * Search-API access; without it the feed says so and runs on the other portals.
 *
 * @param {object} f  normalised feed filters (lib/neue-angebote/filters.js)
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
      // The API already carries HU, accident status and owners; the feed
      // turns this into the card facts (lib/neue-angebote/details.js).
      vehicle: v,
      postedAt: (() => {
        const date = new Date(ad?.creationDate || ad?.creationTime || "");
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      })(),
      promoted: false,
    });
  }
  return { ok: true, items, error: null, url: null, page, hasMore: page * 30 < 2000 && Array.isArray(ads) && ads.length >= 30 };
}
