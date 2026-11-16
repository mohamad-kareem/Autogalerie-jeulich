/**
 * Marktanalyse – Ablauf im Browser.
 *
 * Holt über die Browser-Erweiterung die Anzeige und die Suchseiten der drei
 * Portale, lässt sie vom Server lesen und schickt am Ende alles zur Bewertung.
 * Gesucht wird in bis zu drei Schritten von eng nach weit, bis genug gute
 * Vergleichsfahrzeuge da sind.
 */

import { fetchPortalPage } from "@/lib/ankauf/helperExtension";
import { usableCount } from "./comparables.js";
import { PORTAL_LABEL, TUNING } from "./knowledge/defaults.js";
import { slimPage } from "./portalPages.js";
import {
  autoscoutSearchUrl, buildFilter, isListingUrl, listingIdOf, kleinanzeigenSearchUrls, makeName,
  mobileModelPage, mobileSearchUrl, portalOf,
} from "./search.js";

const PORTALS = ["MOBILE_DE", "AUTOSCOUT24", "KLEINANZEIGEN"];
const PAGE_SIZE = 20;

async function post(path, body, signal) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Der Server hat die Anfrage abgelehnt.");
  return data;
}

async function loadAndParse(url, kind, { signal, seller, onStatus } = {}) {
  const portal = portalOf(url);
  const pageKind = kind === "listing" ? "listing" : "search";
  const page = await fetchPortalPage(url, { pageKind, signal, onStatus });
  // Die Anzeige geht ganz zum Server, Trefferlisten verschlankt.
  let html = pageKind === "search" || page.html.length > 3_500_000 ? slimPage(portal, pageKind, page.html) : page.html;
  if (html.length > 3_900_000) html = slimPage(portal, pageKind, html).slice(0, 3_900_000);
  // Der Server prüft die Adresse; nach einer Weiterleitung zählt die neue.
  const finalUrl = portalOf(page.url) === portal ? page.url : url;
  // Gelöschte oder verkaufte Anzeigen leiten auf eine Trefferliste oder eine andere Anzeige um.
  if (kind === "listing" && (!isListingUrl(finalUrl) || (listingIdOf(url) && listingIdOf(finalUrl) && listingIdOf(url) !== listingIdOf(finalUrl)))) {
    throw new Error("Diese Anzeige gibt es nicht mehr – sie wurde gelöscht oder das Fahrzeug ist verkauft. Das Portal hat stattdessen eine andere Seite geöffnet.");
  }
  return post("/api/marktanalyse/parse", { kind, url: kind === "listing" && !isListingUrl(finalUrl) ? url : finalUrl, html, seller }, signal);
}

/** mobile.de sucht mit Nummern für Marke und Modell ("25200;14;;"). */
async function mobileMs(subject, signal) {
  if (subject.mobile?.makeId) return `${subject.mobile.makeId};${subject.mobile.modelId || ""};;${subject.mobile.modelId ? "" : subject.model}`;
  const cacheKey = `marktanalyse.ms:${makeName(subject.make)}|${String(subject.model).toLowerCase()}`;
  try {
    const cached = window.localStorage.getItem(cacheKey);
    if (/^\d+;/.test(cached || "")) return cached;
  } catch { /* ohne Speicher wird jedes Mal nachgesehen */ }

  let ms = null;
  const exact = await loadAndParse(mobileModelPage(subject.make, subject.model), "mobile-model", { signal }).catch((error) => {
    if (error?.name === "AbortError") throw error;
    return null;
  });
  if (exact?.ok && exact.modelId) ms = exact.ms;
  else {
    // Modell unter diesem Namen nicht gefunden: Marke nachschlagen und nach dem Modellnamen suchen.
    const make = exact?.ok ? exact : await loadAndParse(mobileModelPage(subject.make, ""), "mobile-model", { signal });
    if (make?.ok && make.makeId) ms = `${make.makeId};;;${subject.model}`;
  }
  if (!ms) throw new Error("Marke und Modell wurden bei mobile.de nicht gefunden.");
  try {
    if (/^\d+;\d+;/.test(ms)) window.localStorage.setItem(cacheKey, ms);
  } catch { /* nicht schlimm */ }
  return ms;
}

/**
 * @param url         Link der Anzeige
 * @param onProgress  ({ stage, message, subject?, portals, step, usable }) => void
 * @returns { id, subject, report }
 */
