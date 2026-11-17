// Kaufverträge – server helpers (session, numbering, list filters, vehicle sold state).

import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import KaufvertragSetting from "@/models/KaufvertragSetting";
import CarSchein from "@/models/CarSchein";
import Car from "@/models/Car";
import { generateNextNumber } from "@/app/utils/invoiceHelpers";
import { getLastValidContract } from "@/app/utils/getLastValidContract";
import { berlinDay, normVin, vinPattern } from "@/lib/sales";
import { contractRow } from "@/lib/kaufvertrag";
import PrivateContract from "@/models/PrivateContract";
import ContactCustomer from "@/models/ContactCustomer";
import { privateRow } from "@/lib/privateContract";

export const isId = (id) => mongoose.isValidObjectId(String(id || ""));
export const currentYear = () => Number(berlinDay().slice(0, 4));

export class SaleError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err, fallback = "Aktion fehlgeschlagen.") {
  if (err instanceof SaleError) return Response.json({ error: err.message }, { status: err.status });
  console.error(fallback, err);
  return Response.json({ error: fallback }, { status: 500 });
}

/** Signed-in staff → { userId, name, email, role } or null */
export async function staffUser() {
  const session = await getServerSession(authOptions).catch(() => null);
  const u = session?.user;
  if (!u) return null;
  return { userId: String(u.id || u._id || u.email || ""), name: u.name || u.email || "", email: u.email || "", role: u.role || "" };
}

export async function adminUser() {
  const u = await staffUser();
  return u?.role === "admin" ? u : null;
}

/* ------------------------------ numbering ------------------------------ */

const yy = (year) => String(year).slice(-2);

/** running number of a contract number of that year ("12/26" → 12, "RE-202612" → 12) */
export function seqOf(number, issuer, year) {
  const s = String(number || "").replace(/X$/, "");
  if (issuer === "alawie") {
    const m = s.match(/^RE-(\d{4})\/?(\d+)A?$/);
    return m && Number(m[1]) === year ? Number(m[2]) : 0;
  }
  const m = s.match(/^(\d+)A?\/(\d{2})$/);
  return m && m[2] === yy(year) ? Number(m[1]) : 0;
}

export const formatNumber = (issuer, year, seq) => (issuer === "alawie" ? `RE-${year}${seq}` : `${seq}/${yy(year)}`);

const settingKey = (issuer, year) => `nextSeq:${issuer}:${year}`;

/** Next contract number – from the last saved contract, or the number set by hand when it is higher. */
export async function nextNumber(issuer = "karim") {
  await connectDB();
  const year = currentYear();
  const last = await getLastValidContract(issuer);
  const derived = generateNextNumber(last?.originalInvoiceNumber || last?.invoiceNumber || null, issuer);
  const setting = await KaufvertragSetting.findOne({ key: settingKey(issuer, year) }).lean();
  const wanted = Number(setting?.value) || 0;
  return wanted > seqOf(derived, issuer, year) ? formatNumber(issuer, year, wanted) : derived;
}

/** Admin: the next contract starts at `next` (e.g. after paper contracts). */
export async function setNextNumber(issuer = "karim", next) {
  await connectDB();
  const year = currentYear();
  const n = Number.parseInt(next, 10);
  if (!(n >= 1 && n <= 99999)) throw new SaleError("Bitte eine gültige Nummer eingeben.");
  const last = await getLastValidContract(issuer);
  const lastSeq = seqOf(last?.originalInvoiceNumber || last?.invoiceNumber, issuer, year);
  if (n <= lastSeq) throw new SaleError(`Die Nummer muss größer sein als ${lastSeq} (letzter gespeicherter Vertrag).`);
  await KaufvertragSetting.updateOne({ key: settingKey(issuer, year) }, { $set: { value: n } }, { upsert: true });
  return nextNumber(issuer);
}

/* ------------------------------ list ------------------------------ */

const LIST_FIELDS =
  "issuer buyerName buyerStreet buyerCity phone email carType vin invoiceNumber invoiceDate total downPayment paymentNote paid paidAt starred ignored archived createdAt";

/**
 * Kaufverträge = current year, not archived by hand.
 * Archiv      = past years + contracts archived by hand.
 */
