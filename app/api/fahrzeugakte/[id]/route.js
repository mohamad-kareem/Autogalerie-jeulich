export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import ContactCustomer from "@/models/ContactCustomer";
import Car from "@/models/Car";
import Pickup from "@/models/Pickup";
import cloudinary from "@/app/utils/cloudinary";
import { SaleError, errorResponse, isId, makeVehicleAvailable, staffUser } from "@/lib/kaufvertragServer";
import { STAGE_OF, loadVehicle, rotatedUrl } from "@/lib/fahrzeugakte";
import { DAY_RE, berlinDay, normVin, parseEuro, parseMonth } from "@/lib/sales";

const s = (v, n = 300) => String(v ?? "").trim().slice(0, n);
const intOrNull = (v, max = 99999999) => {
  const t = String(v ?? "").replace(/[^\d]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n <= max ? n : null;
};

async function destroyImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn("Cloudinary delete failed:", e?.message);
  }
}

async function guard(params) {
  const user = await staffUser();
  if (!user) return { res: Response.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  const { id } = await params;
  if (!isId(id)) return { res: Response.json({ error: "Ungültige ID." }, { status: 400 }) };
  return { id, user };
}

/** GET /api/fahrzeugakte/:id → { vehicle, tasks, contracts, redPlates, raw } */
export async function GET(req, { params }) {
  const { res, id } = await guard(params);
  if (res) return res;
  try {
    await connectDB();
    const data = await loadVehicle(id);
    if (!data) return Response.json({ error: "Fahrzeugakte nicht gefunden." }, { status: 404 });
    return Response.json(data);
  } catch (err) {
    return errorResponse(err, "Fahrzeugakte konnte nicht geladen werden.");
  }
}

/** PATCH /api/fahrzeugakte/:id – { action, … } (no action = save the data form) */
export async function PATCH(req, { params }) {
  const { res, id } = await guard(params);
  if (res) return res;
  const b = await req.json().catch(() => ({}));
  const action = String(b?.action || "save");
  try {
    await connectDB();
    const x = await CarSchein.findById(id);
    if (!x) throw new SaleError("Fahrzeugakte nicht gefunden.", 404);
    const vin = normVin(x.finNumber);

    if (action === "save") {
      const nextVin = normVin(b.vin);
      if (nextVin && nextVin.length !== 17) throw new SaleError("Die FIN muss 17 Zeichen haben.");
      if (nextVin && nextVin !== vin && (await CarSchein.exists({ _id: { $ne: x._id }, finNumber: nextVin }))) {
        throw new SaleError("Diese FIN-Nummer existiert bereits.", 409);
      }
      if (!s(b.name)) throw new SaleError("Bitte eine Bezeichnung eingeben.");
      x.carName = s(b.name, 160);
      x.finNumber = nextVin;
      x.firstRegistration = s(b.firstRegistration, 20);
      x.mileage = intOrNull(b.mileage);
      x.price = parseEuro(b.price);
      x.vorbesitzer = intOrNull(b.owners, 99);
      x.keyNumber = s(b.keyNumber, 20);
      x.keyCount = Math.min(9, intOrNull(b.keyCount, 9) ?? 0);
      x.keyNote = s(b.keyNote, 200);
      if (b.keyColor) x.keyColor = s(b.keyColor, 20);
      x.fuelNeeded = Boolean(b.tankEmpty);
      x.infoNote = s(b.notes, 2000);

      const wasSold = x.stage === "SOLD";
      const stage = STAGE_OF[b.phase] || x.stage || "WERKSTATT";
      x.stage = stage === "SOLD" && !wasSold ? x.stage : stage; // sold only with a sale

      const meta = x.stageMeta?.toObject ? x.stageMeta.toObject() : x.stageMeta || {};
      const until = parseMonth(b.tuevUntil);
      const issues = Array.isArray(b.tuevIssues)
        ? b.tuevIssues
        : String(b.tuevIssues ?? "")
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean);
      x.stageMeta = {
        werkstatt: { where: s(b.werkstattWhere ?? meta.werkstatt?.where, 160), what: s(b.werkstattWhat ?? meta.werkstatt?.what, 300) },
        platz: { note: s(meta.platz?.note), hasTuev: Boolean(until), tuevUntil: until },
        tuev: { passed: b.tuevStatus === "ok", issues: b.tuevStatus === "failed" ? issues.slice(0, 30) : [] },
      };
      x.markModified("stageMeta");
      await x.save();
    } else if (action === "sold") {
      const buyerName = s(b.buyerName, 160);
      if (!buyerName) throw new SaleError("Bitte den Käufer eingeben.");
      const date = DAY_RE.test(String(b.date || "")) ? b.date : berlinDay();
      const contact = await ContactCustomer.create({ customerName: buyerName, phone: s(b.buyerPhone, 40), vin, carName: x.carName, source: "manual" });
      x.stage = "SOLD";
      x.keySold = true;
      x.soldAt = new Date(`${date}T12:00:00`);
      x.soldContactId = contact._id;
      x.handedOverAt = null;
      await x.save();
      if (vin) await Car.updateMany({ vin }, { $set: { sold: true } }).catch(() => null);
    } else if (action === "available") {
      x.stage = "PLATZ";
      x.keySold = false;
      x.soldAt = null;
      x.soldContactId = null;
      x.handedOverAt = null;
      await x.save();
      if (vin) await makeVehicleAvailable(vin);
    } else if (action === "handover") {
      x.handedOverAt = new Date();
      await x.save();
    } else if (action === "task") {
      const title = s(b.title, 200);
      if (!title) throw new SaleError("Bitte eine Aufgabe eingeben.");
      const notes = Array.isArray(x.notes) ? x.notes : [];
      if (!notes.includes(title)) x.notes = [...notes, title];
      await x.save();
    } else if (action === "toggleTask") {
      const title = s(b.title, 200);
      const done = new Set(x.completedTasks || []);
      if (done.has(title)) done.delete(title);
      else done.add(title);
      x.completedTasks = [...done];
      await x.save();
    } else if (action === "removeTask") {
      const title = s(b.title, 200);
      x.notes = (x.notes || []).filter((t) => t !== title);
      x.completedTasks = (x.completedTasks || []).filter((t) => t !== title);
      await x.save();
    } else if (action === "claim") {
      if (!s(b.what)) throw new SaleError("Bitte eintragen, was reklamiert wurde.");
      const date = DAY_RE.test(String(b.date || "")) ? new Date(`${b.date}T12:00:00`) : new Date();
      x.reclamations = [...(x.reclamations || []), { date, what: s(b.what), where: s(b.where, 160), cost: parseEuro(b.cost) ?? 0 }];
      await x.save();
    } else if (action === "removeClaim") {
      const i = Number(b.claimId);
      x.reclamations = (x.reclamations || []).filter((_, k) => k !== i);
      await x.save();
    } else if (action === "photo") {
      const url = s(b.imageUrl, 600);
      if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) throw new SaleError("Ungültiges Bild.");
      if (x.publicId && x.publicId !== b.publicId) await destroyImage(x.publicId);
      x.imageUrl = url;
      x.publicId = s(b.publicId, 300) || null;
      await x.save();
    } else if (action === "removePhoto") {
      await destroyImage(x.publicId);
      x.imageUrl = null;
      x.publicId = null;
      await x.save();
    } else if (action === "rotate") {
      if (!x.imageUrl) throw new SaleError("Kein Fahrzeugschein hinterlegt.");
      x.imageUrl = rotatedUrl(x.imageUrl, Number(b.rotate) === -90 ? -90 : 90);
      await x.save();
    } else {
      throw new SaleError("Unbekannte Aktion.");
    }

    const data = await loadVehicle(id);
    return Response.json({ ...data, version: data?.vehicle?.updatedAt || String(Date.now()) });
  } catch (err) {
    return errorResponse(err, "Speichern fehlgeschlagen.");
  }
}

/** DELETE /api/fahrzeugakte/:id – contracts stay */
export async function DELETE(req, { params }) {
  const { res, id } = await guard(params);
  if (res) return res;
  try {
    await connectDB();
    const x = await CarSchein.findById(id).select("publicId").lean();
    if (!x) return Response.json({ error: "Fahrzeugakte nicht gefunden." }, { status: 404 });
    await destroyImage(x.publicId);
    await CarSchein.deleteOne({ _id: id });
    // pickups keep their own copy of the car data and are only unlinked
    await Pickup.updateMany({ vehicleId: id }, { $set: { vehicleId: null } }).catch(() => null);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "Fahrzeug konnte nicht gelöscht werden.");
  }
}
