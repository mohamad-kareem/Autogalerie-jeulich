import {
  CHANNEL, VERSION, MAX_HTML_LENGTH, IMPORT_TIMEOUT_MS, SEARCH_TIMEOUT_MS,
  MAX_SEARCH_CARDS, mobileListingId, mobileUrl, mobileSearchUrl,
} from "../../extensions/marktanalyse/protocol";

const LAST_CONNECTION_KEY = "marktanalyse.extension.last-connected";
const RECENT_CONNECTION_MS = 15 * 60_000;

export function hasRecentMarketExtensionConnection() {
  try {
    const lastConnected = Number(window.localStorage.getItem(LAST_CONNECTION_KEY));
    const age = Date.now() - lastConnected;
    return lastConnected > 0 && age >= 0 && age < RECENT_CONNECTION_MS;
  } catch {
    return false;
  }
}

function extensionRequest(kind, { url, signal, onStatus, timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const send = (action) => window.postMessage({ channel: CHANNEL, from: "PAGE", requestId, kind: action, url }, location.origin);
    const finish = (error, value) => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(value);
    };
    const abort = () => {
      send("CANCEL");
      finish(new DOMException("Import abgebrochen.", "AbortError"));
    };
    const receive = (event) => {
      const message = event.data;
      if (event.source !== window || event.origin !== location.origin ||
        message?.channel !== CHANNEL || message.from !== "EXTENSION" || message.requestId !== requestId) return;
      if (message.kind === "STATUS") {
        onStatus?.(message.status, () => send("SHOW_TAB"));
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

export async function detectMarketExtension() {
  const path = location.pathname.replace(/\/$/, "");
  let connected = false;
  try {
    const response = await extensionRequest("PING", { timeoutMs: 800 });
    connected = response.version === VERSION;
  } catch {
    // The extension is unavailable on this route.
  }
  // Older extensions answer only on the import pages. Remember a real check
  // there so Settings can recognize the same browser without a new download.
  if (["/marktanalyse", "/Posteingang/ankauf/bestaetigung"].includes(path)) {
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
  const response = await extensionRequest("IMPORT", {
    url: listing?.href || url, signal, onStatus, timeoutMs: IMPORT_TIMEOUT_MS + 5000,
  });
  if (!mobileUrl(response.url) || !mobileListingId(response.url) ||
    expectedId && expectedId !== mobileListingId(response.url) ||
    typeof response.html !== "string" || response.html.length <= 500 || response.html.length > MAX_HTML_LENGTH) {
    throw new Error("Die Erweiterung hat keine vollständige Fahrzeuganzeige übertragen.");
  }
  return { url: response.url, html: response.html, comparisonSearch: response.comparisonSearch === true };
}

export async function importMobileComparables(page, { signal, originalUrl } = {}) {
  try {
    const originalId = mobileListingId(originalUrl);
    const searchContextUrl = originalId && originalId === mobileListingId(page.url) ? originalUrl : page.url;
    const response = await fetch("/api/market-analysis?prepareMobileSearch=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: searchContextUrl, pageHtml: page.html }),
      signal,
    });
    if (!response.ok) return { status: "unavailable", reason: "prepare" };
    const { searchUrl } = await response.json();
    const url = mobileSearchUrl(searchUrl);
    if (!url) return null;

    const result = await extensionRequest("SEARCH", { url, signal, timeoutMs: SEARCH_TIMEOUT_MS + 2_000 });
    if (result.status === "ok" && Array.isArray(result.cards)) {
      return { status: "ok", cards: result.cards.slice(0, MAX_SEARCH_CARDS) };
    }
    return { status: result.status === "blocked" ? "blocked" : "unavailable", reason: result.reason };
  } catch {
    return { status: "unavailable", reason: "connection" };
  }
}
