// Shared helpers for the selling part (contracts, vehicle files, customers).
// Client-safe: no database imports here.

/* ------------------------------ labels ------------------------------ */

export const PHASES = [
  { key: "werkstatt", label: "Werkstatt" },
  { key: "aufbereitung", label: "Aufbereitung" },
  { key: "platz", label: "Verkaufsbereit" },
  { key: "tuev", label: "TÜV" },
  { key: "verkauft", label: "Verkauft" },
];
export const PHASE_KEYS = PHASES.map((p) => p.key);
export const phaseLabel = (k) => PHASES.find((p) => p.key === k)?.label || "–";
export const PHASE_STYLES = {
  werkstatt: "bg-slate-100 text-slate-700",
  aufbereitung: "bg-amber-50 text-amber-700",
  platz: "bg-emerald-50 text-emerald-700",
  tuev: "bg-blue-50 text-blue-700",
  verkauft: "bg-rose-50 text-rose-700",
};

export const TUEV_STATUS = [
  { key: "", label: "Unbekannt" },
  { key: "ok", label: "Gültig" },
  { key: "due", label: "Fällig" },
  { key: "failed", label: "Nicht bestanden" },
];
export const tuevStatusLabel = (k) => TUEV_STATUS.find((t) => t.key === (k || ""))?.label || "Unbekannt";

export const PAYMENT_METHODS = [
  { key: "cash", label: "Bar bei Abholung" },
  { key: "transfer", label: "Überweisung" },
  { key: "financing", label: "Finanzierung" },
];
export const PAYMENT_KEYS = PAYMENT_METHODS.map((p) => p.key);
export const paymentLabel = (k) => PAYMENT_METHODS.find((p) => p.key === k)?.label || "–";

export const WARRANTY = [
  { key: "12m", label: "12 Monate ab Verkaufsdatum" },
  { key: "none", label: "Ausgeschlossen" },
];
export const warrantyLabel = (k) => WARRANTY.find((w) => w.key === k)?.label || "–";

export const CONTRACT_STATUS = { draft: "Entwurf", active: "Aktiv", cancelled: "Storniert" };

/* ---------------------------- normalising ---------------------------- */

/** FIN is always compared without spaces and in upper case. */
export const normVin = (v) => String(v ?? "").replace(/\s+/g, "").toUpperCase();

/** Phone numbers compared by digits only, +49 / 0049 → 0. */
export function normPhone(v) {
  let d = String(v ?? "").replace(/[^\d+]/g, "");
  if (d.startsWith("+49")) d = `0${d.slice(3)}`;
  else if (d.startsWith("0049")) d = `0${d.slice(4)}`;
  return d.replace(/\D/g, "");
}

export const normEmail = (v) => String(v ?? "").trim().toLowerCase();
/** name@domain.tld */
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? "").trim());
/** phone numbers: digits with spaces, "/", "-" and a leading "+" – no letters */
export const phoneChars = (v) => String(v ?? "").replace(/[^\d\s+/-]/g, "");
export const isPhone = (v) => /^\+?[\d\s/-]*\d[\d\s/-]*$/.test(String(v ?? "").trim());

export const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);

/* ------------------------------ money ------------------------------ */

const euroFmt = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 12500 → "12.500,00 €" */
export const formatEuro = (n) => `${euroFmt.format(Number(n) || 0)} €`;

