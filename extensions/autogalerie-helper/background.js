import {
  CHANNEL, VERSION, MAX_HTML_LENGTH, IMPORT_TIMEOUT_MS, SEARCH_TIMEOUT_MS,
  appRoute, isAppUrl, portalOf, portalUrl, mobileListingId,
} from "./protocol.js";

/**
 * Helfer.
 *
 * Opens a portal page (mobile.de, AutoScout24, Kleinanzeigen) in a tab of the
 * user's own browser, waits until it shows its content and hands the HTML to
 * the app. The app reads the data; this extension only delivers pages.
 *
 *   IMPORT  one mobile.de ad, for "Ankauf bestätigen"
 *   FETCH   an ad or a result page of any of the three portals, for the Marktanalyse
 *
 * Each portal has its own queue: one page at a time, with a short pause, so the
 * browser behaves like a person clicking through results. A security check is
 * never answered here – the tab is brought to the front for the user.
 */

const LISTING_REQUIRED = "Bitte ein einzelnes Fahrzeug auf mobile.de öffnen und den Link dieser Anzeige einfügen.";
const PORTAL_NAME = { MOBILE_DE: "mobile.de", AUTOSCOUT24: "AutoScout24", KLEINANZEIGEN: "Kleinanzeigen" };
const POLL_MS = 700;
const SHOW_AFTER_MS = 8000;

const importJobs = new Map(); // app tab → running IMPORT
const queues = new Map(); // portal → { tail: Promise, lastDone: number }

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isMobileSearchPage(url) {
  const path = new URL(url).pathname;
  return /^\/auto(?:\/|$)|^\/fahrzeuge\/search(?:\.html)?\/?$/.test(path);
}

function isAppSender(sender, appUrl, options) {
  // The sender's URL can still be the first route of a Next.js document.
  return sender?.frameId === 0 && Number.isInteger(sender.tab?.id) &&
    isAppUrl(appUrl, options) && sender.origin === new URL(appUrl).origin;
}

/**
 * Nach einem Update, Neuladen oder Wiedereinschalten der Erweiterung haben offene
 * App-Tabs nur noch eine tote Verbindung. Die Brücke wird dort neu eingesetzt,
 * damit niemand die Seite neu laden muss. Läuft bei jedem Start des Hintergrunddienstes;
 * wo die Brücke schon läuft, passiert nichts.
 */
const APP_TAB_PATTERNS = chrome.runtime.getManifest().content_scripts?.[0]?.matches || [];
async function reviveAppTabs() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: APP_TAB_PATTERNS });
  } catch {
    return;
  }
  for (const tab of tabs) {
    if (!Number.isInteger(tab.id) || tab.discarded) continue;
    try {
      const [probe] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => Boolean(window.__agHelperBridge) });
      if (!probe?.result) await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["bridge.js"] });
    } catch {
      // Tab wird gerade geladen oder geschlossen – dort setzt Chrome die Brücke selbst ein.
    }
  }
}
reviveAppTabs();
chrome.runtime.onInstalled.addListener(() => { reviveAppTabs(); });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.kind === "PING" && isAppSender(sender, message.appUrl, { allowSettings: true })) {
    sendResponse({ version: VERSION });
  }
});

/**
 * Executed in the portal tab's isolated world.
 * Says whether the page is showing its content yet and returns its HTML.
 */