export async function listContracts(sp) {
  await connectDB();
  const docs = await Kaufvertrag.find({}).select(LIST_FIELDS).sort({ createdAt: -1 }).limit(5000).maxTimeMS(8000).lean();
  const cy = currentYear();
  const archive = sp.get("scope") === "archive";
  let year = Number.parseInt(sp.get("year") || "", 10);
  if (!archive) year = cy;
  else if (!(year > 2000 && year <= cy)) year = null;

  const all = docs.map(contractRow);
  const inArchive = (r) => r.archived || (r.year && r.year < cy);
  const archiveYears = [...new Set(all.filter(inArchive).map((r) => r.year).filter(Boolean))].sort((a, b) => b - a);

  let base = archive
    ? all.filter((r) => inArchive(r) && (!year || r.year === year))
    : all.filter((r) => r.year === cy && !r.archived);

  const month = Number.parseInt(sp.get("month") || "", 10);
  if (month >= 1 && month <= 12) {
    const prefix = `${year || cy}-${String(month).padStart(2, "0")}-`;
    base = base.filter((r) => String(r.date).startsWith(prefix));
  }

  const q = String(sp.get("q") || "").trim().toLowerCase().slice(0, 80);
  if (q) {
    const qVin = normVin(q);
    base = base.filter(
      (r) =>
        [r.number, r.buyerName, r.buyerPhone, r.buyerEmail, r.buyerCity, r.vehicleName].some((v) => String(v || "").toLowerCase().includes(q)) ||
        (qVin && normVin(r.vin).includes(qVin)),
    );
  }

  // Privat tab: contracts on the TÜV-SÜD form – same year / month / search rules
  const privDocs = await PrivateContract.find({}).select("date year sellerName buyerName vehicleName vin price paid starred archived").sort({ date: -1, createdAt: -1 }).limit(2000).lean();
  let priv = privDocs.map((d) => ({ ...privateRow(d), year: d.year || Number(String(d.date).slice(0, 4)) || null, archived: Boolean(d.archived) }));
  priv = archive ? priv.filter((r) => inArchive(r) && (!year || r.year === year)) : priv.filter((r) => r.year === cy && !r.archived);
  if (month >= 1 && month <= 12) {
    const prefix = `${year || cy}-${String(month).padStart(2, "0")}-`;
    priv = priv.filter((r) => String(r.date).startsWith(prefix));
  }
  if (q) {
    const qVin = normVin(q);
    priv = priv.filter(
      (r) => [r.sellerName, r.buyerName, r.vehicleName].some((v) => String(v || "").toLowerCase().includes(q)) || (qVin && normVin(r.vin).includes(qVin)),
    );
  }

  const tabs = {
    all: () => true,
    open: (r) => r.status === "active" && !r.paid,
    starred: (r) => r.starred,
    cancelled: (r) => r.status === "cancelled",
  };
  const wanted = sp.get("tab");
  const tab = wanted === "privat" ? "privat" : tabs[wanted] ? wanted : "all";
  const sortKey = (r) => `${r.date}`;
  const rows = tab === "privat" ? [] : base.filter(tabs[tab]).sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : sortKey(a) > sortKey(b) ? -1 : 0));
  const counts = { ...Object.fromEntries(Object.entries(tabs).map(([k, fn]) => [k, base.filter(fn).length])), privat: priv.length };
  const privateRows = tab === "privat" ? priv : [];
  return { rows, privateRows, tab, year, scope: archive ? "archive" : "year", counts, years: archiveYears };
}

/* ------------------------------ vehicle ------------------------------ */

const finVariants = (vin) => {
  const fin = String(vin || "").trim();
  return [...new Set([fin, fin.toUpperCase(), normVin(fin)])].filter(Boolean);
};

/** The car's entry in the Fahrzeugverwaltung (by FIN) */
export async function scheinOf(vin) {
  const list = finVariants(vin);
  if (!list.length || normVin(vin).length < 10) return null;
  return CarSchein.findOne({ finNumber: { $in: list } }).select("_id finNumber stage keySold soldAt carName").lean();
}

function revalidateWebsite() {
  try {
    revalidatePath("/gebrauchtwagen");
    revalidatePath("/gebrauchtwagen/[id]", "page");
  } catch {
    /* outside a request */
  }
}

/** Cancelled / deleted contract: car is available again (Fahrzeugverwaltung + website). */
export async function makeVehicleAvailable(vin) {
  const list = finVariants(vin);
  if (!list.length) return;
  await CarSchein.updateMany({ finNumber: { $in: list } }, { $set: { stage: "PLATZ", keySold: false, soldAt: null } }).catch(() => null);
  const res = await Car.updateMany({ vin: { $in: list } }, { $set: { sold: false } }).catch(() => null);
  if (res?.modifiedCount) revalidateWebsite();
}

