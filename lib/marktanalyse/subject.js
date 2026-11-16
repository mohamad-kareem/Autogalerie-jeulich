/**
 * Marktanalyse – die Anzeige lesen (nur Server).
 *
 * Bringt die Anzeige eines der drei Portale in EINE Form, mit der das Gehirn
 * rechnet. Gelesen wird das HTML, das die Browser-Erweiterung liefert.
 */

import { parseListingPage as parseAutoScoutListing } from "@/lib/portals/autoscout24";
import { parseListingPage as parseKleinanzeigenListing } from "@/lib/portals/kleinanzeigen";
import { inspectionExpiryFromText, registrationToMonths, monthsToRegistration } from "@/lib/portals/utils";
import { htmlToLines, parseListingHtml } from "@/lib/ankauf/listingParser";
import { parseMobileListing } from "./portalPages.js";
import { listingIdOf, portalOf } from "./search.js";
import { euroClass, fuelKey, gearKey, monthsLabel, ratingLevel, regMonths, sellerKey, toInt } from "./text.js";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim() || null;

function tuvLabel(value) {
  const text = String(value || "");
  if (!text) return null;
  if (/neu/i.test(text)) return "neu";
  const months = registrationToMonths(text) ?? (/^\d{6}$/.test(text) ? regMonths(text) : null);
  return Number.isFinite(months) ? monthsToRegistration(months) : null;
}

const ACCIDENT = { ACCIDENT_FREE: "NONE", REPAIRED_DAMAGE: "REPAIRED", DAMAGED: "DAMAGED", UNKNOWN: "UNKNOWN" };

/** Fahrzeug aus lib/portals (AutoScout24, Kleinanzeigen). */
function fromPortalVehicle(vehicle) {
  if (!vehicle) return null;
  return {
    id: vehicle.listingId, title: vehicle.title, make: vehicle.make, model: vehicle.model, variant: vehicle.variant,
    price: vehicle.price, negotiable: vehicle.negotiable,
    firstRegistration: vehicle.firstRegistration, regMonths: vehicle.registrationMonths, mileageKm: vehicle.mileageKm,
    powerPs: vehicle.powerPs, ccm: vehicle.displacementCcm, fuel: vehicle.fuel, gearbox: vehicle.gearbox === "SEMI_AUTOMATIC" ? "AUTOMATIC" : vehicle.gearbox,
    body: vehicle.bodyType, color: vehicle.color, owners: vehicle.ownerCount, tuv: tuvLabel(vehicle.tuvUntil),
    accident: ACCIDENT[vehicle.condition] || "UNKNOWN", conditionText: vehicle.damageNote,
    serviceHistory: vehicle.serviceHistory, sellerType: vehicle.sellerType, sellerName: vehicle.sellerName, location: vehicle.location,
    listedAt: vehicle.listedAt, equipment: vehicle.equipment, description: vehicle.description, image: vehicle.images?.[0] || null,
  };
}

/** Der Beschreibungstext aus dem sichtbaren Seitentext – wenn die Portaldaten keinen liefern. */
function descriptionFromLines(html) {
  const lines = htmlToLines(html);
  const start = lines.findIndex((line) => /^(fahrzeug)?beschreibung( laut anbieter)?$/i.test(line));
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^(anbieter|h(ä|ae)ndler|kontakt|impressum|standort|finanzierung|ähnliche|weitere (angebote|fahrzeuge)|anzeige melden|nachricht schreiben)\b/i.test(line));
  return rest.slice(0, end < 0 ? 80 : Math.min(end, 80)).join("\n").slice(0, 6000);
}

