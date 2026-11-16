import { errorResponse, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { analyze } from "@/lib/marktanalyse/brain.js";
import { cleanItems, cleanMeta, cleanSubject } from "@/lib/marktanalyse/sanitize.js";
import { getMemory, getSettings, saveAnalysis } from "@/lib/marktanalyse/store.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/marktanalyse/analyse – { subject, items, meta }
 * Rechnet den Bericht und speichert ihn im Verlauf.
 */
export async function POST(req) {
  try {
    const user = await staffUser();
    if (!user) throw new SaleError("Nicht angemeldet.", 401);
    const body = await req.json().catch(() => null);
    const subject = cleanSubject(body?.subject);
    if (!subject) throw new SaleError("Die Fahrzeugdaten fehlen.");
    const items = cleanItems(body?.items);
    const meta = cleanMeta(body?.meta);

    const [settings, memory] = await Promise.all([getSettings(), getMemory(subject).catch(() => null)]);
    const report = analyze({ subject, items, settings, memory, meta });
    if (!report.ok) throw new SaleError(report.error, 422);
    const saved = await saveAnalysis({ subject, items, report, meta, user });
    return Response.json({ id: saved.id, createdAt: saved.createdAt, subject, report: saved.report });
  } catch (err) {
    return errorResponse(err, "Die Analyse konnte nicht berechnet werden.");
  }
}
