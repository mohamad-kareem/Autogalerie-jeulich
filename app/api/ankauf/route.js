export const runtime = "nodejs";

import { connectDB as dbConnect } from "@/lib/mongodb";
import ManualCar from "@/models/AddCar";
import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { TRADEIN_STATUS, UNREAD, serializeOffer, tradeStatusFilter } from "@/lib/ankauf";
import { str } from "@/lib/sales";

/** GET /api/ankauf?status=&q= – staff list   ·   ?count=1 → { unread } for the sidebar */
export async function GET(req) {
  const user = await getStaffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = str(searchParams.get("q"), 80);

  const parts = [tradeStatusFilter(status)];
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    parts.push({ $or: [{ make: rx }, { model: rx }, { name: rx }, { "contact.fullName": rx }, { "contact.email": rx }, { "contact.phone": rx }, { vin: rx }] });
  }
  const filter = parts.filter((p) => Object.keys(p).length);
  const where = filter.length > 1 ? { $and: filter } : filter[0] || {};

  try {
    await dbConnect();
    if (searchParams.get("count")) return Response.json({ unread: await ManualCar.countDocuments(UNREAD) });
    const [docs, all, unread, ...byStatus] = await Promise.all([
      ManualCar.find(where).sort({ createdAt: -1 }).limit(200).maxTimeMS(3000).lean(),
      ManualCar.countDocuments({}),
      ManualCar.countDocuments(UNREAD),
      ...TRADEIN_STATUS.map((s) => ManualCar.countDocuments(tradeStatusFilter(s))),
    ]);
    const counts = { all, unread, ...Object.fromEntries(TRADEIN_STATUS.map((s, i) => [s, byStatus[i]])) };
    return Response.json({ items: docs.map(serializeOffer), counts });
  } catch (err) {
    console.error("ANKAUF_LIST_ERROR:", err?.message || err);
    return Response.json({ error: "Angebote konnten nicht geladen werden." }, { status: 500 });
  }
}
