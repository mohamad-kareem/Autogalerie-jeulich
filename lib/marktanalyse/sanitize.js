/**
 * Marktanalyse – Eingaben aus dem Browser prüfen. Der Server übernimmt nur
 * bekannte Felder im erwarteten Typ; Links müssen auf eines der drei Portale zeigen.
 */

import { portalOf } from "./search.js";
import { regMonths } from "./text.js";

const text = (value, max = 300) => (typeof value === "string" ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : null) || null;
const number = (value, min, max) => (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? Math.round(value) : null);
const one = (value, allowed, fallback = null) => (allowed.includes(value) ? value : fallback);
const link = (value) => (typeof value === "string" && value.length < 1200 && portalOf(value) ? new URL(value.trim()).toString() : null);
const image = (value) => (typeof value === "string" && /^https:\/\/[^\s"'<>]{8,600}$/.test(value) ? value : null);

const FUELS = ["PETROL", "DIESEL", "HYBRID", "PLUGIN_HYBRID", "ELECTRIC", "LPG", "CNG"];
const GEARS = ["MANUAL", "AUTOMATIC"];
const SELLERS = ["DEALER", "PRIVATE", "UNKNOWN"];
const SOURCES = ["MOBILE_DE", "AUTOSCOUT24", "KLEINANZEIGEN"];

export function cleanSubject(input) {
  if (!input || typeof input !== "object") return null;
  const url = link(input.url);
  if (!url) return null;
  const months = number(input.regMonths, 1950 * 12, 2100 * 12) ?? regMonths(input.firstRegistration);
  return {
    source: portalOf(url), url, id: text(input.id, 60), title: text(input.title, 200), make: text(input.make, 60), model: text(input.model, 60), variant: text(input.variant, 120),
    price: number(input.price, 1, 5_000_000), negotiable: input.negotiable === true,
    firstRegistration: text(input.firstRegistration, 12), regMonths: months, mileageKm: number(input.mileageKm, 0, 2_000_000),
    powerPs: number(input.powerPs, 5, 2500), ccm: number(input.ccm, 50, 12000), fuel: one(input.fuel, FUELS), gearbox: one(input.gearbox, GEARS),
    body: text(input.body, 60), color: text(input.color, 60), owners: number(input.owners, 0, 15), tuv: text(input.tuv, 12),
    accident: one(input.accident, ["NONE", "REPAIRED", "DAMAGED", "UNKNOWN"], "UNKNOWN"), conditionText: text(input.conditionText, 300), countryVersion: text(input.countryVersion, 80),
    serviceHistory: one(input.serviceHistory, ["YES", "NO", "UNKNOWN"], "UNKNOWN"), sellerType: one(input.sellerType, SELLERS, "UNKNOWN"), sellerName: text(input.sellerName, 120),
    location: text(input.location, 120), listedAt: text(input.listedAt, 40),
    equipment: Array.isArray(input.equipment) ? input.equipment.map((entry) => text(entry, 80)).filter(Boolean).slice(0, 120) : [],
    description: text(input.description, 6000) || "", image: image(input.image),
    rating: number(input.rating, 1, 5), oldPrice: number(input.oldPrice, 1, 5_000_000), emission: number(input.emission, 1, 7), as24Gen: number(input.as24Gen, 0, 99),
    mobile: input.mobile && typeof input.mobile === "object" ? { makeId: number(Number(input.mobile.makeId), 1, 1e7), modelId: number(Number(input.mobile.modelId), 1, 1e7) } : null,
  };
}

export function cleanItems(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const items = [];
  for (const raw of input.slice(0, 900)) {
    if (!raw || typeof raw !== "object") continue;
    const source = one(raw.source, SOURCES);
    const id = text(String(raw.id ?? ""), 60);
    const url = link(raw.url);
    if (!source || !id || !url || portalOf(url) !== source) continue;
    const key = `${source}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      key, source, id, url, title: text(raw.title, 200) || "Fahrzeug", make: text(raw.make, 60), model: text(raw.model, 60),
      price: number(raw.price, 1, 5_000_000), mileageKm: number(raw.mileageKm, 0, 2_000_000),
      firstRegistration: text(raw.firstRegistration, 12), regMonths: number(raw.regMonths, 1950 * 12, 2100 * 12) ?? regMonths(raw.firstRegistration),
      powerPs: number(raw.powerPs, 5, 2500), ccm: number(raw.ccm, 50, 12000), fuel: one(raw.fuel, FUELS), gearbox: one(raw.gearbox, GEARS),
      body: text(raw.body, 60), owners: number(raw.owners, 0, 15), sellerType: one(raw.sellerType, SELLERS, "UNKNOWN"),
      location: text(raw.location, 120), zip: text(raw.zip, 8), damaged: raw.damaged === true,
      rating: number(raw.rating, 1, 5), oldPrice: number(raw.oldPrice, 1, 5_000_000), emission: number(raw.emission, 1, 7), as24Gen: number(raw.as24Gen, 0, 99),
    });
  }
  return items;
}

export function cleanMeta(input) {
  const meta = input && typeof input === "object" ? input : {};
  const portals = {};
  for (const source of SOURCES) {
    const portal = meta.portals?.[source];
    if (!portal || typeof portal !== "object") continue;
    const searchUrl = link(portal.searchUrl);
    portals[source] = {
      ok: portal.ok === true,
      complete: portal.complete === true,
      total: number(portal.total, 0, 1e7),
      pages: number(portal.pages, 0, 100),
      error: text(portal.error, 200),
      searchUrl: portalOf(searchUrl) === source ? searchUrl : null,
    };
  }
  const f = meta.filter && typeof meta.filter === "object" ? meta.filter : null;
  const filter = f && [f.yearMin, f.yearMax, f.kmMin, f.kmMax].every(Number.isFinite)
    ? { yearMin: f.yearMin, yearMax: f.yearMax, kmMin: f.kmMin, kmMax: f.kmMax, psMin: number(f.psMin, 1, 2500), psMax: number(f.psMax, 1, 2500) } : null;
  return { step: number(meta.step, 1, 3) || 1, portals, filter };
}
