import { errorResponse, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { listAnalyses } from "@/lib/marktanalyse/store.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/marktanalyse – der Verlauf, neueste zuerst. */
export async function GET() {
  try {
    if (!(await staffUser())) throw new SaleError("Nicht angemeldet.", 401);
    return Response.json({ items: await listAnalyses() });
  } catch (err) {
    return errorResponse(err, "Der Verlauf konnte nicht geladen werden.");
  }
}