/** "12.500,00" | "12500" | "12500.5" → 12500.5 (null when empty/invalid) */
export function parseEuro(v) {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  let s = String(v ?? "").replace(/[€\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export const remaining = (total, deposit) => Math.max(0, Math.round(((Number(total) || 0) - (Number(deposit) || 0)) * 100) / 100);

/* ------------------------------ dates ------------------------------ */

export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Date → "YYYY-MM-DD" in Europe/Berlin */
export const berlinDay = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date(d));

/** "2026-11-03" | Date → "03.11.2026" */
export function dateDE(v) {
  if (!v) return "";
  if (typeof v === "string" && DAY_RE.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}.${m}.${y}`;
  }
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/** "2027-05" → "05/2027" */
export const monthDE = (v) => (/^\d{4}-\d{2}$/.test(String(v || "")) ? `${v.slice(5, 7)}/${v.slice(0, 4)}` : "");

/** Accepts "05/2027", "5.2027", "2027-05" → "2027-05" (or "") */
export function parseMonth(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[./-](\d{4})$/);
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return `${m[2]}-${m[1].padStart(2, "0")}`;
  return "";
}

/** "2026-11-03" + 12 months → "2027-11-03" */
export function addMonthsDay(day, months) {
  if (!DAY_RE.test(String(day || ""))) return "";
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  // clamp 31.01 + 1 month → 28/29.02
  if (date.getUTCDate() !== d) date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(fromDay, toDay) {
  const a = Date.parse(`${fromDay}T00:00:00Z`);
  const b = Date.parse(`${toDay}T00:00:00Z`);
  return Number.isFinite(a) && Number.isFinite(b) ? Math.round((b - a) / 86400000) : null;
}

/** { active, days, label } for the 1-year warranty */
export function warrantyInfo(until, today = berlinDay()) {
  if (!until) return { active: false, days: 0, label: "Keine Gewährleistung" };
  const days = daysBetween(today, until);
  if (days == null || days < 0) return { active: false, days: 0, label: "Gewährleistung abgelaufen" };
  return { active: true, days, label: days === 1 ? "Gewährleistung noch 1 Tag" : `Gewährleistung noch ${days} Tage` };
}

/** TÜV month in the past? */
export function tuevExpired(tuevUntil, today = berlinDay()) {
  return /^\d{4}-\d{2}$/.test(String(tuevUntil || "")) && tuevUntil < today.slice(0, 7);
}

/* --------------------------- contract number --------------------------- */

/** (2026, 114) → "26-114" (running number has at least 3 digits) */
export const formatContractNumber = (year, seq) => `${String(year).slice(-2)}-${String(seq).padStart(3, "0")}`;

/** Running number of a contract number of that year – "26-114" (and old "RE-2026114") → 114, else 0 */
export const contractSeqOf = (number, year) => {
  const s = String(number || "");
  const yy = String(year).slice(-2);
  if (s.startsWith(`${yy}-`)) return Number(s.slice(3)) || 0;
  if (s.startsWith(`RE-${year}`)) return Number(s.slice(7)) || 0;
  return 0;
};

/* ------------------------------ warnings ------------------------------ */

/**
 * Warnings shown next to the contract form – and checked again on the server.
 * level "error" = must be confirmed before saving.
 */
export function vehicleWarnings(vehicle, { contractId = "", hasVin = true } = {}) {
  const out = [];
  if (!vehicle) {
    if (hasVin) out.push({ level: "warn", code: "no_file", text: "Keine Fahrzeugakte zu dieser FIN gefunden." });
    return out;
  }
  const sale = vehicle.sale;
  if (vehicle.phase === "verkauft" && sale && String(sale.contractId || sale.privateContractId || "") !== String(contractId || "")) {
    out.push({
      level: "error",
      code: "sold",
      text: `Bereits verkauft${sale.soldAt ? ` am ${dateDE(sale.soldAt)}` : ""}${sale.buyerName ? ` an ${sale.buyerName}` : ""}.`,
      href: sale.contractId ? `/dashboard/vertraege/${sale.contractId}` : sale.privateContractId ? `/dashboard/vertraege/privat/${sale.privateContractId}` : "",
      linkLabel: sale.contractNumber || "Vertrag",
    });
  }
  if (vehicle.tuevStatus === "failed") out.push({ level: "error", code: "tuev_failed", text: "TÜV nicht bestanden." });
  else if (tuevExpired(vehicle.tuevUntil)) out.push({ level: "error", code: "tuev_expired", text: `TÜV abgelaufen (${monthDE(vehicle.tuevUntil)}).` });
  else if (vehicle.tuevStatus === "due") out.push({ level: "warn", code: "tuev_due", text: "TÜV ist fällig." });
  if (vehicle.tankEmpty) out.push({ level: "warn", code: "tank", text: "Tank ist leer." });
  return out;
}

/** Does a list of agreements already cover a new TÜV? */
export const mentionsTuev = (list = []) => list.some((a) => /t[üu]e?v|\bhu\b|\bau\b/i.test(String(a)));

/* ------------------------------ misc ------------------------------ */

export const telHref = (phone) => {
  const d = normPhone(phone);
  return d ? `tel:${d.startsWith("0") ? `+49${d.slice(1)}` : d}` : "";
};

export const mapsHref = (parts) => {
  const q = parts.filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
};

export const buyerAddress = (b = {}) => [b.street, [b.zip, b.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

/** mobile.de enum → German label (kept small on purpose) */
export const FUEL_DE = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  ELECTRICITY: "Elektro",
  HYBRID: "Hybrid (Benzin)",
  HYBRID_DIESEL: "Hybrid (Diesel)",
  LPG: "Autogas (LPG)",
  CNG: "Erdgas (CNG)",
  ETHANOL: "Ethanol",
  HYDROGENIUM: "Wasserstoff",
  OTHER: "Sonstige",
};
export const GEARBOX_DE = { MANUAL_GEAR: "Schaltgetriebe", AUTOMATIC_GEAR: "Automatik", SEMIAUTOMATIC_GEAR: "Halbautomatik" };
