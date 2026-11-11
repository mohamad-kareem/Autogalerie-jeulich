import { MAX_SEARCH_CARDS } from "../../../extensions/marktanalyse/protocol.js";
import { parsePastedListing } from "../paste";
import { cleanText, slugify, toNumber } from "../utils";
import { createVehicle, detectConditionFromText, missingCoreFields } from "../vehicle";
import { validateListingUrl } from "./urls";

const MODEL_SELECTION = /^\d+;(?:\d+|group-\d+);;$/;

function searchRanges(vehicle) {
  const year = Math.floor(vehicle.registrationMonths / 12);
  const currentYear = new Date().getFullYear();
  return {
    minYear: year - 2,
    maxYear: Math.max(year, Math.min(year + 2, currentYear)),
    minMileage: Math.max(0, Math.floor(vehicle.mileageKm * 0.55 - 5_000)),
    maxMileage: Math.ceil(vehicle.mileageKm * 1.45 + 15_000),
  };
}

export function filterMobileSearchResults(result, target) {
  if (!result.ok || !result.vehicles.length) return result;
  const { minYear, maxYear, minMileage, maxMileage } = searchRanges(target);
  const vehicles = result.vehicles.filter((vehicle) => {
    const year = Math.floor(vehicle.registrationMonths / 12);
    return year >= minYear && year <= maxYear &&
      vehicle.mileageKm >= minMileage && vehicle.mileageKm <= maxMileage;
  });
  if (vehicles.length) return { ...result, vehicles };
  return { ...result, ok: false, vehicles, error: "Keine mobile.de-Angebote im gesuchten Bereich für Erstzulassung und Kilometerstand." };
}

export function buildMobileSearchUrl(vehicle, listingUrl = vehicle.listingUrl, listing = null) {
  if (missingCoreFields(vehicle).length) return null;

  const make = slugify(vehicle.make);
  const model = slugify(vehicle.model);
  if (!make || !model) return null;
  const makeSlug = make === "vw" ? "volkswagen" : make === "mercedes" ? "mercedes-benz" : make;
  const modelSlug = `${makeSlug}-${model}`;
  const makeId = listing?.make?.id ?? listing?.makeId;
  const modelId = listing?.model?.id ?? listing?.modelId;
  const listingSelection = `${makeId};${modelId};;`;
  const originalSelections = URL.canParse(listingUrl) ? new URL(listingUrl).searchParams.getAll("ms") : [];
  const originalSelection = originalSelections.length === 1
    ? originalSelections[0].split(";").slice(0, 2).join(";") + ";;"
    : "";
  const selection = [listingSelection, originalSelection].find((value) => MODEL_SELECTION.test(value));
  const year = Math.floor(vehicle.registrationMonths / 12);
  const currentYear = new Date().getFullYear();
  // A first page of all model years often contains no nearly new cars.
  const yearSuffix = vehicle.mileageKm < 10_000 && year >= currentYear - 1 ? `-${year}` : "";
  const path = selection ? "/fahrzeuge/search.html" : `/auto/${modelSlug}${yearSuffix}.html`;
  const url = new URL(path, "https://suchen.mobile.de");
  const { minYear, maxYear, minMileage, maxMileage } = searchRanges(vehicle);
  url.search = new URLSearchParams({
    cn: "DE",
    dam: "false",
    fr: `${minYear}:${maxYear}`,
    ml: `${minMileage}:${maxMileage}`,
  });
  if (selection) {
    url.searchParams.set("s", "Car");
    url.searchParams.set("vc", "Car");
    url.searchParams.set("isSearchRequest", "true");
    url.searchParams.set("ms", selection);
  }
  return url.href;
}