/** Kleinanzeigen: Beschreibung mit Zeilenumbrüchen (seit dem neuen Layout ein <div> statt <p>). */
function kleinanzeigenDescription(html) {
  const raw = html.match(/id=["']viewad-description-text["'][^>]*>([\s\S]{0,20000}?)<\/(?:p|div)>/i)?.[1];
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * @returns { ok, subject, error }
 */
export function readSubject(html, url) {
  const source = portalOf(url);
  if (!source) return { ok: false, subject: null, error: "Bitte einen Link von mobile.de, AutoScout24 oder Kleinanzeigen verwenden." };
  const page = String(html || "");

  let primary = null;
  try {
    if (source === "MOBILE_DE") primary = parseMobileListing(page, url);
    else if (source === "AUTOSCOUT24") primary = fromPortalVehicle(parseAutoScoutListing(page, url)?.vehicle);
    else primary = fromPortalVehicle(parseKleinanzeigenListing(page, url)?.vehicle);
  } catch (error) {
    console.warn("Marktanalyse: Anzeige nicht lesbar", error?.message);
  }
  primary = primary || {};

  // Zweite Meinung: der allgemeine Leser aus "Ankauf bestätigen" füllt Lücken.
  let general = {};
  try {
    general = parseListingHtml(page, url) || {};
  } catch {
    general = {};
  }

  const firstRegistration = clean(primary.firstRegistration) || clean(general.firstRegistration);
  const months = Number.isFinite(primary.regMonths) ? primary.regMonths : regMonths(firstRegistration);
  const description = (source === "KLEINANZEIGEN" && kleinanzeigenDescription(page)) ||
    (clean(primary.description) ? String(primary.description).trim() : descriptionFromLines(page));
  const accident = primary.accident && primary.accident !== "UNKNOWN" ? primary.accident
    : /unfallfrei/i.test(general.accidentStatus || general.condition || "") ? "NONE"
      : /unfall|besch(ä|ae)digt/i.test(general.accidentStatus || "") ? "DAMAGED" : "UNKNOWN";

  const subject = {
    source,
    url,
    id: clean(primary.id) || listingIdOf(url),
    title: clean(primary.title) || clean(general.name),
    make: clean(primary.make) || clean(general.brand),
    model: clean(primary.model) || clean(general.model),
    variant: clean(primary.variant),
    price: toInt(primary.price) ?? toInt(general.adPrice),
    negotiable: Boolean(primary.negotiable),
    firstRegistration: Number.isFinite(months) ? monthsLabel(months) : firstRegistration,
    regMonths: Number.isFinite(months) ? months : null,
    mileageKm: toInt(primary.mileageKm) ?? toInt(general.mileage),
    powerPs: toInt(primary.powerPs) ?? toInt(general.powerPs),
    ccm: toInt(primary.ccm) ?? toInt(general.displacement),
    fuel: fuelKey(primary.fuel) || fuelKey(general.fuel),
    gearbox: gearKey(primary.gearbox) || gearKey(general.gearbox),
    body: clean(primary.body) || clean(general.bodyType),
    color: clean(primary.color) || clean(general.color),
    owners: toInt(primary.owners) ?? toInt(general.owners),
    tuv: tuvLabel(primary.tuv) || tuvLabel(general.tuevUntil) || inspectionExpiryFromText(description),
    accident,
    conditionText: clean(primary.conditionText),
    countryVersion: clean(primary.countryVersion),
    serviceHistory: primary.serviceHistory === "YES" || /^scheckheftgepflegt$/i.test(general.serviceHistory || "") ? "YES"
      : primary.serviceHistory === "NO" ? "NO" : "UNKNOWN",
    sellerType: primary.sellerType && primary.sellerType !== "UNKNOWN" ? primary.sellerType : sellerKey(general.seller),
    sellerName: clean(primary.sellerName),
    location: clean(primary.location) || clean(general.location),
    listedAt: primary.listedAt || null,
    equipment: Array.isArray(primary.equipment) ? primary.equipment.slice(0, 120) : [],
    description: description.slice(0, 6000),
    image: clean(primary.image) || clean(general.image),
    mobile: primary.mobile || null,
    // Preisbewertung des Portals (1 = sehr gut … 5 = hoch), alter Preis, Schadstoffklasse (Euro 1–7)
    rating: primary.rating ?? ratingLevel(page.match(/"priceLabel":"([a-z-]+)"/)?.[1]),
    oldPrice: toInt(primary.oldPrice),
    emission: primary.emission ?? euroClass(general.emissionClass),
    // Generation laut AutoScout24: steht im Link ("…ge8va4632…") und in den Seitendaten.
    as24Gen: source === "AUTOSCOUT24"
      ? toInt(String(url).match(/cat_ma\d+gr\d+ge(\d+)/)?.[1]) ?? toInt(page.match(/generation_id:(\d+)/)?.[1])
      : null,
  };
  if (subject.owners !== null && subject.owners > 15) subject.owners = null;
  return { ok: true, subject, error: null };
}
