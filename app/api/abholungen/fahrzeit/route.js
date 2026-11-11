export const runtime = "nodejs";

import { connectDB as dbConnect } from "@/lib/mongodb";
import Pickup from "@/models/Pickup";
import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { drivingTime, getCompanyLocation } from "@/lib/travel";

const addressOf = (s = {}) => [s.street, [s.zip, s.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

/** GET /api/abholungen/fahrzeit – driving time from the company to every open pickup → { from, times: { id: { minutes, km } } } */
export async function GET() {
  if (!(await getStaffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    await dbConnect();
    const from = await getCompanyLocation();
    const docs = await Pickup.find({ status: "open", mode: "pickup" }).select("seller").limit(60).lean();
    const times = {};
    const started = Date.now();
    for (const d of docs) {
      if (Date.now() - started > 25_000) break; // the rest comes with the next visit
      const to = addressOf(d.seller);
      if (!to) continue;
      const t = await drivingTime(from, `${to}, Deutschland`);
      if (t) times[String(d._id)] = t;
    }
    return Response.json({ from, times });
  } catch (err) {
    console.error("PICKUP_TRAVEL_ERROR:", err?.message || err);
    return Response.json({ from: "", times: {} });
  }
}
