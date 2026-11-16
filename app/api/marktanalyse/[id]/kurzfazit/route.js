import { errorResponse, isId, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { getAnalysis, getSettings, saveAnalysisSummary } from "@/lib/marktanalyse/store.js";
import { generateAnalysisSummary } from "@/lib/marktanalyse/summary.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    if (!(await staffUser())) throw new SaleError("Nicht angemeldet.", 401);
    const { id } = await params;
    if (!isId(id)) throw new SaleError("Analyse nicht gefunden.", 404);
    if (!(await getSettings()).aiSummaryEnabled) return Response.json({ summary: null });

    const analysis = await getAnalysis(id);
    if (!analysis?.report?.ok) throw new SaleError("Analyse nicht gefunden.", 404);
    if (analysis.aiSummary) return Response.json({ summary: analysis.aiSummary });

    const summary = await generateAnalysisSummary(analysis.report, req.signal, analysis.subject).catch((error) => {
      if (!req.signal.aborted) {
        console.warn("[marktanalyse/kurzfazit] OpenAI request failed", {
          status: error?.status,
          code: error?.code || error?.name,
        });
      }
      return null;
    });
    if (!summary) throw new SaleError("Das KI-Kurzfazit ist gerade nicht verfügbar.", 503);
    const saved = await saveAnalysisSummary(id, analysis.updatedAt, summary);
    if (!saved) throw new SaleError("Die Analyse wurde währenddessen geändert. Bitte erneut öffnen.", 409);
    return Response.json({ summary });
  } catch (err) {
    return errorResponse(err, "Das KI-Kurzfazit konnte nicht geladen werden.");
  }
}
