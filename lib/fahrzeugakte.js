// Fahrzeugverwaltung (Händlerportal) – the stored car (CarSchein, as Autogalerie always
// saved it) in the shape the Fahrzeugakte pages work with. Server only.

import mongoose from "mongoose";
import CarSchein from "@/models/CarSchein";
import Car from "@/models/Car";
import ContactCustomer from "@/models/ContactCustomer";
import Kaufvertrag from "@/models/Kaufvertrag";
import PrivateContract from "@/models/PrivateContract";
import { addMonthsDay, berlinDay, normVin } from "@/lib/sales";

export const PHASE_OF = { WERKSTATT: "werkstatt", AUFBEREITUNG: "aufbereitung", PLATZ: "platz", TUEV: "tuev", SOLD: "verkauft" };
export const STAGE_OF = Object.fromEntries(Object.entries(PHASE_OF).map(([k, v]) => [v, k]));

const s = (v) => String(v ?? "").trim();
const day = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : berlinDay(d);
};

/** "201905" | "2019-05" | "05/2019" → "05/2019" */
export function regMonth(value) {
  const t = s(value);
  if (!t) return "";
  let m = t.match(/^(\d{4})-?(\d{2})$/);
  if (m) return `${m[2]}/${m[1]}`;
  m = t.match(/^(\d{1,2})[./-](\d{4})$/);
  if (m) return `${m[1].padStart(2, "0")}/${m[2]}`;
  return t;
}

export const SOLD_CONTACT = {
  path: "soldContactId",
  model: ContactCustomer,
  select: "customerName phone street postalCode city",
};

/** website ads (mobile.de) and contracts for a list of cars, keyed by FIN */
export async function extrasFor(scheins) {
  const vins = [...new Set(scheins.map((x) => normVin(x.finNumber)).filter((v) => v.length >= 11))];
  if (!vins.length) return { cars: new Map(), contracts: new Map(), privates: new Map() };
  const [cars, contracts, privates] = await Promise.all([
    Car.find({ vin: { $in: vins } }).select("vin firstRegistration mileage priceValue price numberOfPreviousOwners sold").lean(),
    Kaufvertrag.find({ vin: { $in: vins }, ignored: { $ne: true } }).select("vin invoiceNumber invoiceDate createdAt buyerName phone buyerStreet buyerCity warranty").sort({ createdAt: -1 }).lean(),
    PrivateContract.find({ vin: { $in: vins } }).select("vin date buyerName data.buyer createdAt").sort({ createdAt: -1 }).lean(),
  ]);
  const first = (list) => {
    const m = new Map();
    for (const d of list) {
      const k = normVin(d.vin);
      if (k && !m.has(k)) m.set(k, d);
    }
    return m;
  };
  return { cars: first(cars), contracts: first(contracts), privates: first(privates) };
}

