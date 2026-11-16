/**
 * Marktanalyse – Suche nach Vergleichsfahrzeugen.
 *
 * Aus dem analysierten Fahrzeug werden Suchfilter gebaut (in drei Schritten
 * von eng nach weit) und daraus die Suchadressen der drei Portale.
 * Rein: keine Netzwerkzugriffe, läuft im Browser und auf dem Server.
 *
 * Geprüft gegen die Portale im November 2026:
 *   mobile.de      suchen.mobile.de/fahrzeuge/search.html?ms=<Marke>;<Modell>;;
 *                  Leistung in kW, neueste zuerst mit sb=doc&od=down.
 *                  /auto/<marke>-<modell>.html liefert die ms-Nummern.
 *   AutoScout24    /lst/<marke>/<modell>?…, Leistung mit powertype=kw.
 *   Kleinanzeigen  /s-autos/anbieter:…/c216+autos.<merkmal>:<wert>
 */

import { TUNING } from "./knowledge/defaults.js";
import { norm } from "./text.js";

const MAKE_ALIASES = {
  vw: "volkswagen", mercedes: "mercedes-benz", "mercedes benz": "mercedes-benz",
  mb: "mercedes-benz", skoda: "skoda", "alfa": "alfa romeo", "land-rover": "land rover",
  citroen: "citroen", "ds": "ds automobiles", "mini cooper": "mini",
};

/** "VW" → "volkswagen", "Mercedes" → "mercedes-benz". */
export function makeName(make) {
  const key = norm(make).replace(/[^a-z0-9 -]/g, "").trim();
  return MAKE_ALIASES[key] || key;
}

const slug = (value, joiner = "-") =>
  norm(value).replace(/[^a-z0-9]+/g, joiner).replace(new RegExp(`^${joiner}+|${joiner}+$`, "g"), "");

/** Suchfilter für einen Schritt (1 = eng … 3 = weit). */
export function buildFilter(subject, stepNumber = 1) {
  const step = TUNING.steps[Math.min(TUNING.steps.length, Math.max(1, stepNumber)) - 1];
  const year = Math.floor(subject.regMonths / 12);
  const km = subject.mileageKm ?? 0;
  const kmDelta = Math.max(km * step.km, 6000 + 4000 * stepNumber);
  const ps = subject.powerPs || null;
  const psDelta = ps ? Math.max(ps * step.ps, 6 + 2 * stepNumber) : 0;
  return {
    step: stepNumber,
    make: subject.make,
    model: subject.model,
    yearMin: year - step.ez,
    yearMax: Math.min(new Date().getFullYear(), year + step.ez),
    kmMin: Math.max(0, Math.floor((km - kmDelta) / 1000) * 1000),
    kmMax: Math.ceil((km + kmDelta) / 1000) * 1000,
    psMin: ps ? Math.floor(ps - psDelta) : null,
    psMax: ps ? Math.ceil(ps + psDelta) : null,
    fuel: subject.fuel || null,
    gearbox: subject.gearbox || null,
  };
}

const kw = (ps, round) => round(ps * 0.7355);

/* ------------------------------------------------------------ mobile.de */

const MOBILE_FUEL = { PETROL: "PETROL", DIESEL: "DIESEL", ELECTRIC: "ELECTRICITY", HYBRID: "HYBRID", PLUGIN_HYBRID: "HYBRID", LPG: "LPG", CNG: "CNG" };

/** Seite, aus der die mobile.de-Nummern für Marke und Modell gelesen werden. */
export function mobileModelPage(make, model) {
  const m = slug(makeName(make));
  const mo = slug(model);
  return m ? `https://suchen.mobile.de/auto/${mo ? `${m}-${mo}` : m}.html` : null;
}

/** @param ms "25200;14;;" oder "25200;;;Golf" */
export function mobileSearchUrl(filter, ms, page = 1) {
  if (!ms) return null;
  const p = new URLSearchParams({ isSearchRequest: "true", s: "Car", vc: "Car", ms, cn: "DE", dam: "false", sb: "doc", od: "down" });
  p.set("fr", `${filter.yearMin}:${filter.yearMax}`);
  p.set("ml", `${filter.kmMin}:${filter.kmMax}`);
  if (filter.psMin) p.set("pw", `${kw(filter.psMin, Math.floor)}:${kw(filter.psMax, Math.ceil)}`);
  if (MOBILE_FUEL[filter.fuel]) p.set("ft", MOBILE_FUEL[filter.fuel]);
  if (filter.gearbox === "MANUAL") p.set("tr", "MANUAL_GEAR");
  if (filter.gearbox === "AUTOMATIC") p.set("tr", "AUTOMATIC_GEAR");
  if (page > 1) p.set("pageNumber", String(page));
  return `https://suchen.mobile.de/fahrzeuge/search.html?${p.toString()}`;
}

/* ------------------------------------------------------------ AutoScout24 */

const AS24_FUEL = { PETROL: "B", DIESEL: "D", HYBRID: "2,3", PLUGIN_HYBRID: "2,3", ELECTRIC: "E", LPG: "L", CNG: "C" };

