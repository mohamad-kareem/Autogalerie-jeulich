/**
 * The facts a buyer wants before opening an ad: HU, accident status, owners,
 * service book, the equipment that sells, and anything in the seller's text
 * that should stop him ("Motorschaden", "Export", "Bastlerfahrzeug").
 *
 * The result lists of the portals carry none of this, so each new car's ad
 * page is read once — with the same readers the Marktanalyse uses — and boiled
 * down to a handful of short labels for the card.
 */

import { analyzeEquipment } from "../market/equipment";
import { inspectionStatus, usageProfile } from "../market/insights";
import { fetchListing as fetchAutoScout } from "../market/sources/autoscout24";
import { fetchListing as fetchKleinanzeigen } from "../market/sources/kleinanzeigen";
import { timingBeltStatus, BELT_ATTENTION } from "../market/timingBelt";

/** Only these hosts are ever fetched — the endpoint takes a URL from the page. */
export function detailSource(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl));
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (/(^|\.)autoscout24\.de$/.test(host) && url.pathname.startsWith("/angebote/")) return "AUTOSCOUT24";
  if (/(^|\.)kleinanzeigen\.de$/.test(host) && url.pathname.startsWith("/s-anzeige/")) return "KLEINANZEIGEN";
  return null;
}

// Words in the seller's own text that change the whole deal. Each needs to be
// a real statement, not "unfallfrei" or "kein Motorschaden".
const RED_FLAGS = [
  { label: "Motorschaden", pattern: /(?<!kein(?:en)?\s)motor(?:schaden|\s*defekt)/i },
  { label: "Getriebeschaden", pattern: /(?<!kein(?:en)?\s)getriebe(?:schaden|\s*defekt)/i },
  { label: "Export / Händler", pattern: /\bexport\b|nur\s+(?:für\s+)?(?:händler|gewerbe)/i },
  { label: "Bastlerfahrzeug", pattern: /bastler|an\s+bastler|für\s+bastler/i },
  { label: "Nicht fahrbereit", pattern: /nicht\s+fahrbereit|springt\s+nicht\s+an|nicht\s+fahrtüchtig/i },
  { label: "Ohne TÜV", pattern: /ohne\s+(?:tüv|hu)\b|kein(?:en)?\s+(?:tüv|hu)\b|tüv\s+abgelaufen/i },
  { label: "Hagelschaden", pattern: /(?<!kein(?:en)?\s)hagel(?:schaden|schäden)/i },
  { label: "Wasserschaden", pattern: /(?<!kein(?:en)?\s)wasserschaden|überschwemm/i },
  { label: "Ölverlust", pattern: /(?<!kein(?:en)?\s)öl(?:verlust|verbrauch\s+hoch)/i },
];

const GOOD_SIGNS = [
  { label: "1. Hand", pattern: /\b1\.\s*hand\b|erste\s+hand|erstbesitz/i },
  { label: "Nichtraucher", pattern: /nichtraucher/i },
  { label: "Zahnriemen neu", pattern: /zahnriemen[^.;]{0,30}(?:neu|gewechselt|erneuert)/i },
  { label: "Garantie", pattern: /\bgarantie\b(?!\s*ausgeschlossen)/i },
];

const HU_TONES = { NEW: "good", OK: "good", SOON: "warn", DUE: "bad", EXPIRED: "bad" };

/**
 * A canonical vehicle (createVehicle) → the card facts.
 * Pure, so it is tested without the network and reused for mobile.de, whose
 * search API already delivers these fields.
 */
export function summarizeVehicle(vehicle) {
  const text = `${vehicle.title || ""} ${vehicle.description || ""}`;

  const inspection = inspectionStatus(vehicle);
  const hu = inspection.available
    ? {
        label: inspection.status === "NEW" ? "HU neu" : `HU ${vehicle.tuvUntil}`,
        note: inspection.status === "EXPIRED" ? "abgelaufen" : inspection.status === "DUE" ? "bald fällig" : null,
        tone: HU_TONES[inspection.status] || "neutral",
      }
    : { label: "HU unbekannt", note: null, tone: "unknown" };

  const conditionMap = {
    ACCIDENT_FREE: { label: "Unfallfrei", tone: "good" },
    REPAIRED_DAMAGE: { label: "Vorschaden (repariert)", tone: "warn" },
    DAMAGED: { label: "Unfall / Schaden", tone: "bad" },
  };
  const condition = conditionMap[vehicle.condition] || { label: "Unfall unbekannt", tone: "unknown" };

  const owners = Number.isFinite(vehicle.ownerCount)
    ? { label: `${vehicle.ownerCount} Halter`, tone: vehicle.ownerCount >= 3 ? "warn" : "good" }
    : null;

  const redFlags = RED_FLAGS.filter((flag) => flag.pattern.test(text)).map((flag) => flag.label);
  const goodSigns = GOOD_SIGNS.filter((sign) => sign.pattern.test(text)).map((sign) => sign.label);
  if (vehicle.serviceHistory === "YES") goodSigns.unshift("Scheckheft");
  if (vehicle.nonSmoking === true && !goodSigns.includes("Nichtraucher")) goodSigns.push("Nichtraucher");
  if (vehicle.warranty && !goodSigns.includes("Garantie")) goodSigns.push("Garantie");

  const belt = timingBeltStatus(vehicle);
  const usage = usageProfile(vehicle);
  const equipment = analyzeEquipment(vehicle);

  return {
    hu,
    condition,
    owners,
    goodSigns: [...new Set(goodSigns)].slice(0, 4),
    redFlags: [...new Set(redFlags)].slice(0, 4),
    belt: belt.available && BELT_ATTENTION.has(belt.status)
      ? { label: belt.status === "OVERDUE" ? "Zahnriemen fällig" : belt.status === "DUE_SOON" ? "Zahnriemen bald fällig" : "Zahnriemen prüfen", tone: belt.status === "OVERDUE" ? "bad" : "warn" }
      : null,
    usage: usage.available ? { label: `${usage.perYear.toLocaleString("de-DE")} km/Jahr`, level: usage.level } : null,
    equipment: equipment.highlights.slice(0, 4),
    equipmentLevel: equipment.level !== "UNKNOWN" ? equipment.levelLabel : null,
    sellerType: vehicle.sellerType || "UNKNOWN",
    sellerName: vehicle.sellerName || null,
    negotiable: Boolean(vehicle.negotiable),
    color: vehicle.color || null,
    snippet: vehicle.description ? vehicle.description.replace(/\s+/g, " ").slice(0, 160) : null,
  };
}

// Several tabs and devices ask about the same new car; its page is read once.
const cache = new Map();
const CACHE_MS = 30 * 60_000;

export async function fetchDetails(rawUrl) {
  const source = detailSource(rawUrl);
  if (!source) return { ok: false, error: "Nur Links zu AutoScout24- und Kleinanzeigen-Anzeigen." };

  const hit = cache.get(rawUrl);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  const fetcher = source === "AUTOSCOUT24" ? fetchAutoScout : fetchKleinanzeigen;
  const read = await fetcher(rawUrl);
  const result = read.ok && read.vehicle
    ? { ok: true, source, details: summarizeVehicle(read.vehicle) }
    : { ok: false, source, error: read.error || "Anzeige nicht lesbar.", blocked: Boolean(read.blocked) };

  if (result.ok) {
    cache.set(rawUrl, { at: Date.now(), result });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
  }
  return result;
}