function priceOf(car) {
  if (!car) return null;
  if (Number.isFinite(car.priceValue)) return car.priceValue;
  const n = Number(String(car.price?.consumerPriceGross || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** CarSchein (+ ad + contract) → Fahrzeugakte */
export function toVehicle(x, { cars, contracts, privates } = {}) {
  const vin = normVin(x.finNumber);
  const car = cars?.get(vin) || null;
  const contract = contracts?.get(vin) || null;
  const priv = privates?.get(vin) || null;
  const meta = x.stageMeta || {};
  const stage = PHASE_OF[s(x.stage).toUpperCase()] ? s(x.stage).toUpperCase() : "WERKSTATT";
  const tuevUntil = /^\d{4}-\d{2}$/.test(s(meta.platz?.tuevUntil)) ? meta.platz.tuevUntil : "";
  const expired = tuevUntil && tuevUntil < berlinDay().slice(0, 7);
  const tuevStatus = stage === "TUEV" ? (meta.tuev?.passed ? "ok" : "failed") : tuevUntil ? (expired ? "due" : "ok") : "";
  const sold = stage === "SOLD" || Boolean(x.keySold);
  const contact = x.soldContactId && typeof x.soldContactId === "object" ? x.soldContactId : null;
  const soldAt = day(x.soldAt);

  let sale = null;
  if (sold) {
    const fromContract = contract
      ? { name: contract.buyerName, phone: contract.phone, address: [contract.buyerStreet, contract.buyerCity].filter(Boolean).join(", ") }
      : priv
        ? { name: priv.buyerName, phone: priv.data?.buyer?.phone, address: [priv.data?.buyer?.street, [priv.data?.buyer?.zip, priv.data?.buyer?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") }
        : null;
    sale = {
      contractId: contract ? String(contract._id) : "",
      privateContractId: !contract && priv ? String(priv._id) : "",
      contractNumber: contract ? contract.invoiceNumber || "Vertrag" : priv ? "Privatvertrag" : "",
      buyerName: s(contact?.customerName) || s(fromContract?.name),
      buyerPhone: s(contact?.phone) || s(fromContract?.phone),
      buyerAddress: contact ? [s(contact.street), [s(contact.postalCode), s(contact.city)].filter(Boolean).join(" ")].filter(Boolean).join(", ") : s(fromContract?.address),
      soldAt,
      handedOverAt: day(x.handedOverAt),
      // one year from the sale – like the Garantie page (none when it was excluded in the contract)
      warrantyUntil: soldAt && contract?.warranty !== "excluded" ? addMonthsDay(soldAt, 12) : "",
    };
  }

  const plates = [];
  if (x.rotKennzeichen) {
    if (x.rotPlateNumber === "DN-06919" || x.rotPlateNumber === "BEIDE") plates.push({ plateId: "DN-06919", number: "DN 06919", nr: x.rotbuchNumber19 ?? null });
    if (x.rotPlateNumber === "DN-06921" || x.rotPlateNumber === "BEIDE") plates.push({ plateId: "DN-06921", number: "DN 06921", nr: x.rotbuchNumber21 ?? null });
  }

  const done = new Set((x.completedTasks || []).map(s));
  const notes = Array.isArray(x.notes) ? x.notes.map(s).filter(Boolean) : s(x.notes).split("\n").map(s).filter(Boolean);

  return {
    _id: String(x._id),
    name: s(x.carName),
    vin,
    firstRegistration: s(x.firstRegistration) || regMonth(car?.firstRegistration),
    mileage: Number.isFinite(x.mileage) ? x.mileage : Number.isFinite(car?.mileage) ? car.mileage : null,
    price: Number.isFinite(x.price) ? x.price : priceOf(car),
    keyNumber: s(x.keyNumber),
    keyCount: Number.isFinite(x.keyCount) ? x.keyCount : 0,
    keyNote: s(x.keyNote),
    keyColor: s(x.keyColor) || "#000000",
    owners: x.vorbesitzer ?? (Number.isFinite(car?.numberOfPreviousOwners) ? car.numberOfPreviousOwners : null),
    phase: PHASE_OF[stage],
    tuevStatus,
    tuevUntil,
    tuevIssues: Array.isArray(meta.tuev?.issues) ? meta.tuev.issues.filter(Boolean) : [],
    werkstatt: { where: s(meta.werkstatt?.where), what: s(meta.werkstatt?.what) },
    platzNote: s(meta.platz?.note),
    tankEmpty: Boolean(x.fuelNeeded),
    inStockSince: day(x.boughtAt) || day(x.createdAt),
    notes: s(x.infoNote),
    hasRegistrationPhoto: Boolean(x.imageUrl),
    imageUrl: x.imageUrl || "",
    onWebsite: Boolean(car),
    redPlates: plates,
    sale,
    claims: (x.reclamations || []).map((c, i) => ({ _id: String(i), date: day(c.date), what: s(c.what), where: s(c.where), cost: Number(c.cost) || 0 })),
    tasks: notes.map((t, i) => ({ _id: `${i}:${t}`, title: t, status: done.has(t) ? "done" : "open" })),
    updatedAt: x.updatedAt ? new Date(x.updatedAt).toISOString() : "",
  };
}

/** one car with everything the drawer shows */
export async function loadVehicle(id) {
  if (!mongoose.isValidObjectId(String(id || ""))) return null;
  const x = await CarSchein.findById(id).populate(SOLD_CONTACT).lean();
  if (!x) return null;
  const extras = await extrasFor([x]);
  const vin = normVin(x.finNumber);
  const contracts = [];
  if (vin) {
    const [ks, ps] = await Promise.all([
      Kaufvertrag.find({ vin }).select("invoiceNumber invoiceDate buyerName ignored").sort({ createdAt: -1 }).lean(),
      PrivateContract.find({ vin }).select("date buyerName").sort({ createdAt: -1 }).lean(),
    ]);
    for (const k of ks) contracts.push({ _id: String(k._id), number: k.invoiceNumber, date: k.invoiceDate, buyerName: k.buyerName, cancelled: Boolean(k.ignored) });
    for (const p of ps) contracts.push({ _id: String(p._id), number: "Privatvertrag", private: true, date: p.date, buyerName: p.buyerName });
  }
  const vehicle = toVehicle(x, extras);
  return { vehicle, tasks: vehicle.tasks, contracts, redPlates: vehicle.redPlates, raw: x };
}

/** Cloudinary: turn the stored picture by `delta` degrees (saved in the URL, so print and every page show it turned) */
export function rotatedUrl(url, delta) {
  const u = s(url);
  const m = u.match(/^(.*\/image\/upload\/)(?:a_(-?\d+)\/)?(.*)$/);
  if (!m) return u;
  const angle = ((((Number(m[2]) || 0) + delta) % 360) + 360) % 360;
  return `${m[1]}${angle ? `a_${angle}/` : ""}${m[3]}`;
}
