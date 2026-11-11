// Privater Kaufvertrag (TÜV-SÜD-Formular): defaults, cleaning and list rows.
// Pure JS – used by the pages, the API and the PDF.

import { berlinDay, monthDE } from "@/lib/sales";

const s = (v) => (v == null ? "" : String(v));

/* ---------- positions of the boxes on the form (pt) – used by the PDF and the on-screen sheet ---------- */

/** page size of the TÜV-SÜD form in pt */
export const FORM_W = 595.276;
export const FORM_H = 841.89;

export function privateDocumentOptions(options) {
  return {
    logo: options?.logo === "company" ? "company" : "tuev",
    includeWarrantyExclusion: options?.includeWarrantyExclusion !== false,
  };
}

/** text boxes: [top, left, right, height] in pt (from the form) */
export const FORM_BOX = {
  sellerName: [129.6, 36.0, 284.6],
  sellerZip: [165.3, 36.0, 97.8],
  sellerCity: [165.3, 104.3, 284.6],
  sellerStreet: [201.6, 36.0, 157.4],
  sellerPhone: [201.6, 163.3, 284.6],
  buyerName: [129.6, 310.6, 559.3],
  buyerZip: [165.3, 310.6, 372.4],
  buyerCity: [165.3, 378.9, 559.3],
  buyerStreet: [201.6, 310.6, 432.0],
  buyerPhone: [201.6, 437.9, 559.3],
  buyerId: [237.2, 310.6, 559.3],
  maker: [297.9, 36.0, 162.1],
  type: [297.9, 168.2, 284.6],
  plate: [297.9, 310.6, 427.0],
  firstRegistration: [297.9, 432.9, 559.0],
  zb2: [333.8, 36.0, 284.6],
  vin: [333.8, 310.6, 559.3],
  nextHu: [370.3, 36.0, 206.2],
  mileage: [370.3, 212.3, 382.5],
  owners: [370.3, 388.8, 559.0],
  extras: [406.2, 36.0, 559.0],
  price: [453.9, 102.3, 284.6],
  priceWords: [453.9, 310.6, 559.0],
  damagesText: [597.9, 36.0, 559.0],
  engineKm: [631.2, 236.2, 300.9, 8],
  special: [719.5, 259.3, 559.0],
  placeSeller: [741.7, 36.0, 162.1],
  dateSeller: [741.7, 168.2, 284.6],
  placeBuyer: [741.7, 310.6, 436.8],
  dateBuyer: [741.7, 442.8, 559.3],
};

/** check boxes: [top, left] – 6.6 × 6.6 pt */
export const FORM_CHECK = {
  notCommercial: [572.7, 234.1],
  accidentFree: [572.7, 361.3],
  noOtherDamage: [572.7, 422.3],
  onlyDamages: [584.0, 36.2],
  originalEngine: [620.7, 36.2],
  exchangeEngine: [620.7, 219.9],
  engineKmCheck: [631.8, 36.2],
  kmCorrect: [642.6, 36.2],
  ownersCorrect: [642.6, 346.8],
  reregister: [681.1, 36.2],
  retention: [691.9, 36.2],
};


/** empty form, car data filled from a vehicle file or an ad ({ name, vin, firstRegistration, tuevUntil, mileage, owners, price }) */
export function privateDefaults(v = {}) {
  const name = s(v.name).trim();
  const maker = name.split(/\s+/)[0] || "";
  const today = berlinDay().split("-").reverse().join(".");
  return {
    documentOptions: privateDocumentOptions(),
    seller: { name: "", zip: "", city: "", street: "", phone: "" },
    buyer: { name: "", zip: "", city: "", street: "", phone: "", idNumber: "" },
    car: {
      maker,
      type: name.slice(maker.length).trim(),
      plate: "",
      firstRegistration: s(v.firstRegistration),
      zb2: "",
      vin: s(v.vin),
      nextHu: monthDE(v.tuevUntil) || (/^\d{2}\/\d{4}$/.test(s(v.tuevUntil)) ? s(v.tuevUntil) : ""),
      mileage: v.mileage != null ? s(v.mileage) : "",
      owners: v.owners != null ? s(v.owners) : "",
      extras: "",
    },
    price: v.price != null ? s(v.price) : "",
    priceWords: "",
    guarantees: {
      notCommercial: false,
      accidentFree: false,
      noOtherDamage: false,
      onlyDamages: false,
      damagesText: "",
      originalEngine: false,
      exchangeEngine: false,
      engineKmCheck: false,
      engineKm: "",
      kmCorrect: false,
      ownersCorrect: false,
    },
    buyerDecl: { reregister: true, retention: true },
    special: "",
    placeSeller: "Jülich",
    dateSeller: today,
    placeBuyer: "Jülich",
    dateBuyer: today,
  };
}

