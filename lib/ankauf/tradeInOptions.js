// Shared by the public "Auto verkaufen" form and the staff "Ankauf" inbox.

export const TRADEIN_STATUS_LABELS = {
  new: "Neu",
  checking: "In Prüfung",
  offer: "Angebot gemacht",
  bought: "Angekauft",
  declined: "Abgelehnt",
};

export const TRADEIN_STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700",
  checking: "bg-amber-50 text-amber-700",
  offer: "bg-violet-50 text-violet-700",
  bought: "bg-emerald-50 text-emerald-700",
  declined: "bg-slate-100 text-slate-600",
};

export const FUEL_OPTIONS = ["Benzin", "Diesel", "Hybrid", "Elektro", "Autogas (LPG)", "Erdgas (CNG)", "Andere"];
export const GEARBOX_OPTIONS = ["Schaltgetriebe", "Automatik"];
export const CONDITION_OPTIONS = ["Sehr gut", "Gut", "Gebraucht", "Reparaturbedürftig", "Defekt"];
export const ACCIDENT_OPTIONS = [
  { value: "ja", label: "Ja, unfallfrei" },
  { value: "nein", label: "Nein, Unfallschaden" },
  { value: "unbekannt", label: "Unbekannt" },
];

export const MAX_TRADEIN_PHOTOS = 8;

export const formatEuro = (n) =>
  Number.isFinite(Number(n)) && n !== null && n !== ""
    ? `${new Intl.NumberFormat("de-DE").format(Number(n))} €`
    : "–";

export const formatKm = (n) =>
  Number.isFinite(Number(n)) && n !== null && n !== "" ? `${new Intl.NumberFormat("de-DE").format(Number(n))} km` : "–";

/** Mongo doc -> plain object for the dashboard. */
export function serializeTradeIn(doc, photoIds = []) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    brand: doc.brand || "",
    model: doc.model || "",
    year: doc.year ?? null,
    mileage: doc.mileage ?? null,
    fuel: doc.fuel || "",
    gearbox: doc.gearbox || "",
    power: doc.power ?? null,
    condition: doc.condition || "",
    accidentFree: doc.accidentFree || "",
    tuev: doc.tuev || "",
    askingPrice: doc.askingPrice ?? null,
    description: doc.description || "",
    name: doc.name || "",
    email: doc.email || "",
    phone: doc.phone || "",
    zip: doc.zip || "",
    photoCount: doc.photoCount || 0,
    photoIds: photoIds.map(String),
    status: doc.status || "new",
    read: Boolean(doc.read),
    offerPrice: doc.offerPrice ?? null,
    note: doc.note || "",
    handledBy: doc.handledBy || "",
    handledAt: doc.handledAt ? new Date(doc.handledAt).toISOString() : null,
    emailSent: Boolean(doc.emailSent),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}