/** Only accept details printed on a single search-result card. */
function vehicleFromCard(card) {
  if (typeof card?.text !== "string" || typeof card?.title !== "string" ||
    typeof card?.url !== "string" || card.url.length > 2_000) return null;
  const listing = validateListingUrl(card.url);
  if (!listing.ok || listing.marketplace.id !== "MOBILE_DE") return null;

  const title = cleanText(card.title.slice(0, 250)).replace(/^Gesponsert\s+/i, "");
  const text = cleanText(card.text.slice(0, 2_500));
  const priceText = text.split(/\b(?:Finanzierung|Leasing|EZ|Erstzulassung)\b/i)[0];
  const amounts = [...priceText.matchAll(/(?:^|[^\d.,])(\d{1,3}(?:[. ]\d{3})+|\d{3,7})(?:,\d{2})?\s*€/g)]
    .filter((match) => !/^\s*\(?netto\b/i.test(priceText.slice(match.index + match[0].length)));
  const price = amounts.length === 1 ? toNumber(amounts[0][1]) : null;
  const registration = text.match(/\b(?:EZ|Erstzulassung)\s*:?\s*(\d{1,2}\/\d{4})\b/i);
  const mileage = text.match(/\b(\d{1,3}(?:[. ]\d{3})+|\d{1,7})\s*km\b/i);
  if (!price || !registration || !mileage || /€\s*(?:\/\s*Monat|mtl\.)/i.test(priceText)) return null;

  const { fields: identity } = parsePastedListing(title.replace(/^Škoda\b/i, "Skoda"));
  const specs = text.slice(registration.index, registration.index + 180);
  const powerKw = toNumber(specs.match(/\b(\d{2,4})\s*kW\b/i)?.[1]);
  const fuel = specs.match(/\b(Plug[- ]in[- ]Hybrid|Hybrid|Benzin|Diesel|Elektro|Autogas|Erdgas|Wasserstoff)\b/i)?.[1];
  const gearbox = text.match(/\b(Halbautomatik|Automatik|Schaltgetriebe|Handschalter|Schalter|DSG|S[- ]tronic)\b/i)?.[1];
  const sellerType = /privatanbieter|privatverkauf|privater anbieter|von privat/i.test(text)
    ? "PRIVATE"
    : /\bautohaus\b|\bsterne\b|\bhändler\b/i.test(text) ? "DEALER" : "UNKNOWN";
  const location = text.match(/\b(?:[A-Z]{1,2}-)?\d{5}\s+[A-ZÄÖÜ][\p{L}-]+/u)?.[0];
  const vehicle = createVehicle({
    source: "MOBILE_DE",
    listingId: listing.id,
    listingUrl: listing.url,
    title,
    make: identity.make,
    model: identity.model,
    variant: title,
    price,
    firstRegistration: registration[1],
    mileageKm: toNumber(mileage[1]),
    powerKw,
    fuel,
    gearbox,
    condition: detectConditionFromText(text),
    sellerType,
    location,
    country: location?.match(/^([A-Z]{1,2})-/)?.[1],
    extractedFrom: "browser-search",
  });
  return missingCoreFields(vehicle).length ? null : vehicle;
}

export function readMobileSearchResults(input) {
  if (input?.status !== "ok") {
    const blocked = input?.status === "blocked";
    const messages = {
      prepare: "Die mobile.de-Suche konnte nicht vorbereitet werden.",
      busy: "Im Browser läuft bereits eine mobile.de-Suche.",
      timeout: "Die mobile.de-Suchergebnisse wurden nicht rechtzeitig geladen.",
      redirect: "mobile.de hat die Suche auf eine andere Seite weitergeleitet.",
      cards: "mobile.de wurde geladen, aber die Angebotskarten konnten nicht gelesen werden.",
      browser: "Der Browser konnte die mobile.de-Suchergebnisse nicht lesen.",
      connection: "Die Browser-Erweiterung konnte die mobile.de-Suche nicht abschließen.",
    };
    return {
      ok: false,
      blocked,
      vehicles: [],
      error: blocked
        ? "mobile.de hat den Suchzugriff eingeschränkt. Die Analyse verwendet die übrigen Portale."
        : (typeof input?.reason === "string" && Object.hasOwn(messages, input.reason) ? messages[input.reason] : null) ||
          "mobile.de-Suchergebnisse konnten nicht eingelesen werden.",
    };
  }
  const cards = Array.isArray(input.cards) ? input.cards.slice(0, MAX_SEARCH_CARDS) : [];
  const vehicles = cards.map(vehicleFromCard).filter(Boolean);
  if (cards.length && !vehicles.length) {
    return { ok: false, vehicles, error: "mobile.de-Angebote gefunden, aber Preis oder Fahrzeugdaten konnten nicht sicher gelesen werden." };
  }
  return { ok: true, vehicles };
}
