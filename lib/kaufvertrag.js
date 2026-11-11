// Kaufverträge – maps the stored Autogalerie contract (flat fields, as it was
// always saved) to the shape the Händlerportal pages work with, and back.
// Client-safe: no database imports here. Old contracts are never rewritten.

import { DAY_RE, berlinDay, normVin, parseEuro } from "@/lib/sales";

/** paymentNote text (stored, printed on the contract) ↔ payment method key */
export const PAYMENT_NOTES = {
  cash: "Barzahlung bei Abholung",
  transfer: "Bezahlung per Überweisung",
  financing: "Betrag wird finanziert",
};

export function paymentKeyOf(note) {
  const s = String(note || "").toLowerCase();
  if (s.includes("überweis")) return "transfer";
  if (s.includes("finanz")) return "financing";
  if (s.includes("bar")) return "cash";
  return "";
}

/** "52428 Jülich" → { zip: "52428", city: "Jülich" } */
export function splitCity(value) {
  const s = String(value || "").trim();
  const m = s.match(/^(\d{4,5})\s+(.+)$/);
  return m ? { zip: m[1], city: m[2] } : { zip: "", city: s };
}

/** any stored date → "YYYY-MM-DD" (Berlin) or "" */
export function toDay(value) {
  if (!value) return "";
  const s = String(value);
  if (DAY_RE.test(s)) return s;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : berlinDay(d);
}

/** "85.000 km" | "85000" → 85000 (null when empty) */
export function parseKm(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

export function agreementsOf(value) {
  if (Array.isArray(value)) return value.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\r?\n|;/)
      .map((l) => l.replace(/^\* /, "").trim())
      .filter(Boolean);
  }
  return [];
}

/** Stored Kaufvertrag → contract shape used by the pages */
export function toContract(d = {}) {
  const date = toDay(d.invoiceDate) || toDay(d.createdAt);
  const { zip, city } = splitCity(d.buyerCity);
  const cancelled = Boolean(d.ignored);
  return {
    _id: String(d._id || ""),
    issuer: d.issuer || "karim",
    title: d.title || "Kaufvertrag",
    number: d.invoiceNumber || "",
    status: cancelled ? "cancelled" : "active",
    archived: Boolean(d.archived),
    date,
    year: date ? Number(date.slice(0, 4)) : null,
    buyer: {
      name: d.buyerName || "",
      street: d.buyerStreet || "",
      zip,
      city,
      phone: d.phone || "",
      email: d.email || "",
      idNumber: d.idNumber || "",
    },
    vehicle: {
      name: d.carType || "",
      vin: d.vin || "",
      firstRegistration: d.firstRegistration || "",
      mileage: parseKm(d.mileage),
    },
    warranty: d.warranty === "excluded" ? "none" : d.warranty === "12months" ? "12m" : "",
    agreements: agreementsOf(d.agreements),
    handover: {
      brief: Boolean(d.kfzBrief),
      schein: Boolean(d.kfzSchein),
      tuevUntil: d.tuev || "",
      keyCount: Number(d.keys) || 0,
    },
    total: Number(d.total) || 0,
    deposit: Number(d.downPayment) || 0,
    paymentNote: d.paymentNote || "",
    paymentMethod: paymentKeyOf(d.paymentNote),
    paid: d.paid === true,
    paidAt: d.paidAt || "",
    starred: Boolean(d.starred),
    cancelledAt: d.cancelledAt || null,
    cancelledBy: d.cancelledBy || "",
    cancelReason: d.cancelReason || "",
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null,
  };
}

/** Row for the contract list */
export function contractRow(d) {
  const c = toContract(d);
  return {
    _id: c._id,
    number: c.number,
    status: c.status,
    date: c.date,
    year: c.year,
    archived: c.archived,
    buyerName: c.buyer.name,
    buyerPhone: c.buyer.phone,
    buyerEmail: c.buyer.email,
    buyerCity: c.buyer.city,
    vehicleName: c.vehicle.name,
    vin: c.vehicle.vin,
    total: c.total,
    deposit: c.deposit,
    paid: c.paid,
    starred: c.starred,
    paymentMethod: c.paymentMethod,
    paidAt: c.paidAt,
  };
}

/**
 * Form (Händlerportal shape) → stored fields. Keeps the old flat fields, so the
 * printed Kaufvertrag, the Fahrzeugverwaltung and everything else keep working.
 */
export function fromForm(f = {}) {
  const b = f.buyer || {};
  const v = f.vehicle || {};
  const h = f.handover || {};
  const km = parseKm(v.mileage);
  return {
    invoiceDate: DAY_RE.test(String(f.date || "")) ? f.date : berlinDay(),
    buyerName: String(b.name || "").trim(),
    buyerStreet: String(b.street || "").trim(),
    buyerCity: [String(b.zip || "").trim(), String(b.city || "").trim()].filter(Boolean).join(" "),
    phone: String(b.phone || "").trim(),
    email: String(b.email || "").trim(),
    idNumber: String(b.idNumber || "").trim(),
    carType: String(v.name || "").trim(),
    vin: normVin(v.vin),
    firstRegistration: String(v.firstRegistration || "").trim(),
    mileage: km == null ? "" : new Intl.NumberFormat("de-DE").format(km),
    warranty: f.warranty === "none" ? "excluded" : f.warranty === "12m" ? "12months" : "",
    agreements: agreementsOf(f.agreements),
    kfzBrief: Boolean(h.brief),
    kfzSchein: Boolean(h.schein),
    tuev: String(h.tuevUntil || "").trim(),
    keys: Number.parseInt(h.keyCount, 10) || 0,
    total: parseEuro(f.total) ?? 0,
    downPayment: parseEuro(f.deposit) ?? 0,
    paymentNote: PAYMENT_NOTES[f.paymentMethod] || "",
  };
}

/** Contract shape → the flat object the printed document is drawn from */
export function toPrint(c) {
  return {
    issuer: c.issuer,
    title: c.title || "Kaufvertrag",
    buyerName: c.buyer.name,
    buyerStreet: c.buyer.street,
    buyerCity: [c.buyer.zip, c.buyer.city].filter(Boolean).join(" "),
    invoiceNumber: c.number,
    invoiceDate: c.date,
    idNumber: c.buyer.idNumber,
    phone: c.buyer.phone,
    email: c.buyer.email,
    carType: c.vehicle.name,
    vin: c.vehicle.vin,
    firstRegistration: c.vehicle.firstRegistration,
    mileage: c.vehicle.mileage == null ? "" : String(c.vehicle.mileage),
    warranty: c.warranty === "none" ? "excluded" : c.warranty === "12m" ? "12months" : "",
    agreements: c.agreements,
    kfzBrief: c.handover.brief,
    kfzSchein: c.handover.schein,
    tuev: c.handover.tuevUntil,
    keys: c.handover.keyCount,
    total: c.total,
    downPayment: c.deposit,
    paymentNote: c.paymentNote,
  };
}
