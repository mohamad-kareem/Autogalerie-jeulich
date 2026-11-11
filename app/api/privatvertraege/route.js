export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import PrivateContract from "@/models/PrivateContract";
import { errorResponse, staffUser } from "@/lib/kaufvertragServer";
import { applyPrivateSale } from "@/lib/privateSale";
import { cleanPrivate, privateSummary } from "@/lib/privateContract";

/** GET /api/privatvertraege?vin= → { id } of the newest private contract for that car (or null) */
export async function GET(req) {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const vin = String(new URL(req.url).searchParams.get("vin") || "").replace(/\s+/g, "").toUpperCase();
  if (vin.length < 11) return Response.json({ id: null });
  try {
    await connectDB();
    const doc = await PrivateContract.findOne({ vin }).sort({ createdAt: -1 }).select("_id").lean();
    return Response.json({ id: doc ? String(doc._id) : null });
  } catch (err) {
    return errorResponse(err, "Suche fehlgeschlagen.");
  }
}

/** POST /api/privatvertraege – { data, carId? } → { contract: { _id }, sold } (car marked as sold once a buyer is entered) */
export async function POST(req) {
  const user = await staffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data = cleanPrivate(body?.data);
  try {
    await connectDB();
    const doc = new PrivateContract({
      data,
      ...privateSummary(data),
      carId: String(body?.carId || "").slice(0, 40),
      createdBy: user.name || "",
    });
    const sold = await applyPrivateSale({ doc });
    await doc.save();
    return Response.json({ contract: { _id: String(doc._id) }, sold }, { status: 201 });
  } catch (err) {
    return errorResponse(err, "Vertrag konnte nicht gespeichert werden.");
  }
}
