/**
 * Abholkosten — what it costs to go and collect the vehicle.
 *
 * This is the only cost the calculation carries by default. Everything is
 * measured, never estimated: the seller's location is geocoded, a real driving
 * route from Jülich is requested, and the trip is priced at the driver's hourly
 * rate plus fuel for the kilometres actually driven.
 *
 * If the location cannot be determined, no distance is invented — the caller
 * is told to ask the dealer for the postcode.
 *
 * Services used (both free, no key): Nominatim for geocoding and OSRM for
 * routing. Results are cached, because a postcode's coordinates never change
 * and the same route gets requested repeatedly.
 */

import { requestJson } from "./http";
import { cleanText, round } from "./utils";

/** Where the dealer starts from. Overridable, in case the yard moves. */
const ORIGIN = {
  label: process.env.PICKUP_ORIGIN_LABEL || "Jülich",
  latitude: Number(process.env.PICKUP_ORIGIN_LAT) || 50.9225,
  longitude: Number(process.env.PICKUP_ORIGIN_LON) || 6.3611,
};

/** Hourly rate for whoever collects the car. */
export const DRIVER_HOURLY_RATE = Number(process.env.PICKUP_HOURLY_RATE) || 12;

/**
 * Fuel is worked out from the distance actually driven, not a flat sum.
 *
 * Only the way home burns fuel: the collector travels out by train and drives
 * the car back, so the return leg is one way. When someone drives him out
 * instead, both legs count.
 *
 * Deliberately approximate — a mid-size used car at 8 l/100 km and a pump price
 * of 1,75 €/l, both adjustable.
 */
export const FUEL_LITRES_PER_100KM = Number(process.env.PICKUP_FUEL_LITRES) || 8;
export const FUEL_PRICE_PER_LITRE = Number(process.env.PICKUP_FUEL_PRICE) || 1.75;

export function fuelCostFor(kilometres) {
  if (!Number.isFinite(kilometres) || kilometres <= 0) return 0;
  const litres = (kilometres / 100) * FUEL_LITRES_PER_100KM;
  // Rounded to 5 € — this is an estimate, not an invoice.
  return Math.max(5, Math.round((litres * FUEL_PRICE_PER_LITRE) / 5) * 5);
}

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OSRM = "https://router.project-osrm.org/route/v1/driving";

// A postcode's coordinates do not change, so cache for the process lifetime.
const geocodeCache = new Map();
const routeCache = new Map();

const USER_AGENT = "Autogalerie-Marktanalyse/1.0 (Ankaufsbewertung)";

/** Pulls a German postcode out of a free-form location string. */
export function extractPostcode(value) {
  const match = cleanText(value).match(/\b(\d{5})\b/);
  return match ? match[1] : null;
}

/**
 * Turns "52428 Jülich" or "Köln" into coordinates.
 * @returns {Promise<{latitude:number,longitude:number,label:string}|null>}
 */
export async function geocode(rawLocation) {
  const query = cleanText(rawLocation);
  if (!query || query.length < 2) return null;

  const key = query.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  const parameters = new URLSearchParams({
    q: query,
    format: "json",
    countrycodes: "de",
    limit: "1",
  });

  const result = await requestJson(`${NOMINATIM}?${parameters.toString()}`, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "de" },
    label: "Geocoding",
    timeoutMs: 8_000,
    retries: 1,
  });

  const first = Array.isArray(result.data) ? result.data[0] : null;
  const coordinates = first
    ? {
        latitude: Number(first.lat),
        longitude: Number(first.lon),
        label: cleanText(first.display_name).split(",").slice(0, 2).join(",").trim(),
      }
    : null;

  geocodeCache.set(key, coordinates);
  return coordinates;
}

/**
 * One-way driving route between two points.
 * @returns {Promise<{distanceKm:number,minutes:number}|null>}
 */
export async function route(from, to) {
  const key = `${from.latitude},${from.longitude}->${to.latitude},${to.longitude}`;
  if (routeCache.has(key)) return routeCache.get(key);

  const path = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const result = await requestJson(`${OSRM}/${path}?overview=false`, {
    headers: { "User-Agent": USER_AGENT },
    label: "Routenberechnung",
    timeoutMs: 10_000,
    retries: 1,
  });

  const leg = result.data?.routes?.[0];
  const value =
    leg && Number.isFinite(leg.distance) && Number.isFinite(leg.duration)
      ? { distanceKm: leg.distance / 1_000, minutes: leg.duration / 60 }
      : null;

  routeCache.set(key, value);
  return value;
}

