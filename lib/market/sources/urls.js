/**
 * Marketplace URL recognition: which site a link belongs to, whether it points
 * at a single ad, and a stable identity used to de-duplicate listings.
 */

import { MARKETPLACES } from "../config";
import { normalizeText } from "../utils";

const TRACKING_PARAMETERS = new Set([
  "source",
  "position",
  "ref",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ipc",
  "ipl",
  "ap_tier",
  "action",
  "cid",
  "gclid",
  "fbclid",
  "searchId",
  "sortOption",
  "lang",
  "top",
  "isSearchRequest",
]);

export function detectMarketplace(rawUrl) {
  try {
    const hostname = new URL(String(rawUrl).trim())
      .hostname.toLowerCase()
      .replace(/^www\./, "");

    return (
      Object.values(MARKETPLACES).find((marketplace) =>
        marketplace.hosts.some(
          (host) =>
            hostname === host.replace(/^www\./, "") ||
            hostname.endsWith(`.${host.replace(/^www\./, "")}`),
        ),
      ) || null
    );
  } catch {
    return null;
  }
}

/**
 * Parameters worth keeping, per portal. An allowlist rather than a denylist:
 * mobile.de ad links arrive carrying the whole search context
 * (`ms`, `s`, `vc`, `dam`, `sb`, `od`, `refId`), and a request for that URL is
 * answered very differently from a request for the bare ad. Only `id`
 * identifies the vehicle, so only `id` is kept.
 */
const KEEP_PARAMETERS = {
  MOBILE_DE: new Set(["id"]),
  AUTOSCOUT24: new Set([]),
  KLEINANZEIGEN: new Set([]),
};

export function stripTracking(rawUrl) {
  try {
    const url = new URL(String(rawUrl).trim());
    const marketplace = detectMarketplace(url.toString());
    const keep = marketplace ? KEEP_PARAMETERS[marketplace.id] : null;

    for (const parameter of [...url.searchParams.keys()]) {
      if (keep) {
        if (!keep.has(parameter)) url.searchParams.delete(parameter);
      } else if (TRACKING_PARAMETERS.has(parameter)) {
        url.searchParams.delete(parameter);
      }
    }

    url.hash = "";
    return url.toString();
  } catch {
    return String(rawUrl || "").trim();
  }
}

/**
 * The shortest URL that still identifies the ad — what we actually request.
 * For mobile.de that is the canonical details link, which the portal serves
 * far more reliably than a link dragged out of a search result page.
 */
export function canonicalListingUrl(rawUrl) {
  const marketplace = detectMarketplace(rawUrl);
  const id = listingId(rawUrl);

  if (marketplace?.id === "MOBILE_DE" && id) {
    return `https://suchen.mobile.de/fahrzeuge/details.html?id=${id}`;
  }

  return stripTracking(rawUrl);
}

/** The ad id as the marketplace knows it, or null for non-ad URLs. */
export function listingId(rawUrl) {
  const marketplace = detectMarketplace(rawUrl);
  if (!marketplace) return null;

  let url;
  try {
    url = new URL(String(rawUrl).trim());
  } catch {
    return null;
  }

  const pathname = url.pathname;

  if (marketplace.id === "MOBILE_DE") {
    // An explicit id parameter is unambiguous, so accept it generously.
    const queryId = url.searchParams.get("id");
    if (queryId && /^\d{3,}$/.test(queryId)) return queryId;
    // /auto-inserat/vw-golf/412345678.html  ·  /fahrzeuge/412345678
    const pathId = pathname.match(/(\d{3,})(?:\.html?)?\/?$/);
    if (pathId) return pathId[1];
    return null;
  }

  if (marketplace.id === "AUTOSCOUT24") {
    const uuid = pathname.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    if (uuid) return uuid[0].toLowerCase();
    const numeric = pathname.match(/\/angebote\/[^/]*?(\d{6,})/i);
    return numeric ? numeric[1] : null;
  }

  if (marketplace.id === "KLEINANZEIGEN") {
    // /s-anzeige/vw-golf/2912345678-216-2189
    const match = pathname.match(/\/s-anzeige\/[^/]+\/(\d{6,})/i);
    return match ? match[1] : null;
  }

  return null;
}

export function isListingUrl(rawUrl) {
  return Boolean(listingId(rawUrl));
}

/**
 * True for a link that belongs to a known portal but carries no ad id —
 * a share/short link, or a format we do not recognise yet. Worth following
 * the redirects on before telling the user it is a search page.
 */
export function mayRedirectToListing(rawUrl) {
  return Boolean(detectMarketplace(rawUrl)) && !listingId(rawUrl);
}

/** Stable key for de-duplication across pages and sources. */
export function listingIdentity(rawUrl) {
  const marketplace = detectMarketplace(rawUrl);
  const id = listingId(rawUrl);
  if (marketplace && id) return `${marketplace.id}:${id}`;

  try {
    const url = new URL(stripTracking(rawUrl));
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch {
    return normalizeText(rawUrl);
  }
}

/**
 * Validates the link a dealer pasted and explains, in German, what is wrong.
 * @returns {{ok:true,url:string,marketplace:object,id:string}|{ok:false,error:string}}
 */
export function validateListingUrl(rawUrl) {
  const value = String(rawUrl ?? "").trim();
  if (!value) {
    return { ok: false, error: "Bitte einen Fahrzeug-Link einfügen." };
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return {
      ok: false,
      error: "Das ist kein gültiger Link. Bitte die komplette Adresse einfügen.",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, error: "Nur http- und https-Links werden unterstützt." };
  }

  const marketplace = detectMarketplace(value);
  if (!marketplace) {
    return {
      ok: false,
      error: `${parsed.hostname} wird nicht unterstützt. Bitte einen Link von AutoScout24, mobile.de oder Kleinanzeigen verwenden.`,
    };
  }

  const id = listingId(value);
  if (!id) {
    return {
      ok: false,
      error: `Das sieht nach einer Suchergebnis-Seite von ${marketplace.label} aus. Bitte die Anzeige öffnen und den Link des einzelnen Fahrzeugs einfügen.`,
    };
  }

  return { ok: true, url: canonicalListingUrl(value), marketplace, id };
}
