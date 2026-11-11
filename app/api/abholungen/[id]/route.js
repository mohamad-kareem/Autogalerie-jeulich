export const runtime = "nodejs";

import mongoose from "mongoose";
import { connectDB as dbConnect } from "@/lib/mongodb";
import Pickup from "@/models/Pickup";
import CarSchein from "@/models/CarSchein";
import { staffUser as getStaffUser, scheinOf } from "@/lib/kaufvertragServer";
import { serializePickup } from "@/lib/pickups";
import { str } from "@/lib/sales";

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

/**
 * PATCH /api/abholungen/:id
 *  { date, time, payment, redPlate, registered, driver, note, seller: { phone, street, zip, city } }  edit
 *  { action: "done" }    picked up → car gets an entry in the Fahrzeugverwaltung (Werkstatt)
 *  { action: "reopen" }
 */
export async function PATCH(req, { params }) {
  const user = await getStaffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  if (!isId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });
  const b = await req.json().catch(() => ({}));

  try {
    await dbConnect();
    const doc = await Pickup.findById(id);
    if (!doc) return Response.json({ error: "Abholung nicht gefunden." }, { status: 404 });

    if (b.action === "done") {
      if (doc.status !== "done") {
        doc.status = "done";
        doc.doneAt = new Date();
        doc.doneBy = user.name || "";
        // the car is now ours: create (or reuse) its entry in the Fahrzeugverwaltung
        if (!doc.vehicleId) {
          const v = doc.vehicle || {};
          const vin = String(v.vin || "").length === 17 ? v.vin : "";
          let file = vin ? await scheinOf(vin) : null;
          if (!file) {
            file = await CarSchein.create({
              carName: v.name || [v.brand, v.model].filter(Boolean).join(" ") || "Fahrzeug",
              finNumber: vin,
              firstRegistration: v.firstRegistration || "",
              mileage: v.mileage ?? null,
              vorbesitzer: v.owners ?? null,
              notes: [],
              owner: "",
              stage: "WERKSTATT",
              boughtAt: doc.createdAt || new Date(),
              infoNote: `Angekauft von ${doc.seller?.name || "–"} für ${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2 }).format(doc.price)} €`.slice(0, 2000),
            });
          }
          doc.vehicleId = file._id;
        }
      }
    } else if (b.action === "reopen") {
      doc.status = "open";
      doc.doneAt = null;
      doc.doneBy = "";
    } else {
      if (typeof b.date === "string") doc.date = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : "";
      if (typeof b.time === "string") doc.time = /^\d{2}:\d{2}$/.test(b.time) ? b.time : "";
      if (b.payment === "cash" || b.payment === "transfer") doc.payment = b.payment;
      if (typeof b.redPlate === "string" || typeof b.registered === "boolean") {
        if (typeof b.redPlate === "string") doc.redPlate = str(b.redPlate.toUpperCase(), 30);
        if (typeof b.registered === "boolean") {
          doc.registered = b.registered;
        } else if (doc.redPlate) {
          doc.registered = false;
        }
        if (doc.registered) doc.redPlate = "";
        // Persist both fields together when switching between plate types.
        if (doc.isModified("redPlate") || doc.isModified("registered")) {
          doc.markModified("redPlate");
          doc.markModified("registered");
        }
      }
      if (typeof b.driver === "string") doc.driver = str(b.driver, 60);
      if (typeof b.note === "string") doc.note = str(b.note, 2000);
      if (b.mode === "pickup" || b.mode === "delivery") doc.mode = b.mode;
      if (b.seller && typeof b.seller === "object") {
        for (const [k, max] of [
          ["name", 120],
          ["phone", 40],
          ["street", 120],
          ["zip", 10],
          ["city", 80],
        ]) {
          if (typeof b.seller[k] === "string") doc.seller[k] = str(b.seller[k], max);
        }
      }
    }
    await doc.save();
    return Response.json({ pickup: serializePickup(doc.toObject()) });
  } catch (err) {
    console.error("PICKUP_PATCH_ERROR:", err?.message || err);
    return Response.json({ error: "Änderung konnte nicht gespeichert werden." }, { status: 500 });
  }
}

/** DELETE – remove a pickup (e.g. the seller withdrew) */
export async function DELETE(req, { params }) {
  if (!(await getStaffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  if (!isId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });
  try {
    await dbConnect();
    await Pickup.deleteOne({ _id: id });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("PICKUP_DELETE_ERROR:", err?.message || err);
    return Response.json({ error: "Abholung konnte nicht gelöscht werden." }, { status: 500 });
  }
}
