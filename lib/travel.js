// Driving time from the company to an address – OpenStreetMap (Nominatim) + OSRM, both free.
// Results are cached in the database (GeoCache), the services are asked at most once per address.
// Server only.

import { connectDB as dbConnect } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";
import GeoCache from "@/models/GeoCache";
import { COMPANY } from "@/lib/company";

export const DEFAULT_LOCATION = `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`;
const AGENT = "AutogalerieJuelich-Portal/1.0 (Haendlerportal)";
const MISSING_RETRY_MS = 7 * 24 * 3600 * 1000;

const keyOf = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

/** company location (saved setting, otherwise the address in lib/company.js) */
export async function getCompanyLocation() {
  await dbConnect();
  const doc = await AppSetting.findById("companyLocation").lean();
  return String(doc?.value || "").trim() || DEFAULT_LOCATION;
}

export async function setCompanyLocation(value, by = "") {
  await dbConnect();
  const v = String(value || "").trim().slice(0, 200);
  await AppSetting.updateOne({ _id: "companyLocation" }, { $set: { value: v, updatedBy: by } }, { upsert: true });
  return v || DEFAULT_LOCATION;
}

// Nominatim allows one request per second – queue the calls
let queue = Promise.resolve();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** @param {Record<string,string>} params  q=… or structured city / postalcode / street */
function nominatim(params) {
  const run = queue.then(async () => {
    const qs = new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "de", ...params });
    const url = `https://nominatim.openstreetmap.org/search?${qs}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": AGENT, "Accept-Language": "de" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      const data = res.ok ? await res.json() : [];
      const hit = Array.isArray(data) ? data[0] : null;
      return hit ? { lat: Number(hit.lat), lon: Number(hit.lon) } : null;
    } catch {
      return undefined; // service not reachable – do not cache
    } finally {
      await wait(1100);
    }
  });
  queue = run.catch(() => {});
  return run;
}

/**
 * "Kölnstr. 12, 52351 Düren" → { street, zip, city }
 * also the listing formats "57250 Nordrhein-Westfalen - Netphen" (Kleinanzeigen) and "52349 Düren"
 */
export function splitAddress(address) {
  const parts = String(address || "")
    .replace(/,?\s*(deutschland|germany)\s*$/i, "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const townPart = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "";
  const street = parts.length > 1 ? parts[0] : "";
  const m = townPart.match(/^(\d{5})\s*(.*)$/);
  const zip = m ? m[1] : "";
  let city = (m ? m[2] : townPart).trim();
  if (city.includes(" - ")) city = city.split(" - ").pop().trim(); // "Bundesland - Ort"
  return { street, zip, city };
}

/** address → { lat, lon } | null – with a street exactly, otherwise the town centre (like Google Maps) */
export async function geocode(address) {
  const key = `geo2:${keyOf(address)}`;
  if (key === "geo2:") return null;
  const cached = await GeoCache.findById(key).lean();
  if (cached?.lat != null) return { lat: cached.lat, lon: cached.lon };
  if (cached?.missing && Date.now() - new Date(cached.updatedAt).getTime() < MISSING_RETRY_MS) return null;

  const { street, zip, city } = splitAddress(address);
  const tries = [];
  if (street) tries.push({ q: [street, [zip, city].filter(Boolean).join(" ")].filter(Boolean).join(", ") });
  if (city && zip) tries.push({ city, postalcode: zip });
  if (city) tries.push({ city });
  if (zip) tries.push({ postalcode: zip });
  if (!tries.length) return null;

  let hit = null;
  for (const t of tries) {
    hit = await nominatim(t);
    if (hit !== null) break; // found (or service not reachable)
  }
  if (hit === undefined) return null;
  await GeoCache.updateOne({ _id: key }, { $set: hit ? { lat: hit.lat, lon: hit.lon, missing: false } : { missing: true } }, { upsert: true });
  return hit;
}

/** driving time between two addresses → { minutes, km } | null */
export async function drivingTime(from, to) {
  const key = `route2:${keyOf(from)}|${keyOf(to)}`;
  const cached = await GeoCache.findById(key).lean();
  if (cached?.minutes != null) return { minutes: cached.minutes, km: cached.km };
  const [a, b] = [await geocode(from), await geocode(to)];
  if (!a || !b) return null;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
    const res = await fetch(url, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    const data = res.ok ? await res.json() : null;
    const r = data?.routes?.[0];
    if (!r) return null;
    const out = { minutes: Math.max(1, Math.round(r.duration / 60)), km: Math.round(r.distance / 100) / 10 };
    await GeoCache.updateOne({ _id: key }, { $set: out }, { upsert: true });
    return out;
  } catch {
    return null;
  }
}

/** coordinates → "Straße Nr., PLZ Ort" (and the exact point is remembered for that address) */
export async function reverseGeocode(lat, lon) {
  const run = queue.then(async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lon}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": AGENT, "Accept-Language": "de" }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    } finally {
      await wait(1100);
    }
  });
  queue = run.catch(() => {});
  const data = await run;
  const a = data?.address;
  if (!a) return "";
  const street = [a.road || a.pedestrian || a.footway || "", a.house_number || ""].join(" ").trim();
  const town = [a.postcode || "", a.city || a.town || a.village || a.municipality || ""].join(" ").trim();
  const address = [street, town].filter(Boolean).join(", ");
  if (address) {
    await dbConnect();
    await GeoCache.updateOne({ _id: `geo2:${keyOf(address)}` }, { $set: { lat: Number(lat), lon: Number(lon), missing: false } }, { upsert: true });
  }
  return address;
}
