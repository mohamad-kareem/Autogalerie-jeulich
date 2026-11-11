export const runtime = "nodejs";

import mongoose from "mongoose";
import { connectDB as dbConnect } from "@/lib/mongodb";
import ManualCar from "@/models/AddCar";
import { adminUser as getAdminUser, staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { TRADEIN_STATUS, serializeOffer } from "@/lib/ankauf";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

/** GET /api/ankauf/:id – details, marks as read */
export async function GET(req, { params }) {
  const user = await getStaffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });

  try {
    await dbConnect();
    const doc = await ManualCar.findByIdAndUpdate(id, { $set: { read: true } }, { new: true }).lean();
    if (!doc) return Response.json({ error: "Angebot nicht gefunden." }, { status: 404 });
    return Response.json({ item: serializeOffer(doc) });
  } catch (err) {
    console.error("ANKAUF_GET_ERROR:", err?.message || err);
    return Response.json({ error: "Angebot konnte nicht geladen werden." }, { status: 500 });
  }
}

/** PATCH /api/ankauf/:id – { status?, offerPrice?, note?, read? } */
export async function PATCH(req, { params }) {
  const user = await getStaffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const update = {};
  if (typeof body?.read === "boolean") update.read = body.read;
  if (typeof body?.note === "string") update.note = body.note.slice(0, 3000);
  if (body?.offerPrice === null || body?.offerPrice === "") update.offerPrice = null;
  else if (body?.offerPrice !== undefined) {
    const n = Number(String(body.offerPrice).replace(/[^\d]/g, ""));
    if (Number.isFinite(n)) update.offerPrice = n;
  }
  if (typeof body?.status === "string") {
    if (!TRADEIN_STATUS.includes(body.status)) {
      return Response.json({ error: "Ungültiger Status." }, { status: 400 });
    }
    update.tradeStatus = body.status;
    update.read = true;
    update.handledBy = user.name || user.email || "Team";
    update.handledAt = new Date();
  }
  if (!Object.keys(update).length) {
    return Response.json({ error: "Keine Änderungen übergeben." }, { status: 400 });
  }

  try {
    await dbConnect();
    const doc = await ManualCar.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: false }).lean();
    if (!doc) return Response.json({ error: "Angebot nicht gefunden." }, { status: 404 });
    return Response.json({ item: serializeOffer(doc) });
  } catch (err) {
    console.error("ANKAUF_PATCH_ERROR:", err?.message || err);
    return Response.json({ error: "Änderung konnte nicht gespeichert werden." }, { status: 500 });
  }
}

/** DELETE /api/ankauf/:id – admins only */
export async function DELETE(req, { params }) {
  const admin = await getAdminUser();
  if (!admin) return Response.json({ error: "Nur Administratoren können Angebote löschen." }, { status: 403 });
  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });

  try {
    await dbConnect();
    const doc = await ManualCar.findByIdAndDelete(id).lean();
    if (!doc) return Response.json({ error: "Angebot nicht gefunden." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("ANKAUF_DELETE_ERROR:", err?.message || err);
    return Response.json({ error: "Angebot konnte nicht gelöscht werden." }, { status: 500 });
  }
}
