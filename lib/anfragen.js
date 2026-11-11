// Anfragen (Kontaktformular) – the stored ContactSubmission in the shape the
// Anfragen page works with (like Autocenter). Server only.
//
// "Gelesen" stays per staff member (readBy), like the sidebar counter.
// Older messages have no status: unread by everybody → "Neu", otherwise "Erledigt".

import mongoose from "mongoose";

export const MESSAGE_STATUS = ["new", "in_progress", "done", "archived"];

const noStatus = { status: { $in: [null, ""] } };

/** Mongo filter for one status tab (old messages without a status included) */
export function statusFilter(status) {
  if (status === "new") return { $or: [{ status: "new" }, { ...noStatus, "readBy.0": { $exists: false } }] };
  if (status === "done") return { $or: [{ status: "done" }, { ...noStatus, "readBy.0": { $exists: true } }] };
  if (MESSAGE_STATUS.includes(status)) return { status };
  return {};
}

export function statusOf(doc) {
  if (MESSAGE_STATUS.includes(doc?.status)) return doc.status;
  return doc?.readBy?.length ? "done" : "new";
}

export const userObjectId = (id) => (mongoose.isValidObjectId(String(id || "")) ? new mongoose.Types.ObjectId(String(id)) : null);

/** filter: not read by this staff member */
export const unreadFilter = (uid) => (uid ? { readBy: { $ne: uid } } : { "readBy.0": { $exists: false } });

/** website link of the car ("/gebrauchtwagen/<id>") */
function vehicleHref(doc) {
  const link = String(doc.carLink || "").trim();
  if (link) {
    try {
      const u = new URL(link, "http://x");
      return u.host === "x" ? `${u.pathname}${u.search}` : link;
    } catch {
      return link;
    }
  }
  return doc.carId ? `/gebrauchtwagen/${doc.carId}` : "";
}

/** Mongo document → plain JSON for the client */
export function serializeMessage(doc, userId = "") {
  if (!doc) return null;
  const readBy = (doc.readBy || []).map(String);
  return {
    _id: String(doc._id),
    name: doc.name || "",
    email: doc.email || "",
    phone: doc.phone || "",
    subject: doc.subject || "",
    message: doc.message || "",
    vehicle: doc.carName || "",
    vehicleHref: vehicleHref(doc),
    appointment: doc.date ? new Date(doc.date).toISOString() : null,
    status: statusOf(doc),
    read: userId ? readBy.includes(String(userId)) : readBy.length > 0,
    // the website saves the message even when the e-mail fails – that is not stored, so: sent
    emailSent: true,
    emailError: "",
    handledBy: doc.handledBy || "",
    handledAt: doc.handledAt ? new Date(doc.handledAt).toISOString() : null,
    note: doc.note || "",
    createdAt: new Date(doc.createdAt || Date.now()).toISOString(),
  };
}
