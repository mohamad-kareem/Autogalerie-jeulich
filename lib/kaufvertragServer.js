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
import { berlinDay, normVin } from "@/lib/sales";
import { contractRow } from "@/lib/kaufvertrag";
import PrivateContract from "@/models/PrivateContract";
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
