/**
 * Talks to the "Helfer" browser extension
 * (extensions/autogalerie-helper), which opens portal pages in the user's
 * own browser and hands their HTML to the app:
 *   importMobileListing  one mobile.de ad (Ankauf bestätigen)
 *   fetchPortalPage      an ad or result page of mobile.de, AutoScout24 or
 *                        Kleinanzeigen (Marktanalyse)
 */
import {
  CHANNEL, VERSION, MAX_HTML_LENGTH, IMPORT_TIMEOUT_MS, SEARCH_TIMEOUT_MS, mobileListingId, mobileUrl, portalOf,
} from "../../extensions/autogalerie-helper/protocol";

const LAST_CONNECTION_KEY = "autogalerie-helper.last-connected";
const RECENT_CONNECTION_MS = 15 * 60_000;

export function hasRecentHelperConnection() {
  try {
    const lastConnected = Number(window.localStorage.getItem(LAST_CONNECTION_KEY));
    const age = Date.now() - lastConnected;
    return lastConnected > 0 && age >= 0 && age < RECENT_CONNECTION_MS;
  } catch {
    return false;
  }
}

function extensionRequest(kind, { url, pageKind, signal, onStatus, timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const send = (action) => window.postMessage({ channel: CHANNEL, from: "PAGE", requestId, kind: action, url, pageKind }, location.origin);
    const finish = (error, value) => {
      clearTimeout(timer);
      clearTimeout(staleError);
      window.removeEventListener("message", receive);
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(value);
    };
    const abort = () => {
      send("CANCEL");
      finish(new DOMException("Import abgebrochen.", "AbortError"));
    };
    // Eine Fehlermeldung ohne Kennung kommt von einer veralteten Brücke (vor dem Update
    // noch in der Seite). Kurz warten, ob die aktuelle Brücke antwortet.
    let staleError = null;
    const receive = (event) => {
      const message = event.data;
      if (event.source !== window || event.origin !== location.origin ||
        message?.channel !== CHANNEL || message.from !== "EXTENSION" || message.requestId !== requestId) return;
      if (message.bridge) {
        clearTimeout(staleError);
        staleError = null;
      }
      if (message.kind === "STATUS") {
        onStatus?.(message.status, () => send("SHOW_TAB"));
      } else if (message.kind === "ERROR" && !message.bridge) {
        if (!staleError) staleError = setTimeout(() => finish(new Error(message.error || "Die Erweiterung konnte die Anzeige nicht laden.")), 1500);
      } else if (message.kind === "ERROR") {
        finish(new Error(message.error || "Die Erweiterung konnte die Anzeige nicht laden."));
      } else if (message.kind === "RESULT") {
        finish(null, message);
      }
    };
    const timer = setTimeout(() => {
      send("CANCEL");
      finish(new Error("Die Erweiterung antwortet nicht. Bitte die Seite neu laden und erneut versuchen."));
    }, timeoutMs);
    window.addEventListener("message", receive);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    else send(kind);
  });
}

/** Ein schlafender Hintergrunddienst braucht manchmal länger zum Aufwachen: zweimal fragen. */
export async function detectHelperExtension() {
  const path = location.pathname.replace(/\/$/, "");
  let connected = false;
  for (const timeoutMs of [1500, 3000]) {
    try {
      const response = await extensionRequest("PING", { timeoutMs });
      connected = response.version === VERSION;
      if (connected) break;
    } catch {
      // The extension is unavailable on this route – or still waking up.
    }
  }
  // Remember a real check on the import page so Settings can recognize the
  // same browser even when the extension does not answer there.
  if (path === "/Posteingang/ankauf/bestaetigung" || path === "/marktanalyse") {
    try {
      if (connected) window.localStorage.setItem(LAST_CONNECTION_KEY, String(Date.now()));
      else window.localStorage.removeItem(LAST_CONNECTION_KEY);
    } catch {
      // Storage restrictions do not affect live imports.
    }
  }
  return connected;
}

export async function importMobileListing(url, { signal, onStatus } = {}) {
  const expectedId = mobileListingId(url);
  const href = mobileUrl(url);
  const listing = href ? new URL(href) : null;
  // Keep search-page context out of the request for an individual listing.
  if (expectedId && listing?.pathname === "/fahrzeuge/details.html" && listing.searchParams.get("id") === expectedId) {
    listing.search = new URLSearchParams({ id: expectedId });
  }
  const response = await withReconnect(() => extensionRequest("IMPORT", {
    url: listing?.href || url, signal, onStatus, timeoutMs: IMPORT_TIMEOUT_MS + 5000,
  }), signal);
  if (!mobileUrl(response.url) || !mobileListingId(response.url) ||
    expectedId && expectedId !== mobileListingId(response.url) ||
    typeof response.html !== "string" || response.html.length <= 500 || response.html.length > MAX_HTML_LENGTH) {
    throw new Error("Die Erweiterung hat keine vollständige Fahrzeuganzeige übertragen.");
  }
  return { url: response.url, html: response.html };
}

/**
 * Marktanalyse: loads one page of mobile.de, AutoScout24 or Kleinanzeigen
 * through the extension. The extension queues requests per portal, so several
 * calls may run at once.
 * @param pageKind "listing" (one ad) or "search" (a result page)
 * @returns {{ url: string, html: string, missing: boolean }}
 */
/** Bricht die Verbindung ab (Chrome hat den Hintergrunddienst beendet), wird einmal neu gefragt. */
const CONNECTION_LOST = /Verbindung zur Erweiterung wurde beendet|Receiving end does not exist|context invalidated|message port closed/i;
async function withReconnect(run, signal) {
  try {
    return await run();
  } catch (error) {
    if (signal?.aborted || !CONNECTION_LOST.test(error?.message || "")) throw error;
    await new Promise((resolve) => setTimeout(resolve, 800));
    return run();
  }
}

export async function fetchPortalPage(url, options = {}) {
  return withReconnect(() => fetchPortalPageOnce(url, options), options.signal);
}

async function fetchPortalPageOnce(url, { pageKind = "search", signal, onStatus } = {}) {
  const portal = portalOf(url);
  if (!portal) throw new Error("Bitte einen Link von mobile.de, AutoScout24 oder Kleinanzeigen verwenden.");
  // Requests wait in the extension's queue behind earlier pages of the same portal.
  const limit = (pageKind === "search" ? SEARCH_TIMEOUT_MS : IMPORT_TIMEOUT_MS) + 240_000;
  const response = await extensionRequest("FETCH", { url, pageKind, signal, onStatus, timeoutMs: limit });
  if (portalOf(response.url) !== portal || typeof response.html !== "string" ||
    response.html.length <= 200 || response.html.length > MAX_HTML_LENGTH) {
    throw new Error("Die Erweiterung hat die Seite nicht vollständig übertragen.");
  }
  return { url: response.url, html: response.html, missing: Boolean(response.missing) };
}
