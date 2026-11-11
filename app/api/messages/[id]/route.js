export const runtime = "nodejs";

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import ContactSubmission from "@/models/ContactSubmission";
import { MESSAGE_STATUS, serializeMessage, userObjectId } from "@/lib/anfragen";
import { adminUser, staffUser } from "@/lib/kaufvertragServer";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

/** PATCH /api/messages/:id  { status?, read?, note? } */
export async function PATCH(req, { params }) {
  const user = await staffUser();
  if (!user) return Response.json({ error: "Nicht berechtigt." }, { status: 401 });

  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const set = {};
  let read = typeof body?.read === "boolean" ? body.read : null;
  if (typeof body?.note === "string") set.note = body.note.slice(0, 2000);
  if (typeof body?.status === "string") {
    if (!MESSAGE_STATUS.includes(body.status)) {
      return Response.json({ error: "Ungültiger Status." }, { status: 400 });
    }
    set.status = body.status;
    set.handledBy = user.name || user.email || "Team";
    set.handledAt = new Date();
    if (body.status !== "new") read = true;
  }

  if (!Object.keys(set).length && read === null) {
    return Response.json({ error: "Keine Änderungen übergeben." }, { status: 400 });
  }

  // "gelesen" is kept per staff member (readBy) – the same as the sidebar counter
  const uid = userObjectId(user.userId);
  const update = {};
  if (Object.keys(set).length) update.$set = set;
  if (uid && read === true) update.$addToSet = { readBy: uid };
  if (uid && read === false) update.$pull = { readBy: uid };
  if (!Object.keys(update).length) {
    return Response.json({ error: "Keine Änderungen übergeben." }, { status: 400 });
  }

  try {
    await connectDB();
    // an old message gets its status the moment it is opened, so it stays in its tab
    if (!set.status) {
      const current = await ContactSubmission.findById(id).select("status readBy").lean();
      if (!current) return Response.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
      if (!MESSAGE_STATUS.includes(current.status)) {
        update.$set = { ...(update.$set || {}), status: current.readBy?.length ? "done" : "new" };
      }
    }
    const doc = await ContactSubmission.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) return Response.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
    return Response.json({ message: serializeMessage(doc, user.userId) });
  } catch (err) {
    console.error("MESSAGES_PATCH_ERROR:", err?.message || err);
    return Response.json({ error: "Änderung konnte nicht gespeichert werden." }, { status: 500 });
  }
}

/** DELETE /api/messages/:id */
export async function DELETE(req, { params }) {
  const admin = await adminUser();
  if (!admin) return Response.json({ error: "Nur Administratoren können Anfragen löschen." }, { status: 403 });

  const { id } = await params;
  if (!isValidId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });

  try {
    await connectDB();
    const doc = await ContactSubmission.findByIdAndDelete(id).lean();
    if (!doc) return Response.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("MESSAGES_DELETE_ERROR:", err?.message || err);
    return Response.json({ error: "Anfrage konnte nicht gelöscht werden." }, { status: 500 });
  }
}
