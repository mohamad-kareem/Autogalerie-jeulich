export const runtime = "nodejs";

import { connectDB as dbConnect } from "@/lib/mongodb";
import Pickup from "@/models/Pickup";
import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { serializePickup } from "@/lib/pickups";

/** Autogalerie's two red plates (the same as in the Fahrzeugverwaltung / Rote Kennzeichen) */
const RED_PLATES = ["DN 06919", "DN 06921"];

/** GET /api/abholungen?status=open|done   ·   ?count=1 → { open } for the sidebar */
export async function GET(req) {
  if (!(await getStaffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status") === "done" ? "done" : "open";
  try {
    await dbConnect();
    if (sp.get("count")) return Response.json({ open: await Pickup.countDocuments({ status: "open" }) });
    const [docs, open, done] = await Promise.all([
      Pickup.find({ status })
        .sort(status === "open" ? { date: 1, time: 1, createdAt: 1 } : { doneAt: -1 })
        .limit(status === "open" ? 200 : 100)
        .maxTimeMS(3000)
        .lean(),
      Pickup.countDocuments({ status: "open" }),
      Pickup.countDocuments({ status: "done" }),
    ]);
    // undated pickups at the end
    const rows = docs.map(serializePickup);
    if (status === "open") rows.sort((a, b) => (a.date ? 0 : 1) - (b.date ? 0 : 1));
    return Response.json({ pickups: rows, counts: { open, done }, plates: RED_PLATES });
  } catch (err) {
    console.error("PICKUPS_LIST_ERROR:", err?.message || err);
    return Response.json({ error: "Abholungen konnten nicht geladen werden." }, { status: 500 });
  }
}