function readPage(portal, pageKind) {
  const text = document.body?.innerText || "";
  const head = `${document.title}\n${text.slice(0, 3000)}`;
  const scripts = [...document.scripts];
  const inline = (needle) => scripts.some((script) => !script.src && script.textContent.includes(needle));

  // A check the user has to answer himself.
  const blocked = text.length < 8000 &&
    /captcha|sicherheits(?:ü|ue)berpr(?:ü|ue)fung|bist du ein mensch|sind sie ein mensch|are you (?:a )?human|ich bin kein roboter|zugriff verweigert|access denied|ungew(?:ö|oe)hnliche(?:n)? (?:aktivit|datenverkehr)|unusual (?:activity|traffic)|bitte best(?:ä|ae)tige|verify you are/i.test(head);
  const missing = text.length < 6000 &&
    /seite (?:wurde )?nicht gefunden|page not found|\b404\b|anzeige (?:ist )?nicht mehr (?:verf(?:ü|ue)gbar|online)|inserat (?:wurde )?(?:gel(?:ö|oe)scht|nicht gefunden)|nicht mehr verf(?:ü|ue)gbar/i.test(head);

  let ready = false;
  if (pageKind === "search") {
    if (portal === "MOBILE_DE") ready = inline('\\"searchResults\\"') || inline('\\"filterParams\\"');
    else if (portal === "AUTOSCOUT24") ready = Boolean(document.getElementById("__NEXT_DATA__"));
    else ready = Boolean(document.querySelector("article[data-adid]")) || /es wurden keine|keine (?:anzeigen|ergebnisse|treffer)/i.test(text);
  } else {
    const structured = scripts.some((script) => script.type === "application/ld+json" && /"price"\s*:/.test(script.textContent) &&
      /mileageFromOdometer|dateVehicleFirstRegistered|"@type"\s*:\s*"(?:Car|Vehicle)"/i.test(script.textContent));
    ready = structured ||
      portal === "MOBILE_DE" && inline('\\"listing\\":{\\"attributes\\"') ||
      portal === "AUTOSCOUT24" && Boolean(document.getElementById("__NEXT_DATA__")) && /Kilometerstand/i.test(text) ||
      text.length > 250 && /Kilometerstand|Laufleistung|mileage/i.test(text) &&
        /Erstzulassung|first registration|\bEZ\b/i.test(text) && /€|\bEUR\b/.test(text);
  }
  if (blocked && !ready) return { ready: false, blocked: true, url: location.href };
  if (!ready && !missing) return { ready: false, url: location.href };

  const page = document.documentElement.cloneNode(true);
  page.querySelectorAll("style,svg,link,noscript,iframe,video,audio,source,template,script[src]")
    .forEach((element) => element.remove());
  // Kleinanzeigen wiederholt die ganzen Anzeigendaten in jedem Seitenbaustein ("props", je ~400 KB).
  // Die Daten stehen ohnehin sichtbar in der Seite; solche Riesen-Attribute werden weggelassen.
  for (const element of page.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (attribute.value.length > 20000) element.removeAttribute(attribute.name);
    }
  }
  return { ready: true, missing: missing && !ready, url: location.href, html: page.outerHTML };
}