export function autoscoutSearchUrl(filter, page = 1) {
  const make = slug(makeName(filter.make));
  if (!make) return null;
  const model = slug(filter.model);
  const p = new URLSearchParams({ atype: "C", cy: "D", ustate: "N,U", damaged_listing: "exclude", sort: "age", desc: "1", size: "20", page: String(page) });
  p.set("fregfrom", String(filter.yearMin));
  p.set("fregto", String(filter.yearMax));
  p.set("kmfrom", String(filter.kmMin));
  p.set("kmto", String(filter.kmMax));
  if (filter.psMin) {
    p.set("powertype", "kw");
    p.set("powerfrom", String(kw(filter.psMin, Math.floor)));
    p.set("powerto", String(kw(filter.psMax, Math.ceil)));
  }
  if (AS24_FUEL[filter.fuel]) p.set("fuel", AS24_FUEL[filter.fuel]);
  if (filter.gearbox === "MANUAL") p.set("gear", "M");
  if (filter.gearbox === "AUTOMATIC") p.set("gear", "A");
  return `https://www.autoscout24.de/lst/${make}${model ? `/${model}` : ""}?${p.toString()}`;
}

/* ------------------------------------------------------------ Kleinanzeigen */

const KA_FUEL = { PETROL: "benzin", DIESEL: "diesel", HYBRID: "hybrid", PLUGIN_HYBRID: "hybrid", ELECTRIC: "elektro", LPG: "lpg", CNG: "cng" };
const KA_MAKE = { "mercedes-benz": "mercedes_benz", "alfa romeo": "alfa_romeo", "land rover": "land_rover", "ds automobiles": "ds_automobiles" };

/** Kleinanzeigen führt Baureihen ("3er", "C-Klasse"), keine Motorvarianten. */
export function kleinanzeigenModel(make, model) {
  const brand = makeName(make);
  // Apostrophe weglassen: "cee'd Sportswagon" heißt bei Kleinanzeigen "ceed_sportswagon".
  const text = norm(String(model ?? "").replace(/['’`´]/g, ""));
  if (!text) return null;
  if (brand === "bmw") {
    let m = text.match(/^([1-8])(?:er|\d{2})/);
    if (m) return `${m[1]}er`;
    m = text.match(/^(x|z|i|m)\s?\d/);
    return m ? `${m[1]}_reihe` : null;
  }
  if (brand === "mercedes-benz") {
    const m = text.match(/^([abcegsv])[ -]?(?:klasse|\d{2,3})/);
    if (m) return `${m[1]}_klasse`;
    return /^[a-z]{2,3}\b/.test(text) ? text.match(/^[a-z]{2,3}/)[0] : null;
  }
  return slug(text.split(/\s+/).slice(0, 2).join(" "), "_") || null;
}

/** Zwei Suchen: gewerblich und privat – die Trefferliste nennt den Anbietertyp nicht. */
export function kleinanzeigenSearchUrls(filter, page = 1) {
  const brand = makeName(filter.make);
  if (!brand) return [];
  const make = KA_MAKE[brand] || slug(brand, "_");
  const model = kleinanzeigenModel(filter.make, filter.model);
  const attributes = [
    `autos.ez_i:${filter.yearMin}%2C${filter.yearMax}`,
    `autos.km_i:${filter.kmMin}%2C${filter.kmMax}`,
    `autos.marke_s:${make}`,
  ];
  if (model) attributes.push(`autos.model_s:${model}`);
  if (KA_FUEL[filter.fuel]) attributes.push(`autos.fuel_s:${KA_FUEL[filter.fuel]}`);
  if (filter.gearbox === "MANUAL") attributes.push("autos.shift_s:manuell");
  if (filter.gearbox === "AUTOMATIC") attributes.push("autos.shift_s:automatik");
  attributes.sort();
  return ["DEALER", "PRIVATE"].map((seller) => ({
    seller,
    url: `https://www.kleinanzeigen.de/s-autos/anbieter:${seller === "DEALER" ? "gewerblich" : "privat"}/anzeige:angebote/${page > 1 ? `seite:${page}/` : ""}${["c216", ...attributes].join("+")}`,
  }));
}

/* ------------------------------------------------------------ Link-Erkennung */

/** Welches Portal? Nur echte Portal-Adressen, keine Umleitungen über fremde Seiten. */
export function portalOf(value) {
  try {
    const url = new URL(String(value).trim());
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === "mobile.de" || host.endsWith(".mobile.de")) return "MOBILE_DE";
    if (host === "autoscout24.de" || host.endsWith(".autoscout24.de")) return "AUTOSCOUT24";
    if (host === "kleinanzeigen.de" || host.endsWith(".kleinanzeigen.de")) return "KLEINANZEIGEN";
    return null;
  } catch {
    return null;
  }
}

/** Die Anzeigennummer aus dem Link – erkennt das Fahrzeug in Trefferlisten wieder. */
export function listingIdOf(value) {
  const portal = portalOf(value);
  if (!portal) return null;
  const url = new URL(String(value).trim());
  if (portal === "MOBILE_DE") {
    const id = url.searchParams.get("id");
    return /^\d{3,}$/.test(id || "") ? id : url.pathname.match(/(\d{6,})(?:\.html?)?\/?$/)?.[1] || null;
  }
  if (portal === "KLEINANZEIGEN") return url.pathname.match(/\/s-anzeige\/[^/]+\/(\d{6,})/)?.[1] || null;
  return url.pathname.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1]?.toLowerCase() || null;
}

/** Ist das der Link zu EINER Anzeige (und keine Suchseite)? */
export function isListingUrl(value) {
  const portal = portalOf(value);
  if (!portal) return false;
  const url = new URL(String(value).trim());
  if (portal === "MOBILE_DE") return Boolean(listingIdOf(value)) && !/\/search\.html/.test(url.pathname);
  if (portal === "KLEINANZEIGEN") return /\/s-anzeige\//.test(url.pathname);
  return /\/angebote\//.test(url.pathname);
}
