import {
  CHANNEL, VERSION, MAX_HTML_LENGTH, IMPORT_TIMEOUT_MS, SEARCH_TIMEOUT_MS,
  MAX_SEARCH_CARDS, isAnalysisUrl, mobileUrl, mobileListingId, mobileSearchUrl,
} from "./protocol.js";
import { readSearchCards } from "./search.js";

const jobs = new Map();
const SEARCH_COOLDOWN_KEY = "mobileComparisonCooldownUntil";
const SEARCH_COOLDOWN_MS = 15 * 60_000;
const LISTING_REQUIRED = "Bitte ein einzelnes Fahrzeug auf mobile.de öffnen und den Link dieser Anzeige einfügen.";
let searchInProgress = false;

function isSearchPage(url) {
  const path = new URL(url).pathname;
  return /^\/auto(?:\/|$)|^\/fahrzeuge\/search(?:\.html)?\/?$/.test(path);
}

function isAnalysisSender(sender, appUrl, options) {
  // The sender's URL can still be the first route of a Next.js document.
  return sender?.frameId === 0 && Number.isInteger(sender.tab?.id) &&
    isAnalysisUrl(appUrl, options) && sender.origin === new URL(appUrl).origin;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.kind === "PING" && isAnalysisSender(sender, message.appUrl, { allowSettings: true })) {
    sendResponse({ version: VERSION });
  }
});

/** Executed in the listing tab's isolated world. */
function readListing() {
  const text = document.body?.innerText || "";
  const structured = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .some((script) => /"price"\s*:/.test(script.textContent) &&
      /mileageFromOdometer|dateVehicleFirstRegistered|"@type"\s*:\s*"(?:Car|Vehicle)"/i.test(script.textContent));
  const ready = structured || text.length > 250 &&
    /Kilometerstand|Laufleistung|mileage/i.test(text) &&
    /Erstzulassung|first registration|\bEZ\b/i.test(text) && /€|\bEUR\b/.test(text);
  if (!ready) return { ready: false, url: location.href };
  const page = document.documentElement.cloneNode(true);
  page.querySelectorAll("style,svg,link,noscript,iframe,video,audio,source,template,script[src]")
    .forEach((element) => element.remove());
  return { ready: true, url: location.href, html: page.outerHTML };
}

/**
 * Opens the mobile.de tab in a normal browser window. An installed app window
 * (Chrome or Edge "App") has no tab strip, so the tab goes to a browser window
 * of the same profile – or to a new one when none is open.
 */
async function openWorkTab(job, url) {
  const appTab = job.port.sender.tab;
  let windowId = null;
  try {
    const appWindow = await chrome.windows.get(appTab.windowId);
    if (appWindow.type === "normal") windowId = appWindow.id;
  } catch {
    // The app window is gone; use another browser window.
  }
  if (!windowId) {
    const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
    windowId = windows.find((w) => w.incognito === Boolean(appTab.incognito))?.id ?? null;
  }
  if (windowId) return chrome.tabs.create({ url, active: false, windowId });
  const created = await chrome.windows.create({ url, focused: false, type: "normal", incognito: Boolean(appTab.incognito) });
  job.ownWindowId = created.id;
  return created.tabs[0];
}

/** Brings a tab to the front – including its window (the app may be its own window). */
async function showTab(tabId) {
  const tab = await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
}

function reply(job, kind, data) {
  if (!job.connected) return;
  try {
    job.port.postMessage({ kind, ...data });
  } catch {
    job.connected = false;
    job.cancelled = true;
  }
}

async function closeOwnTab(job) {
  if (!job.tabId) return;
  try {
    const tab = await chrome.tabs.get(job.tabId);
    // Keep a tab the user navigated away from the requested listing.
    const url = tab.pendingUrl || tab.url;
    if (mobileUrl(url) && (!job.listingId || mobileListingId(url) === job.listingId)) {
      await chrome.tabs.remove(job.tabId);
    }
  } catch {
    // The user may already have closed it.
  }
}