/**
 * Opens the work tab in a normal browser window. An installed app window
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
    // Keep a tab the user navigated somewhere else.
    const url = tab.pendingUrl || tab.url;
    const samePortal = portalOf(url) === job.portal;
    const sameListing = !job.listingId || mobileListingId(url) === job.listingId;
    if (samePortal && sameListing) await chrome.tabs.remove(job.tabId);
  } catch {
    // The user may already have closed it.
  }
}

/** Loads one page and answers the app. */
async function loadPage(job) {
  const startedAt = Date.now();
  const timeout = job.pageKind === "search" ? SEARCH_TIMEOUT_MS : IMPORT_TIMEOUT_MS;
  const name = PORTAL_NAME[job.portal];
  try {
    reply(job, "STATUS", { status: "LOADING" });
    const tab = await openWorkTab(job, job.url);
    job.tabId = tab.id;
    // A page waiting for the user's confirmation gets the long limit.
    while (!job.cancelled && Date.now() - startedAt < (job.shown ? IMPORT_TIMEOUT_MS : timeout)) {
      const current = await chrome.tabs.get(job.tabId);
      let blocked = false;
      if (current.status === "complete" && current.url) {
        if (portalOf(current.url) !== job.portal) throw new Error(`Die Seite hat ${name} verlassen. Bitte den direkten Link verwenden.`);
        if (job.legacy) {
          const actualId = mobileListingId(current.url);
          if (!actualId && isMobileSearchPage(current.url)) throw new Error(`mobile.de hat statt der Fahrzeuganzeige eine Suchseite geöffnet. ${LISTING_REQUIRED}`);
          if (job.listingId && actualId && actualId !== job.listingId) throw new Error("Im Anzeigen-Tab wurde ein anderes Fahrzeug geöffnet. Bitte den gewünschten Link erneut prüfen.");
        }
        const [snapshot] = await chrome.scripting.executeScript({ target: { tabId: job.tabId }, func: readPage, args: [job.portal, job.pageKind] });
        const page = snapshot?.result;
        blocked = Boolean(page?.blocked);
        if (page?.ready) {
          if (job.pageKind === "listing" && page.missing) throw new Error(`${name}: Die Anzeige wurde nicht gefunden. Vielleicht ist sie nicht mehr online.`);
          if (page.html.length > MAX_HTML_LENGTH) throw new Error(`${name}: Die Seite ist zu groß zum Einlesen.`);
          if (job.cancelled) break;
          reply(job, "RESULT", { url: page.url, html: page.html, missing: Boolean(page.missing) });
          job.succeeded = true;
          return;
        }
      }
      // Bring the tab forward when the user has to confirm something: at once for
      // a visible check, after a while for an ad that still shows no data.
      const waited = Date.now() - startedAt;
      if (!job.shown && (blocked && waited > 2500 || job.pageKind === "listing" && waited > SHOW_AFTER_MS)) {
        job.shown = true;
        try {
          if ((await chrome.tabs.get(job.appTabId)).active) await showTab(job.tabId);
        } catch { /* app tab closed */ }
        reply(job, "STATUS", { status: "WAITING" });
      }
      await sleep(POLL_MS);
    }
    if (!job.cancelled) {
      throw new Error(job.shown
        ? `${name} konnte nicht eingelesen werden. Bitte die Freigabe im geöffneten Tab abschließen und erneut versuchen.`
        : `${name} hat nicht rechtzeitig geantwortet.`);
    }
  } catch (error) {
    if (!job.cancelled) reply(job, "ERROR", { error: error?.message || "Die Seite konnte nicht geladen werden." });
  } finally {
    if (job.succeeded || job.cancelled || !job.shown) await closeOwnTab(job);
    if (job.succeeded && job.shown) {
      try { await showTab(job.appTabId); } catch { /* app tab closed */ }
    }
    if (job.legacy && importJobs.get(job.appTabId) === job) importJobs.delete(job.appTabId);
  }
}

/** One page at a time per portal, with a human-sized pause in between. */
function enqueue(job) {
  const queue = queues.get(job.portal) || { tail: Promise.resolve(), lastDone: 0 };
  queues.set(job.portal, queue);
  reply(job, "STATUS", { status: "QUEUED" });
  queue.tail = queue.tail.then(async () => {
    if (job.cancelled) return;
    const pause = 1200 + Math.random() * 1600 - (Date.now() - queue.lastDone);
    if (queue.lastDone && pause > 0) await sleep(pause);
    if (job.cancelled) return;
    await loadPage(job);
    queue.lastDone = Date.now();
  }).catch(() => {});
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
    if (!["IMPORT", "FETCH"].includes(message?.kind) || job) return;
    const route = isAppSender(port.sender, message.appUrl) ? appRoute(message.appUrl) : null;
    const legacy = message.kind === "IMPORT";
    if (legacy && route !== "ankauf" || !legacy && route !== "marktanalyse") {
      port.disconnect();
      return;
    }
    const url = portalUrl(message.url);
    const portal = url ? portalOf(url) : null;
    if (!url || legacy && portal !== "MOBILE_DE") {
      port.postMessage({ kind: "ERROR", error: legacy ? "Bitte einen gültigen mobile.de-Link verwenden." : "Bitte einen Link von mobile.de, AutoScout24 oder Kleinanzeigen verwenden." });
      return;
    }
    if (legacy && !mobileListingId(url) && isMobileSearchPage(url)) {
      port.postMessage({ kind: "ERROR", error: LISTING_REQUIRED });
      return;
    }
    const appTabId = port.sender.tab.id;
    job = {
      port, appTabId, url, portal, legacy,
      pageKind: legacy || message.pageKind !== "search" ? "listing" : "search",
      listingId: legacy ? mobileListingId(url) : null,
      connected: true, cancelled: false,
    };
    if (legacy) {
      const previous = importJobs.get(appTabId);
      if (previous) previous.cancelled = true;
      importJobs.set(appTabId, job);
      loadPage(job);
    } else {
      enqueue(job);
    }
  });
  port.onDisconnect.addListener(() => {
    if (job) {
      job.connected = false;
      if (!job.succeeded) job.cancelled = true;
    }
  });
});
