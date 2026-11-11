export const runtime = "nodejs";

import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { drivingTime, getCompanyLocation } from "@/lib/travel";

/** GET /api/fahrzeit?to=<address> → { from, minutes, km } – driving time from the company (cached) */
export async function GET(req) {
  if (!(await getStaffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const to = String(new URL(req.url).searchParams.get("to") || "").trim().slice(0, 200);
  if (to.length < 4) return Response.json({ error: "Adresse fehlt." }, { status: 400 });
  try {
    const from = await getCompanyLocation();
    const t = await drivingTime(from, /deutschland|germany/i.test(to) ? to : `${to}, Deutschland`);
    if (!t) return Response.json({ from, error: "Fahrzeit nicht gefunden." }, { status: 404 });
    return Response.json({ from, ...t });
  } catch (err) {
    console.error("TRAVEL_ERROR:", err?.message || err);
    return Response.json({ error: "Fahrzeit nicht verfügbar." }, { status: 500 });
  }
}
