/**
 * Source orchestration: resolve the pasted link into a vehicle, and collect
 * comparable listings from every source that is available.
 */

import { isSourceEnabled, POLICY } from "../config";
import { request } from "../http";
import { settleWithTimeout } from "../utils";
import { createVehicle } from "../vehicle";
import * as autoscout24 from "./autoscout24";
import * as mobilede from "./mobilede";
import * as kleinanzeigen from "./kleinanzeigen";
import {
  detectMarketplace,
  listingIdentity,
  mayRedirectToListing,
  validateListingUrl,
} from "./urls";

const SOURCES = {
  AUTOSCOUT24: autoscout24,
  MOBILE_DE: mobilede,
  KLEINANZEIGEN: kleinanzeigen,
};

/** Turns a failed fetch into the most useful sentence we can give the user. */
function buildResolveError(label, result) {
  const debug = result.debug || {};

  if (debug.browserUnavailable) {
    return `${label} lehnt einfache Server-Abrufe ab, deshalb wird ein echter Browser gebraucht – der ist aber nicht einsatzbereit: ${result.error || debug.browserError}`;
  }

  if (debug.browserTried && debug.browserError) {
    return `${label} konnte auch mit echtem Browser nicht geladen werden (${debug.browserError}). Ersatzweise den Anzeigentext unten einfügen.`;
  }

  if (result.blocked) {
    return `${label} hat den Abruf abgelehnt. Ersatzweise die Anzeige im Browser öffnen, mit Strg+A und Strg+C kopieren und unten einfügen – die Analyse läuft damit vollständig.`;
  }

  return (
    result.error ||
    `Die Anzeige bei ${label} konnte nicht gelesen werden. Anzeigentext unten einfügen – die Analyse läuft damit vollständig.`
  );
}

/**
 * Reads the vehicle behind the pasted link.
 * @returns {Promise<{ok:boolean,vehicle:object|null,error:string|null,marketplace:object|null}>}
 */
export async function resolveTarget(rawUrl) {
  let validation = validateListingUrl(rawUrl);

  // Share and shortened links carry no ad id. Follow the redirects once before
  // telling the user their link is wrong — usually it lands on the real ad.
  if (!validation.ok && mayRedirectToListing(rawUrl)) {
    const hop = await request(String(rawUrl).trim(), {
      label: "Weiterleitung",
      timeoutMs: 8_000,
      retries: 0,
    });
    if (hop.url && hop.url !== rawUrl) {
      const retried = validateListingUrl(hop.url);
      if (retried.ok) validation = retried;
    }
  }

  if (!validation.ok) {
    return {
      ok: false,
      vehicle: null,
      error: validation.error,
      marketplace: detectMarketplace(rawUrl),
      code: "INVALID_URL",
      canRetryManually: false,
    };
  }

  const source = SOURCES[validation.marketplace.id];
  const result = await source.fetchListing(validation.url);

  if (!result.ok) {
    const label = validation.marketplace.label;

    return {
      ok: false,
      vehicle: null,
      marketplace: validation.marketplace,
      // The link itself is fine — only reading the page failed. The caller can
      // still run the whole analysis if the user supplies the few key figures.
      code: "TARGET_UNREADABLE",
      canRetryManually: true,
      listingUrl: validation.url,
      debug: result.debug || null,
      // Message precedence matters: an actionable cause (for example "Chromium
      // is not installed") must never be replaced by the generic blocked text,
      // otherwise the one instruction that fixes the problem stays hidden.
      error: buildResolveError(label, result),
    };
  }

  return {
    ok: true,
    vehicle: result.vehicle,
    marketplace: validation.marketplace,
    error: null,
  };
}

/**
 * Builds a target vehicle from figures the user typed, for the case where the
 * portal will not hand out the ad. Everything downstream is unchanged: the
 * comparables, the market value and the calculation all still come from the
 * other portals.
 */
export function buildManualTarget(input, rawUrl) {
  const marketplace = detectMarketplace(rawUrl);
  const validation = validateListingUrl(rawUrl);

  return createVehicle({
    ...input,
    source: marketplace?.id || "UNKNOWN",
    sourceLevel: marketplace?.level || "RETAIL",
    listingId: validation.ok ? validation.id : null,
    listingUrl: validation.ok ? validation.url : String(rawUrl || "").trim() || null,
    extractedFrom: "manuell",
  });
}

/**
 * Queries every available source in parallel and returns the merged, de-duped
 * candidate pool together with a per-source report for diagnostics.
 */
export async function gatherComparables(target, { budgetMs = 20_000 } = {}) {
  const wanted = ["AUTOSCOUT24", "MOBILE_DE", "KLEINANZEIGEN"].filter(
    (id) => isSourceEnabled(id) && typeof SOURCES[id].searchComparables === "function",
  );

  const empty = { ok: false, vehicles: [], error: "Zeitlimit erreicht." };

  const settled = await Promise.all(
    wanted.map(async (id) => {
      const result = await settleWithTimeout(
        SOURCES[id].searchComparables(target, { limit: POLICY.perSourceLimit }),
        budgetMs,
        empty,
      );
      return { id, ...result };
    }),
  );

  const targetIdentity = target.listingUrl ? listingIdentity(target.listingUrl) : null;
  const seen = new Set(targetIdentity ? [targetIdentity] : []);
  const candidates = [];
  const report = [];

  for (const source of settled) {
    let kept = 0;
    for (const vehicle of source.vehicles || []) {
      const identity = vehicle.listingUrl
        ? listingIdentity(vehicle.listingUrl)
        : `${source.id}:${vehicle.listingId}`;
      if (!identity || seen.has(identity)) continue;
      seen.add(identity);
      candidates.push(vehicle);
      kept += 1;
    }

    report.push({
      source: source.id,
      found: (source.vehicles || []).length,
      used: kept,
      ok: Boolean(source.ok),
      skipped: Boolean(source.skipped),
      blocked: Boolean(source.blocked),
      error: source.error || null,
    });
  }

  return { candidates, report };
}

export { SOURCES };
