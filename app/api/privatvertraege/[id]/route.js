export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import PrivateContract from "@/models/PrivateContract";
import { DAY_RE, berlinDay } from "@/lib/sales";
import { errorResponse, isId, scheinOf, staffUser } from "@/lib/kaufvertragServer";
import { applyPrivateSale, undoPrivateSale } from "@/lib/privateSale";
import { cleanPrivate, privateDocumentOptions, privateSummary, serializePrivate } from "@/lib/privateContract";

async function guard(params) {
  if (!(await staffUser())) return { res: Response.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  const { id } = await params;
  if (!isId(id)) return { res: Response.json({ error: "Ungültige ID." }, { status: 400 }) };
  return { id };
}

/** GET /api/privatvertraege/:id → { contract, vehicle } */
export async function GET(req, { params }) {
  const { res, id } = await guard(params);
  if (res) return res;
  try {
    await connectDB();
    const doc = await PrivateContract.findById(id).lean();
    if (!doc) return Response.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
    const schein = await scheinOf(doc.vin);
    return Response.json({
      contract: serializePrivate(doc),
      vehicle: schein ? { fin: schein.finNumber, sold: schein.stage === "SOLD" || Boolean(schein.keySold) } : null,
    });
  } catch (err) {
    return errorResponse(err, "Vertrag konnte nicht geladen werden.");
  }
}

/** PATCH /api/privatvertraege/:id – update contract data, document options, star or payment. */
export async function PATCH(req, { params }) {
  const { res, id } = await guard(params);
  if (res) return res;
  const body = await req.json().catch(() => ({}));
  try {
    await connectDB();
    if (body?.action === "documentOptions") {
      const documentOptions = privateDocumentOptions(body.documentOptions);
      const updated = await PrivateContract.updateOne({ _id: id }, { $set: { "data.documentOptions": documentOptions } });
      if (!updated.matchedCount) return Response.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
      return Response.json({ documentOptions });
    }

    // star / payment – like the normal Kaufvertrag
    if (body?.action === "star" || body?.action === "paid") {
      const doc = await PrivateContract.findById(id).select("starred paid paidAt").lean();
      if (!doc) return Response.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
      if (body.action === "star") {
        await PrivateContract.updateOne({ _id: id }, { $set: { starred: !doc.starred } });
        return Response.json({ starred: !doc.starred });
      }
      const paid = Boolean(body.paid);
      const paidAt = paid ? (DAY_RE.test(String(body.paidAt || "")) ? body.paidAt : berlinDay()) : "";
      await PrivateContract.updateOne({ _id: id }, { $set: { paid, paidAt } });
      return Response.json({ paid, paidAt });
    }

    const data = cleanPrivate(body?.data);
    const doc = await PrivateContract.findById(id);
    if (!doc) return Response.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
    const oldVin = doc.vin;
    doc.set({ data, ...privateSummary(data) });
    doc.markModified("data");
    if (oldVin && oldVin !== doc.vin) await undoPrivateSale({ vin: oldVin });
    const sold = await applyPrivateSale({ doc });
    await doc.save();
    return Response.json({ ok: true, sold });
  } catch (err) {
    return errorResponse(err, "Vertrag konnte nicht gespeichert werden.");
  }
}

/** DELETE /api/privatvertraege/:id – the car becomes available again */
export async function DELETE(req, { params }) {
  const { res, id } = await guard(params);
  if (res) return res;
  try {
    await connectDB();
    const doc = await PrivateContract.findById(id).select("vin data").lean();
    if (!doc) return Response.json({ error: "Vertrag nicht gefunden." }, { status: 404 });
    await undoPrivateSale(doc);
    await PrivateContract.deleteOne({ _id: id });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "Vertrag konnte nicht gelöscht werden.");
  }
}
