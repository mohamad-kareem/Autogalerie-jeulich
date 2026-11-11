export const runtime = "nodejs";

import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { reverseGeocode } from "@/lib/travel";

/** GET /api/geo/reverse?lat=&lon= → { address } – "Aktueller Standort" for the company location */
export async function GET(req) {
  if (!(await getStaffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: "Ungültiger Standort." }, { status: 400 });
  }
  const address = await reverseGeocode(lat.toFixed(6), lon.toFixed(6));
  if (!address) return Response.json({ error: "Zu diesem Standort wurde keine Adresse gefunden." }, { status: 404 });
  return Response.json({ address });
}
