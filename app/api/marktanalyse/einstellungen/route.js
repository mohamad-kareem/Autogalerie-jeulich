import { errorResponse, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { PRICE_LIST } from "@/lib/marktanalyse/knowledge/defaults.js";
import { getSettings, saveSettings } from "@/lib/marktanalyse/store.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/marktanalyse/einstellungen – Preisliste und Gewinnspanne. */
export async function GET() {
  try {
    if (!(await staffUser())) throw new SaleError("Nicht angemeldet.", 401);
    return Response.json({ settings: await getSettings(), priceList: PRICE_LIST });
  } catch (err) {
    return errorResponse(err, "Die Einstellungen konnten nicht geladen werden.");
  }
}

/** PUT /api/marktanalyse/einstellungen – { profitMin, profitGoal, prices } */
export async function PUT(req) {
  try {
    const user = await staffUser();
    if (!user) throw new SaleError("Nicht angemeldet.", 401);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new SaleError("Ungültige Eingabe.");
    return Response.json({ settings: await saveSettings(body, user.name), priceList: PRICE_LIST });
  } catch (err) {
    return errorResponse(err, "Die Einstellungen konnten nicht gespeichert werden.");
  }
}