/** Formats minutes as the "2 Std. 15 Min." a dispatcher expects. */
export function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return "–";
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} Min.`;
  return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
}

/**
 * How the collector gets to the car. The return leg is always the car itself.
 *
 *   TRAIN  the normal case: he takes the train out and drives the car back
 *   CAR    someone drives him out, so both legs are driving time
 */
export const INBOUND_MODES = { TRAIN: "TRAIN", CAR: "CAR" };

/**
 * Rail journeys run longer than the same trip by road — more stops, changes and
 * waiting. Measured against the route this dealer quoted (Jülich–Rheine: about
 * 2 h 15 by car, about 4 h 30 by train) the factor is close to 1.9. It is only
 * an estimate, so the UI lets the actual time be typed over it.
 */
export const TRAIN_TIME_FACTOR = Number(process.env.PICKUP_TRAIN_FACTOR) || 1.9;

/**
 * Time spent at the seller: looking the car over, the test drive, paperwork and
 * handover. Paid like every other hour of the trip.
 */
export const ON_SITE_MINUTES = Number(process.env.PICKUP_ON_SITE_MINUTES) || 60;

/**
 * The full pickup calculation for one vehicle.
 *
 * @param {object} options
 * @param {string|null} options.location   seller location from the ad
 * @param {string|null} options.postcode   supplied by the user when the ad has none
 * @param {string} [options.inboundMode]   TRAIN (default) or CAR
 * @param {number} [options.inboundMinutes] real journey time, overriding the estimate
 * @param {number} [options.onSiteMinutes]  time at the seller, default one hour
 * @param {number} [options.ticketCost]    train fare, entered by the user
 * @returns {Promise<object>} always resolves; `available:false` when the
 *   location is unknown, and then `needsLocation` tells the UI to ask.
 */
export async function computePickupCost({
  location = null,
  postcode = null,
  inboundMode = INBOUND_MODES.TRAIN,
  inboundMinutes = null,
  onSiteMinutes = ON_SITE_MINUTES,
  ticketCost = 0,
  fuelCost = null,
} = {}) {
  const onSite = Math.max(0, Number(onSiteMinutes) || 0);
  const fare = Math.max(0, Math.round(Number(ticketCost) || 0));

  const empty = {
    available: false,
    needsLocation: true,
    origin: ORIGIN.label,
    destination: null,
    oneWayKm: null,
    roundTripKm: null,
    driveMinutes: null,
    inboundMode,
    inboundMinutes: null,
    inboundEstimated: false,
    returnMinutes: null,
    onSiteMinutes: onSite,
    totalMinutes: null,
    totalHours: null,
    hourlyRate: DRIVER_HOURLY_RATE,
    labourCost: null,
    fuelCost: null,
    fuelLitresPer100Km: FUEL_LITRES_PER_100KM,
    fuelPricePerLitre: FUEL_PRICE_PER_LITRE,
    fuelKm: null,
    ticketCost: fare,
    totalCost: null,
    note: "Standort des Fahrzeugs unbekannt – bitte Postleitzahl eintragen.",
  };

  // A postcode typed by the user beats whatever the ad said.
  const query = cleanText(postcode) || cleanText(location);
  if (!query) return empty;

  // Prefer the postcode inside a location string: "52428 Jülich" geocodes
  // more reliably as a postcode than as a free-text place name.
  const code = extractPostcode(query);
  const target = await geocode(code ? `${code}, Deutschland` : `${query}, Deutschland`);

  if (!target) {
    return {
      ...empty,
      note: `Standort "${query}" konnte nicht zugeordnet werden – bitte Postleitzahl eintragen.`,
    };
  }

  const leg = await route(ORIGIN, target);

  if (!leg) {
    return {
      ...empty,
      destination: target.label,
      note: "Route konnte nicht berechnet werden – bitte später erneut versuchen.",
    };
  }

  // The car is driven home in every case; that leg comes from the route.
  const returnMinutes = leg.minutes;

  // Getting there: a typed-in time wins, otherwise train is estimated from the
  // driving time and "by car" simply is the driving time.
  const supplied = Number(inboundMinutes);
  const hasSupplied = Number.isFinite(supplied) && supplied > 0;

  const estimatedInbound =
    inboundMode === INBOUND_MODES.CAR
      ? leg.minutes
      : leg.minutes * TRAIN_TIME_FACTOR;

  const outbound = hasSupplied ? supplied : estimatedInbound;

  // Out, an hour with the seller, then the drive home — all of it paid time.
  // Only the driven kilometres cost fuel.
  const fuelKm =
    inboundMode === INBOUND_MODES.CAR ? leg.distanceKm * 2 : leg.distanceKm;
  const supplierFuel = Number(fuelCost);
  const fuel =
    Number.isFinite(supplierFuel) && supplierFuel >= 0
      ? Math.round(supplierFuel)
      : fuelCostFor(fuelKm);

  // Out, an hour with the seller, then the drive home — all of it paid time.
  const totalMinutes = outbound + onSite + returnMinutes;
  const totalHours = totalMinutes / 60;
  const labourCost = Math.round(totalHours * DRIVER_HOURLY_RATE);

  return {
    available: true,
    needsLocation: false,

    origin: ORIGIN.label,
    destination: target.label,

    oneWayKm: round(leg.distanceKm, 0),
    roundTripKm: round(leg.distanceKm * 2, 0),
    driveMinutes: Math.round(leg.minutes),

    inboundMode,
    inboundMinutes: Math.round(outbound),
    inboundEstimated: !hasSupplied && inboundMode === INBOUND_MODES.TRAIN,
    returnMinutes: Math.round(returnMinutes),
    onSiteMinutes: onSite,
    totalMinutes: Math.round(totalMinutes),
    totalHours: round(totalHours, 1),

    hourlyRate: DRIVER_HOURLY_RATE,
    labourCost,

    // Fuel for the kilometres actually driven. The outbound train fare is a
    // separate line and only counts when the user enters it.
    fuelKm: round(fuelKm, 0),
    fuelLitresPer100Km: FUEL_LITRES_PER_100KM,
    fuelPricePerLitre: FUEL_PRICE_PER_LITRE,
    fuelCost: fuel,
    ticketCost: fare,
    totalCost: labourCost + fuel + fare,

    note: null,
  };
}