async function importListing(job, url) {
  const startedAt = Date.now();
  try {
    reply(job, "STATUS", { status: "LOADING" });
    const tab = await openWorkTab(job, url);
    job.tabId = tab.id;
    while (!job.cancelled && Date.now() - startedAt < IMPORT_TIMEOUT_MS) {
      const current = await chrome.tabs.get(job.tabId);
      if (current.status === "complete" && current.url) {
        if (!mobileUrl(current.url)) throw new Error("Die Anzeige hat mobile.de verlassen. Bitte den direkten Anzeigen-Link verwenden.");
        const actualId = mobileListingId(current.url);
        if (!actualId && isSearchPage(current.url)) {
          throw new Error(`mobile.de hat statt der Fahrzeuganzeige eine Suchseite geöffnet. ${LISTING_REQUIRED}`);
        }
        if (job.listingId && actualId && actualId !== job.listingId) {
          throw new Error("Im Anzeigen-Tab wurde ein anderes Fahrzeug geöffnet. Bitte den gewünschten Link erneut prüfen.");
        }
        if (actualId) {
          const [snapshot] = await chrome.scripting.executeScript({ target: { tabId: job.tabId }, func: readListing });
          const page = snapshot?.result;
          if (page?.ready && mobileListingId(page.url) === actualId) {
            if (page.html.length > MAX_HTML_LENGTH) throw new Error("Die Anzeige ist zu groß für den Import. Bitte den Anzeigentext einfügen.");
            if (job.cancelled) break;
            reply(job, "RESULT", { url: page.url, html: page.html, comparisonSearch: true });
            job.succeeded = true;
            return;
          }
        }
      }
      if (!job.shown && Date.now() - startedAt > 8000) {
        job.shown = true;
        if ((await chrome.tabs.get(job.appTabId)).active) {
          await showTab(job.tabId);
        }
        reply(job, "STATUS", { status: "WAITING" });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!job.cancelled) throw new Error("mobile.de konnte nicht eingelesen werden. Bitte die Freigabe im Anzeigen-Tab abschließen und erneut versuchen.");
  } catch (error) {
    if (!job.cancelled) {
      reply(job, "ERROR", { error: error?.message || "Die Anzeige konnte nicht geladen werden." });
    }
  } finally {
    if (job.succeeded || job.cancelled || !job.shown) await closeOwnTab(job);
    if (job.succeeded && job.shown) {
      try { await showTab(job.appTabId); } catch { /* app tab closed */ }
    }
    if (jobs.get(job.appTabId) === job) jobs.delete(job.appTabId);
  }
}

async function searchListings(job, url) {
  const finish = (status, cards = [], reason = null) => {
    job.succeeded = true;
    reply(job, "RESULT", { status, cards, reason });
  };
  if (searchInProgress) {
    finish("unavailable", [], "busy");
    if (jobs.get(job.appTabId) === job) jobs.delete(job.appTabId);
    return;
  }
  searchInProgress = true;
  try {
    const state = await chrome.storage.session.get(SEARCH_COOLDOWN_KEY);
    if (state[SEARCH_COOLDOWN_KEY] > Date.now()) {
      finish("blocked");
      return;
    }
    if (job.cancelled) return;
    const deadline = Date.now() + SEARCH_TIMEOUT_MS;
    const tab = await openWorkTab(job, url);
    job.tabId = tab.id;
    let reason = "timeout";
    let nextReadAt = 0;
    while (!job.cancelled && Date.now() < deadline) {
      const current = await chrome.tabs.get(job.tabId);
      if (current.status === "complete" && current.url && Date.now() >= nextReadAt) {
        const currentPage = new URL(current.url);
        if (!["suchen.mobile.de", "www.mobile.de", "mobile.de"].includes(currentPage.hostname)) {
          reason = "redirect";
          break;
        }
        const isResultsPage = /^\/auto\/[a-z0-9-]+\.html$|^\/fahrzeuge\/search\.html$/.test(currentPage.pathname);
        if (isResultsPage) job.searchPageUrl = current.url;
        const [snapshot] = await chrome.scripting.executeScript({
          target: { tabId: job.tabId },
          func: readSearchCards,
          args: [MAX_SEARCH_CARDS],
        });
        const result = snapshot?.result;
        if (result?.status === "blocked") {
          await chrome.storage.session.set({ [SEARCH_COOLDOWN_KEY]: Date.now() + SEARCH_COOLDOWN_MS });
          finish("blocked");
          return;
        } else if (isResultsPage && result?.status === "ok") {
          finish("ok", result.cards);
          return;
        }
        reason = isResultsPage ? "cards" : "redirect";
        if (!isResultsPage) break;
        // A background tab can finish loading before its results have rendered.
        nextReadAt = Date.now() + 1200;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (!job.cancelled) finish("unavailable", [], reason);
  } catch {
    if (!job.cancelled) finish("unavailable", [], "browser");
  } finally {
    if (job.tabId) {
      try {
        const tab = await chrome.tabs.get(job.tabId);
        const currentUrl = tab.pendingUrl || tab.url;
        // In a window opened only for this search the tab is the active one.
        if ((!tab.active || tab.windowId === job.ownWindowId) && (currentUrl === url || currentUrl === job.searchPageUrl)) {
          await chrome.tabs.remove(job.tabId);
        }
      } catch { /* Tab already closed. */ }
    }
    searchInProgress = false;
    if (jobs.get(job.appTabId) === job) jobs.delete(job.appTabId);
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== CHANNEL) {
    port.disconnect();
    return;
  }
  let job = null;
  port.onMessage.addListener((message) => {
    if (message?.kind === "SHOW_TAB" && job?.tabId) {
      showTab(job.tabId).catch(() => {});
      return;
    }
    const isSearch = message?.kind === "SEARCH";
    if ((!isSearch && message?.kind !== "IMPORT") || job) return;
    if (!isAnalysisSender(port.sender, message.appUrl)) {
      port.disconnect();
      return;
    }
    if (isSearch && new URL(message.appUrl).pathname.replace(/\/$/, "") !== "/marktanalyse") {
      port.disconnect();
      return;
    }
    const url = isSearch ? mobileSearchUrl(message.url) : mobileUrl(message.url);
    if (!url) {
      port.postMessage({ kind: "ERROR", error: "Bitte einen gültigen mobile.de-Link verwenden." });
      return;
    }
    if (!isSearch && !mobileListingId(url) && isSearchPage(url)) {
      port.postMessage({ kind: "ERROR", error: LISTING_REQUIRED });
      return;
    }
    const appTabId = port.sender.tab.id;
    const previous = jobs.get(appTabId);
    if (previous) previous.cancelled = true;
    job = { port, appTabId, listingId: mobileListingId(url), connected: true, cancelled: false };
    jobs.set(appTabId, job);
    if (isSearch) searchListings(job, url);
    else importListing(job, url);
  });
  port.onDisconnect.addListener(() => {
    if (job) {
      job.connected = false;
      if (!job.succeeded) job.cancelled = true;
    }
  });
});
