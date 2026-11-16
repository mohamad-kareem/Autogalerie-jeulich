/** Shared by the extension and the app (lib/ankauf/helperExtension.js, lib/marktanalyse/extension.js). */
export const CHANNEL = "autogalerie.helper.v2";
export const VERSION = 2;
export const MAX_HTML_LENGTH = 4_000_000;
export const IMPORT_TIMEOUT_MS = 120_000;
export const SEARCH_TIMEOUT_MS = 75_000;

const APP_HOSTS = new Set([
  "xn--autogaleriejlich-uzb.de",
  "www.xn--autogaleriejlich-uzb.de",
  "autogalerie-juelich.de",
  "www.autogalerie-juelich.de",
]);

const ROUTES = {
  "/Posteingang/ankauf/bestaetigung": "ankauf",
  "/marktanalyse": "marktanalyse",
  "/einstellungen": "settings",
};

/** Which app page is asking: "ankauf" | "marktanalyse" | "settings" | null. */
export function appRoute(value) {
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.username || url.password) return null;
    if (!(APP_HOSTS.has(url.hostname) && url.protocol === "https:" || local && url.protocol === "http:")) return null;
    return ROUTES[url.pathname.replace(/\/$/, "")] || null;
  } catch {
    return null;
  }
}

/** The app pages allowed to talk to the extension. */
export function isAppUrl(value, { allowSettings = false } = {}) {
  const route = appRoute(value);
  return route === "ankauf" || route === "marktanalyse" || allowSettings && route === "settings";
}

/** "MOBILE_DE" | "AUTOSCOUT24" | "KLEINANZEIGEN" | null – real portal hosts only. */
export function portalOf(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === "mobile.de" || host.endsWith(".mobile.de")) return "MOBILE_DE";
    if (host === "autoscout24.de" || host.endsWith(".autoscout24.de")) return "AUTOSCOUT24";
    if (host === "kleinanzeigen.de" || host.endsWith(".kleinanzeigen.de")) return "KLEINANZEIGEN";
    return null;
  } catch {
    return null;
  }
}

/** The portal URL as https, without fragment – or null. */
export function portalUrl(value) {
  if (!portalOf(value)) return null;
  const url = new URL(value);
  url.protocol = "https:";
  url.hash = "";
  return url.href;
}

export function mobileUrl(value) {
  return portalOf(value) === "MOBILE_DE" ? portalUrl(value) : null;
}

export function mobileListingId(value) {
  const href = mobileUrl(value);
  if (!href) return null;
  const url = new URL(href);
  const id = url.searchParams.get("id");
  if (/^\d{3,}$/.test(id || "")) return id;
  return url.pathname.match(/(\d{3,})(?:\.html?)?\/?$/)?.[1] || null;
}
