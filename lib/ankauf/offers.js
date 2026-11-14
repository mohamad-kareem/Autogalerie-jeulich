// Ankauf – the offers from "Auto verkaufen" (ManualCar) in the shape the Ankauf page
// works with (like Autocenter's TradeIn). Server only.

export const TRADEIN_STATUS = ["new", "checking", "offer", "bought", "declined"];

/** Mongo filter for a status (older offers without a status count as "new") */
export function tradeStatusFilter(status) {
  if (status === "new") return { tradeStatus: { $in: ["new", null, ""] } };
  if (TRADEIN_STATUS.includes(status)) return { tradeStatus: status };
  return {};
}

/** offers nobody has opened yet (older offers count as read) */
export const UNREAD = { read: false };

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" && Number(v) > 0 ? Number(v) : null);

/** the extra details the customer filled in (shown under the description) */
const EXTRAS = [
  ["vin", "FIN"],
  ["modelSeries", "Baureihe"],
  ["equipmentLine", "Ausstattungslinie"],
  ["category", "Kategorie"],
  ["status", "Fahrzeugstatus"],
  ["displacement", "Hubraum"],
  ["seats", "Sitzplätze"],
  ["doors", "Türen"],
  ["previousOwners", "Vorbesitzer"],
  ["emissionClass", "Schadstoffklasse"],
  ["environmentalBadge", "Umweltplakette"],
  ["driveType", "Antrieb"],
  ["exteriorColor", "Außenfarbe"],
  ["interiorColor", "Innenfarbe"],
  ["interiorMaterial", "Innenausstattung"],
  ["airConditioning", "Klima"],
  ["parkingAssistance", "Einparkhilfe"],
];

/** ManualCar → Ankauf item */
export function serializeOffer(doc) {
  if (!doc) return null;
  const c = doc.contact || {};
  const hp = num(doc.hp) ?? (num(doc.power) ? Math.round(num(doc.power) * 1.36) : null);
  const extras = EXTRAS.map(([k, label]) => [label, doc[k]])
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() && String(v) !== "0")
    .map(([label, v]) => ({ label, value: String(v) }));
  if (doc.operational === false) extras.push({ label: "Fahrbereit", value: "Nein" });
  if (doc.hasEngineDamage) extras.push({ label: "Motorschaden", value: "Ja" });
  const features = [...(doc.features || []), ...(doc.specialFeatures || [])].filter(Boolean);
  return {
    _id: String(doc._id),
    brand: doc.make || "",
    model: doc.model || "",
    year: doc.registration || "",
    mileage: num(doc.kilometers),
    fuel: doc.fuel || "",
    gearbox: doc.transmission || "",
    power: hp,
    condition: doc.condition || "",
    accidentFree: doc.accidentFree === true ? "ja" : doc.accidentFree === false ? "nein" : "",
    tuev: doc.inspectionDate || "",
    askingPrice: num(doc.price),
    description: doc.description || "",
    extras,
    features,
    name: c.fullName || "",
    email: c.email || "",
    phone: c.phone || "",
    zip: "",
    photos: (doc.images || []).filter(Boolean),
    status: TRADEIN_STATUS.includes(doc.tradeStatus) ? doc.tradeStatus : "new",
    read: doc.read !== false,
    offerPrice: doc.offerPrice ?? null,
    note: doc.note || "",
    handledBy: doc.handledBy || "",
    handledAt: doc.handledAt ? new Date(doc.handledAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}
