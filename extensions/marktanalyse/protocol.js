export const CHANNEL = "autogalerie.market-import.v1";
export const VERSION = 1;
export const MAX_HTML_LENGTH = 4_000_000;
export const IMPORT_TIMEOUT_MS = 120_000;
export const SEARCH_TIMEOUT_MS = 12_000;
export const MAX_SEARCH_CARDS = 50;

const APP_HOSTS = new Set([
  "xn--autogaleriejlich-uzb.de",
  "www.xn--autogaleriejlich-uzb.de",
  "autogalerie-juelich.de",
  "www.autogalerie-juelich.de",
]);

export function isAnalysisUrl(value, { allowSettings = false } = {}) {
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    const path = url.pathname.replace(/\/$/, "");
    return !url.username && !url.password &&
      (APP_HOSTS.has(url.hostname) && url.protocol === "https:" || local && url.protocol === "http:") &&
      (["/marktanalyse", "/Posteingang/ankauf/bestaetigung"].includes(path) || allowSettings && path === "/einstellungen");
  } catch {
    return false;
  }
}

export function mobileUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      !(url.hostname === "mobile.de" || url.hostname.endsWith(".mobile.de"))) return null;
    url.protocol = "https:";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function mobileListingId(value) {
  const href = mobileUrl(value);
  if (!href) return null;
  const url = new URL(href);
  const id = url.searchParams.get("id");
  if (/^\d{3,}$/.test(id || "")) return id;
  return url.pathname.match(/(\d{3,})(?:\.html?)?\/?$/)?.[1] || null;
}

export function mobileSearchUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === "https://suchen.mobile.de" &&
      !url.username && !url.password && !url.searchParams.has("pageNumber") &&
      (url.pathname === "/fahrzeuge/search.html" && url.searchParams.get("vc") === "Car" &&
        /^\d+;(?:\d+|group-\d+);;$/.test(url.searchParams.get("ms") || "") ||
        /^\/auto\/[a-z0-9-]+\.html$/.test(url.pathname))
      ? url.href
      : null;
  } catch {
    return null;
  }
}