export async function runAnalysis(url, { signal, onProgress = () => {} } = {}) {
  const portal = portalOf(url);
  if (!portal) throw new Error("Bitte einen Link von mobile.de, AutoScout24 oder Kleinanzeigen einfügen.");
  if (!isListingUrl(url)) throw new Error("Das ist keine einzelne Fahrzeuganzeige. Bitte die Anzeige öffnen und deren Link einfügen.");

  const portals = Object.fromEntries(PORTALS.map((name) => [name, { state: "wartet", found: 0, total: null, pages: 0, error: null, ok: false, complete: false }]));
  const items = new Map();
  let subject = null;
  let step = 0;
  let usable = 0;
  const report = (stage, message) => onProgress({ stage, message, subject, portals: structuredClone(portals), step, usable });

  // Portale für die Vergleichsfahrzeuge laut Einstellungen; die Anzeige selbst darf von jedem Portal sein.
  let active = PORTALS;
  try {
    const response = await fetch("/api/marktanalyse/einstellungen", { cache: "no-store", signal });
    const chosen = (await response.json())?.settings?.portals;
    if (response.ok && Array.isArray(chosen)) active = PORTALS.filter((name) => chosen.includes(name));
    if (!active.length) active = PORTALS;
  } catch (error) {
    if (error?.name === "AbortError") throw error;
  }
  for (const name of PORTALS) if (!active.includes(name)) portals[name].state = "ausgelassen";

  /* ---- 1. die Anzeige ---- */
  report("listing", `Anzeige wird bei ${PORTAL_LABEL[portal]} geöffnet …`);
  const listing = await loadAndParse(url, "listing", {
    signal,
    onStatus: (status) => report("listing", status === "WAITING" ? `${PORTAL_LABEL[portal]} wartet auf eine Bestätigung im geöffneten Tab …` : `Anzeige wird bei ${PORTAL_LABEL[portal]} gelesen …`),
  });
  subject = listing.subject;
  if (listing.missing?.length) throw new Error(`In der Anzeige fehlt: ${listing.missing.join(", ")}. Ohne diese Angaben ist keine Bewertung möglich.`);
  report("listing", "Anzeige gelesen.");

  /* ---- 2. Vergleichsfahrzeuge, Schritt für Schritt weiter ---- */
  let ms = null;
  let filter = null;

  async function searchPortal(name, currentFilter, maxPages) {
    const state = portals[name];
    if (state.state === "fehler" || state.state === "ausgelassen") return;
    // Wer schon reichlich geliefert hat, wird nicht noch einmal weiter gefragt.
    if (currentFilter.step > 1 && state.found >= 50) return;
    state.state = "laedt";
    state.complete = false;
    const add = (list) => {
      for (const item of list || []) if (item?.key && !items.has(item.key)) items.set(item.key, item);
      state.found = [...items.values()].filter((item) => item.source === name).length;
    };
    const onStatus = (status) => {
      if (status === "WAITING") report("search", `${PORTAL_LABEL[name]} wartet auf eine Bestätigung im geöffneten Tab …`);
    };
    try {
      if (name === "KLEINANZEIGEN") {
        let complete = true;
        for (const search of kleinanzeigenSearchUrls(currentFilter)) {
          if (search.seller === "DEALER" || !state.searchUrl) state.searchUrl = search.url;
          const result = await loadAndParse(search.url, "search", { signal, seller: search.seller, onStatus });
          if (!result.ok && result.error) throw new Error(result.error);
          add(result.items);
          state.pages += 1;
          if (result.hasMore) complete = false;
          report("search");
        }
        state.complete = complete;
      } else {
        if (name === "MOBILE_DE" && !ms) ms = await mobileMs(subject, signal);
        let fetched = 0;
        for (let page = 1; page <= maxPages; page++) {
          const pageUrl = name === "MOBILE_DE" ? mobileSearchUrl(currentFilter, ms, page) : autoscoutSearchUrl(currentFilter, page);
          if (!pageUrl) throw new Error("Für dieses Fahrzeug lässt sich keine Suche bilden.");
          if (page === 1) state.searchUrl = pageUrl;
          const result = await loadAndParse(pageUrl, "search", { signal, onStatus });
          if (!result.ok) throw new Error(result.error || `${PORTAL_LABEL[name]} konnte nicht gelesen werden.`);
          add(result.items);
          fetched += result.items.length;
          state.pages += 1;
          if (Number.isFinite(result.total)) state.total = result.total;
          report("search");
          const more = Number.isFinite(result.total) ? page * PAGE_SIZE < result.total : result.items.length >= PAGE_SIZE;
          if (!more || !result.items.length) { state.complete = true; break; }
        }
        if (!state.complete && Number.isFinite(state.total)) state.complete = fetched >= state.total;
      }
      state.ok = true;
      state.state = "fertig";
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      state.error = error?.message || "nicht erreichbar";
      state.state = state.found ? "fertig" : "fehler";
      state.ok = state.found > 0;
      state.complete = false;
    }
    report("search");
  }

  for (step = 1; step <= TUNING.steps.length; step++) {
    filter = buildFilter(subject, step);
    const range = `EZ ${filter.yearMin}–${filter.yearMax}, ${filter.kmMin.toLocaleString("de-DE")}–${filter.kmMax.toLocaleString("de-DE")} km`;
    report("search", step === 1 ? `Vergleichsfahrzeuge werden gesucht (${range}) …` : `Zu wenige Treffer – Suche wird erweitert (${range}) …`);
    await Promise.all(active.map((name) => searchPortal(name, filter, step === 1 ? 3 : 2)));
    usable = usableCount(subject, [...items.values()]);
    report("search", `${usable} gute Händlerangebote gefunden.`);
    if (usable >= TUNING.enoughComparables) break;
    if (active.every((name) => portals[name].state === "fehler")) break;
  }
  step = Math.min(step, TUNING.steps.length);

  if (active.every((name) => portals[name].state === "fehler")) {
    throw new Error(`Kein Portal konnte gelesen werden: ${active.map((name) => `${PORTAL_LABEL[name]}: ${portals[name].error}`).join(" · ")}`);
  }

  /* ---- 3. bewerten ---- */
  report("analyse", "Bericht wird berechnet …");
  const result = await post("/api/marktanalyse/analyse", {
    subject,
    items: [...items.values()],
    meta: {
      step, filter,
      portals: Object.fromEntries(active.map((name) => {
        const { ok, complete, total, pages, error, searchUrl } = portals[name];
        return [name, { ok, complete, total, pages, error, searchUrl }];
      })),
    },
  }, signal);
  report("done", "Fertig.");
  return result;
}