/** saved data merged over the defaults (form state, all strings) */
export function privateForm(saved, v = {}) {
  const base = privateDefaults(v);
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    documentOptions: privateDocumentOptions(saved.documentOptions),
    seller: { ...base.seller, ...saved.seller },
    buyer: { ...base.buyer, ...saved.buyer },
    car: { ...base.car, ...saved.car },
    guarantees: { ...base.guarantees, ...saved.guarantees },
    buyerDecl: { ...base.buyerDecl, ...saved.buyerDecl },
    price: saved.price != null ? s(saved.price) : "",
    dateSeller: deDate(saved.dateSeller ?? base.dateSeller),
    dateBuyer: deDate(saved.dateBuyer ?? base.dateBuyer),
  };
}

/** "2026-11-08" → "08.11.2026" (other text unchanged) */
const deDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(s(v)) ? s(v).split("-").reverse().join(".") : s(v));

const clip = (v, n = 160) => s(v).slice(0, n);

/** keeps only known fields, as strings / booleans */
export function cleanPrivate(b = {}) {
  const obj = (o, keys, n) => Object.fromEntries(keys.map((k) => [k, clip(o?.[k], n)]));
  const flags = (o, keys) => Object.fromEntries(keys.map((k) => [k, Boolean(o?.[k])]));
  return {
    documentOptions: privateDocumentOptions(b.documentOptions),
    seller: obj(b.seller, ["name", "zip", "city", "street", "phone"]),
    buyer: obj(b.buyer, ["name", "zip", "city", "street", "phone", "idNumber"]),
    car: obj(b.car, ["maker", "type", "plate", "firstRegistration", "zb2", "vin", "nextHu", "mileage", "owners", "extras"], 240),
    price: Number(s(b.price).replace(/\./g, "").replace(",", ".")) || null,
    priceWords: clip(b.priceWords, 200),
    guarantees: {
      ...flags(b.guarantees, ["notCommercial", "accidentFree", "noOtherDamage", "onlyDamages", "originalEngine", "exchangeEngine", "engineKmCheck", "kmCorrect", "ownersCorrect"]),
      damagesText: clip(b.guarantees?.damagesText, 240),
      engineKm: clip(b.guarantees?.engineKm, 20),
    },
    buyerDecl: flags(b.buyerDecl, ["reregister", "retention"]),
    special: clip(b.special, 240),
    placeSeller: clip(b.placeSeller, 60),
    dateSeller: clip(b.dateSeller, 20),
    placeBuyer: clip(b.placeBuyer, 60),
    dateBuyer: clip(b.dateBuyer, 20),
  };
}

/** "08.11.2026" / "8.11.26" / "2026-11-08" → "2026-11-08" (or "") */
export function isoDate(v) {
  const t = s(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/);
  if (!m) return "";
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/** the list fields stored next to the data */
export function privateSummary(data) {
  const date = isoDate(data.dateSeller) || isoDate(data.dateBuyer) || berlinDay();
  return {
    date,
    year: Number(date.slice(0, 4)),
    sellerName: data.seller.name,
    buyerName: data.buyer.name,
    vehicleName: [data.car.maker, data.car.type].filter(Boolean).join(" "),
    vin: data.car.vin.replace(/\s+/g, "").toUpperCase(),
    price: data.price || 0,
  };
}

/** saved private contract → JSON for the view page */
export function serializePrivate(d) {
  return {
    _id: String(d._id),
    data: d.data || {},
    date: d.date || "",
    price: Number(d.price || 0),
    buyerName: d.buyerName || "",
    vehicleName: d.vehicleName || "",
    vin: d.vin || "",
    scheinId: d.scheinId ? String(d.scheinId) : "",
    carId: d.carId || "",
    paid: Boolean(d.paid),
    paidAt: d.paidAt || "",
    starred: Boolean(d.starred),
    mailTo: d.mailTo || "",
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : "",
  };
}

export function privateRow(d) {
  return {
    _id: String(d._id),
    paid: Boolean(d.paid),
    starred: Boolean(d.starred),
    date: d.date || "",
    sellerName: d.sellerName || "",
    buyerName: d.buyerName || "",
    vehicleName: d.vehicleName || "",
    vin: d.vin || "",
    price: Number(d.price || 0),
  };
}
