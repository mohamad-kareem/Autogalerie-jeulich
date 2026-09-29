/**
 * Fahrzeugverwaltung — shared constants and small helpers.
 * The data lives in /api/carschein (models/CarSchein.js); this page only reads
 * and writes it through that API, like the Dashboard, Schlüssel and
 * Rotkennzeichen pages do.
 */

import { FiCheckCircle, FiDroplet, FiMapPin, FiShield, FiTool } from "react-icons/fi";

export const LIST_LIMIT = 100; // newest vehicles loaded from the API
export const PAGE_SIZE = 25; // rows per page in the list

// All vehicles belong to the same dealer; new ones are saved with this name.
export const DEFAULT_OWNER = "Karim";

export const ROT_PLATES = [
  { id: "DN-06919", label: "DN-06919" },
  { id: "DN-06921", label: "DN-06921" },
  { id: "BEIDE", label: "Beide" },
];

export const STAGES = [
  { id: "WERKSTATT", label: "Werkstatt", icon: FiTool, hint: "Reparatur oder Wartung" },
  { id: "AUFBEREITUNG", label: "Aufbereitung", icon: FiDroplet, hint: "Reinigung und Pflege" },
  { id: "PLATZ", label: "In Boora", icon: FiMapPin, hint: "Steht zum Verkauf bereit" },
  { id: "TUEV", label: "TÜV", icon: FiShield, hint: "Hauptuntersuchung" },
  { id: "SOLD", label: "Verkauft", icon: FiCheckCircle, hint: "An Kunden übergeben" },
];

export function normalizeStage(stage) {
  const id = String(stage || "WERKSTATT").toUpperCase();
  return STAGES.some((entry) => entry.id === id) ? id : "WERKSTATT";
}

/** The label a vehicle's phase shows; TÜV says whether it passed. */
export function stageLabel(stage, stageMeta) {
  const id = normalizeStage(stage);
  if (id === "TUEV") return stageMeta?.tuev?.passed ? "TÜV Bestanden" : "TÜV Nicht bestanden";
  return STAGES.find((entry) => entry.id === id)?.label || "Werkstatt";
}

/** Status badge colours per phase: [light, dark]. A failed TÜV is red. */
const STAGE_BADGES = {
  WERKSTATT: ["bg-amber-50 text-amber-800 ring-amber-600/20", "bg-amber-400/10 text-amber-300 ring-amber-400/25"],
  AUFBEREITUNG: ["bg-sky-50 text-sky-700 ring-sky-600/20", "bg-sky-400/10 text-sky-300 ring-sky-400/25"],
  PLATZ: ["bg-slate-100 text-slate-700 ring-slate-500/20", "bg-slate-400/10 text-slate-300 ring-slate-400/25"],
  TUEV: ["bg-violet-50 text-violet-700 ring-violet-600/20", "bg-violet-400/10 text-violet-300 ring-violet-400/25"],
  TUEV_FAILED: ["bg-red-50 text-red-700 ring-red-600/20", "bg-red-400/10 text-red-300 ring-red-400/25"],
  SOLD: ["bg-emerald-50 text-emerald-700 ring-emerald-600/20", "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"],
};

const STAGE_DOTS = {
  WERKSTATT: "bg-amber-500",
  AUFBEREITUNG: "bg-sky-500",
  PLATZ: "bg-slate-400",
  TUEV: "bg-violet-500",
  TUEV_FAILED: "bg-red-500",
  SOLD: "bg-emerald-500",
};

function toneKey(stage, stageMeta) {
  const id = normalizeStage(stage);
  return id === "TUEV" && !stageMeta?.tuev?.passed ? "TUEV_FAILED" : id;
}

/** Classes for a phase badge and its dot. */
export function stageBadge(stage, stageMeta, dark) {
  const key = toneKey(stage, stageMeta);
  return { badge: STAGE_BADGES[key][dark ? 1 : 0], dot: STAGE_DOTS[key] };
}

/**
 * TÜV of a car standing in Boora: { text: "TÜV bis 05/2027", expired } or null.
 */
export function platzTuev(schein) {
  if (normalizeStage(schein?.stage) !== "PLATZ") return null;
  const platz = schein?.stageMeta?.platz || {};
  if (!platz.hasTuev) return null;
  const match = String(platz.tuevUntil || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return { text: "TÜV vorhanden", expired: false };
  const now = new Date();
  const expired = Number(match[1]) * 12 + Number(match[2]) < now.getFullYear() * 12 + now.getMonth() + 1;
  return { text: `${expired ? "TÜV abgelaufen" : "TÜV bis"} ${match[2]}/${match[1]}`, expired };
}

/** One short line about the current phase (where, what, defects …). */
export function stageDetail(schein) {
  const meta = schein?.stageMeta || {};
  switch (normalizeStage(schein?.stage)) {
    case "WERKSTATT":
      return [meta.werkstatt?.where, meta.werkstatt?.what].filter(Boolean).join(" · ");
    case "PLATZ":
      return meta.platz?.note || "";
    case "TUEV": {
      if (meta.tuev?.passed) return "";
      const issues = Array.isArray(meta.tuev?.issues) ? meta.tuev.issues.length : 0;
      return issues ? `${issues} ${issues === 1 ? "Mangel" : "Mängel"}` : "";
    }
    default:
      return "";
  }
}

/* ------------------------------------------------------------ warranty */

/** One year of warranty from the sale date. */
export function computeWarranty(schein) {
  if (!schein?.keySold) return { status: "not_sold", label: "Nicht verkauft" };
  const soldAt = schein?.soldAt ? new Date(schein.soldAt) : null;
  if (!soldAt || Number.isNaN(soldAt.getTime())) return { status: "missing_date", label: "Verkauft (Datum fehlt)" };

  const end = new Date(soldAt);
  end.setFullYear(end.getFullYear() + 1);
  const remainingMs = end.getTime() - Date.now();
  if (remainingMs > 0) {
    const remainingDays = Math.ceil(remainingMs / 86_400_000);
    return { status: "active", soldAt, end, remainingDays, label: `Garantie aktiv · ${remainingDays} Tage übrig` };
  }
  return { status: "expired", soldAt, end, remainingDays: 0, label: `Garantie abgelaufen (Ende: ${end.toLocaleDateString("de-DE")})` };
}

/* ------------------------------------------------------------ formatting */

export function formatDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "–" : date.toLocaleDateString("de-DE");
}

/** yyyy-mm-dd for <input type="date">, in local time. */
export function toDateInput(value) {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatCost(cost) {
  if (cost === null || cost === undefined || cost === "") return "–";
  const number = Number(cost);
  return Number.isFinite(number) ? `${number.toFixed(2).replace(".", ",")} €` : "–";
}

export function notesOf(schein) {
  if (Array.isArray(schein?.notes)) return schein.notes;
  if (!schein?.notes) return [];
  return String(schein.notes).split("\n").map((note) => note.trim()).filter(Boolean);
}

/** The buyer, when the API populated it. */
export function soldContactOf(schein) {
  const contact = schein?.soldContactId;
  return contact && typeof contact === "object" && (contact._id || contact.customerName || contact.phone) ? contact : null;
}

export function addressOf(contact) {
  if (!contact) return "";
  return [contact.street, [contact.postalCode, contact.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
}
