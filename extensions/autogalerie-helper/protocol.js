/** Shared by the extension and the app (lib/ankauf/helperExtension.js). */
export const CHANNEL = "autogalerie.helper.v1";
export const VERSION = 1;
export const MAX_HTML_LENGTH = 4_000_000;
export const IMPORT_TIMEOUT_MS = 120_000;

const APP_HOSTS = new Set([
  "xn--autogaleriejlich-uzb.de",
  "www.xn--autogaleriejlich-uzb.de",
  "autogalerie-juelich.de",
  "www.autogalerie-juelich.de",
]);

/** The app pages allowed to talk to the extension. */
export function isAppUrl(value, { allowSettings = false } = {}) {
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    const path = url.pathname.replace(/\/$/, "");
    return !url.username && !url.password &&
      (APP_HOSTS.has(url.hostname) && url.protocol === "https:" || local && url.protocol === "http:") &&
      (path === "/Posteingang/ankauf/bestaetigung" || allowSettings && path === "/einstellungen");
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