/** "2026-11-13" | "13.11.2026" | Date → Date (noon, so the Berlin day stays the same) */
function contractDay(text, fallback) {
  const t = String(text || "").trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`);
  m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T12:00:00`);
  const d = fallback ? new Date(fallback) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/**
 * Newest valid contract for a FIN (dealer contract not cancelled/ignored, or a private contract)
 * → { at: Date } or null. Used when a FIN is corrected in the Fahrzeugverwaltung.
 */
export async function validContractOf(vin) {
  const match = vinPattern(vin);
  if (!match) return null;
  const [dealer, priv] = await Promise.all([
    Kaufvertrag.findOne({ vin: match, ignored: { $ne: true }, cancelledAt: null }).sort({ createdAt: -1 }).select("invoiceDate createdAt agreements tuev buyerName phone email buyerStreet buyerCity postalCode carType vin firstRegistration").lean(),
    PrivateContract.findOne({ vin: match }).sort({ createdAt: -1 }).select("date createdAt").lean(),
  ]);
  const dates = [dealer && contractDay(dealer.invoiceDate, dealer.createdAt), priv && contractDay(priv.date, priv.createdAt)].filter(Boolean);
  if (!dates.length) return null;
  // tasks for the handover, as the contract wrote them onto the car ("vor Übergabe")
  const tasks = (dealer?.agreements || []).map((t) => String(t || "").replace(/^\* /, "").trim()).filter(Boolean);
  if (dealer?.tuev && String(dealer.tuev).trim()) tasks.push(`ASU/TÜV: ${String(dealer.tuev).trim()}`);
  return { at: new Date(Math.max(...dates.map((d) => d.getTime()))), tasks, dealer: dealer || null };
}

/**
 * Brings a contract's sale onto a car in the Fahrzeugverwaltung (FIN corrected after the contract):
 * sold state + date (only if not sold yet), buyer from the contact saved with the contract, and the
 * contract's handover tasks – so the dashboard card shows buyer and Aufgaben like any other sale.
 */
export async function applyContractSale(schein, contract) {
  const vin = schein.finNumber;
  const list = finVariants(vin);
  if (!list.length || !contract) return;
  const wasSold = schein.stage === "SOLD";
  if (!wasSold) await markVehicleSold(vin, contract.at);
  let contact = schein.soldContactId
    ? null
    : await ContactCustomer.findOne({ vin: vinPattern(vin) || { $in: list } }).sort({ createdAt: -1 }).select("_id").lean();
  // no customer saved under this FIN (e.g. it was written differently): save the buyer from the contract,
  // as a new contract does, so the dashboard card can show name, phone and address
  const d = contract.dealer;
  if (!schein.soldContactId && !contact && d?.buyerName) {
    contact = await ContactCustomer.create({
      customerName: d.buyerName,
      phone: d.phone,
      email: d.email,
      street: d.buyerStreet,
      city: d.buyerCity,
      postalCode: d.postalCode || "",
      carName: d.carType || schein.carName,
      vin: normVin(vin),
      firstRegistration: d.firstRegistration,
      source: "kaufvertrag",
    }).catch(() => null);
  }
  // already sold and nothing to link: leave the tasks as they are (deleted ones must not come back)
  if (wasSold && !contact) return;
  const notes = Array.isArray(schein.notes) ? schein.notes.map(String) : [];
  const update = { notes: [...new Set([...notes, ...(contract.tasks || [])])] };
  if (contact) update.soldContactId = contact._id;
  await CarSchein.updateOne({ _id: schein._id }, { $set: update }).catch(() => null);
}

/** Contract valid again: car is sold again. */
export async function markVehicleSold(vin, soldAt) {
  const list = finVariants(vin);
  if (!list.length) return;
  const at = soldAt ? new Date(soldAt) : new Date();
  await CarSchein.updateMany({ finNumber: { $in: list } }, { $set: { stage: "SOLD", keySold: true, soldAt: Number.isNaN(at.getTime()) ? new Date() : at } }).catch(
    () => null,
  );
  const res = await Car.updateMany({ vin: { $in: list } }, { $set: { sold: true } }).catch(() => null);
  if (res?.modifiedCount) revalidateWebsite();
}
