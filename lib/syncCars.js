/**
 * Copies our mobile.de ads into the website's stock (models/Car.js).
 *
 * - Every ad is matched by its mobile.de ad number, so a car keeps the same
 *   page link (/gebrauchtwagen/<id>) for as long as the ad is online.
 *   Cars saved before that number was stored are found by FIN, or by
 *   make/model/variant/mileage when the ad has no FIN.
 * - Ads that are no longer on mobile.de are removed from the website.
 * - If mobile.de answers with no ads at all (outage, wrong login), nothing
 *   is removed — the website keeps showing the last good stock.
 * - "Verkauft" set by the team is never overwritten.
 */

import { connectDB } from "./mongodb";
import Car from "../models/Car";
import { fetchMobileCars } from "./mobile";
import { inspectionFrom } from "./cars/format";

/** Fields copied from the ad as they are. */
const AD_FIELDS = [
  "make", "model", "modelDescription", "firstRegistration", "mileage", "power", "cubicCapacity",
  "gearbox", "fuel", "category", "climatisation", "airbag", "ambientLighting", "onBoardComputer",
  "paddleShifters", "usb", "driveType", "consumptions", "emissions", "seats", "doors", "emissionClass",
  "parkingAssistants", "manufacturerColorName", "exteriorColor", "interiorType", "interiorColor",
  "tintedWindows", "armRest", "heatedWindshield", "electricWindows", "electricTailgate",
  "electricExteriorMirrors", "foldingExteriorMirrors", "electricAdjustableSeats", "memorySeats",
  "leatherSteeringWheel", "panoramicGlassRoof", "sunroof", "keylessEntry", "electricHeatedSeats",
  "centralLocking", "headUpDisplay", "multifunctionalWheel", "powerAssistedSteering", "bluetooth",
  "cdPlayer", "handsFreePhoneSystem", "wirelessCharging", "navigationSystem", "voiceControl",
  "touchscreen", "radio", "alarmSystem", "abs", "distanceWarningSystem", "glareFreeHighBeam",
  "immobilizer", "esp", "highBeamAssist", "speedLimiter", "isofix", "lightSensor", "frontFogLights",
  "collisionAvoidance", "emergencyCallSystem", "automaticRainSensor", "tirePressureMonitoring",
  "laneDepartureWarning", "startStopSystem", "tractionControlSystem", "trafficSignRecognition",
  "daytimeRunningLamps", "headlightType", "bendingLightsType", "headlightWasherSystem",
  "summerTires", "winterTires", "alloyWheels", "sportPackage", "sportSeats",
  "numberOfPreviousOwners", "detailPageUrl",
];

/**
 * mobile.de writes line breaks as "\\" and bold as **…**. The breaks become
 * real new lines (older syncs deleted them and glued the lines together).
 */
function cleanDescription(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\\\\|\\/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

/** One ad → the fields stored for the website. */
export function carFromAd(ad, syncedAt) {
  const set = { syncedAt };
  for (const key of AD_FIELDS) {
    if (ad[key] !== undefined) set[key] = ad[key];
  }

  const description = cleanDescription(ad.description);
  const price = ad.price || {};
  const priceValue = Number(String(price.consumerPriceGross ?? "").replace(",", "."));

  Object.assign(set, {
    description,
    mobileAdId: ad.mobileAdId ? String(ad.mobileAdId) : null,
    mobileCreatedAt: toDate(ad.creationDate),
    mobileUpdatedAt: toDate(ad.modificationDate),
    images: (Array.isArray(ad.images) ? ad.images : [])
      .filter((image) => image?.ref)
      .slice(0, 30)
      .map((image) => ({ ref: image.ref, hash: image.hash || "" })),
    price: {
      consumerPriceGross: price.consumerPriceGross != null ? String(price.consumerPriceGross) : "",
      type: price.type || "",
      currency: price.currency || "EUR",
      vatRate: price.vatRate != null ? String(price.vatRate) : "",
    },
    priceValue: Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null,
    newHuAu: inspectionFrom(ad, description),
    fullServiceHistory: ad.fullServiceHistory ?? /Scheckheft\s*gepflegt/i.test(description),
    hasAllSeasonTires: Boolean(ad.allSeasonTires || /ganzjahresreifen|allwetterreifen/i.test(description)),
  });
  if (ad.vin) set.vin = String(ad.vin).trim().toUpperCase();
  return set;
}

/** How an ad finds the car it already is on the website. */
function matchFor(ad, set) {
  const legacy = { mobileAdId: null };
  const options = [];
  if (set.mobileAdId) options.push({ mobileAdId: set.mobileAdId });
  if (set.vin) options.push({ ...legacy, vin: set.vin });
  else options.push({ ...legacy, make: set.make, model: set.model, modelDescription: set.modelDescription, mileage: set.mileage });
  return options.length === 1 ? options[0] : { $or: options };
}

export const syncCars = async () => {
  await connectDB();
  const ads = await fetchMobileCars();
  const syncedAt = new Date();

  const usable = ads.filter((ad) => ad && ad.make && ad.model);
  if (!usable.length) {
    // Never empty the website because mobile.de returned nothing.
    return { fetched: ads.length, saved: 0, removed: 0, skipped: true };
  }

  // Save every ad and remember exactly which cars were saved. strict:false
  // keeps every field even if an outdated car model is still loaded.
  const keep = [];
  let withInspection = 0;
  for (const ad of usable) {
    const set = carFromAd(ad, syncedAt);
    if (set.newHuAu) withInspection += 1;
    try {
      const doc = await Car.findOneAndUpdate(matchFor(ad, set), { $set: set }, {
        upsert: true,
        new: true,
        strict: false,
        projection: { _id: 1 },
      }).lean();
      if (doc?._id) keep.push(doc._id);
    } catch (error) {
      console.error("mobile.de sync: ad not saved:", ad.mobileAdId, error?.message);
    }
  }

  // Only if every ad was saved do we know what is really gone from mobile.de.
  if (keep.length !== usable.length) {
    return {
      fetched: ads.length,
      saved: keep.length,
      removed: 0,
      skipped: false,
      warning: `${usable.length - keep.length} Anzeige(n) konnten nicht gespeichert werden – es wurde nichts entfernt.`,
      withInspection,
    };
  }

  const gone = await Car.countDocuments({ _id: { $nin: keep } });
  const total = gone + keep.length;
  // A sync never removes more than half of the stock at once; that would
  // rather mean a problem with the mobile.de answer than a sale.
  if (gone >= 3 && gone > total / 2) {
    return {
      fetched: ads.length,
      saved: keep.length,
      removed: 0,
      skipped: false,
      warning: `${gone} Fahrzeuge fehlen bei mobile.de – zur Sicherheit wurde nichts entfernt.`,
      withInspection,
    };
  }

  const removed = gone ? await Car.deleteMany({ _id: { $nin: keep } }) : { deletedCount: 0 };
  return { fetched: ads.length, saved: keep.length, removed: removed.deletedCount || 0, skipped: false, withInspection };
};
