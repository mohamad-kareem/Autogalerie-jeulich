import { errorResponse, isId, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { refreshReport } from "@/lib/marktanalyse/brain.js";
import { deleteAnalysis, getAnalysis, getMemory, getSettings, setPurchase, updateAnalysisReport } from "@/lib/marktanalyse/store.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function load(params) {
  if (!(await staffUser())) throw new SaleError("Nicht angemeldet.", 401);
  const { id } = await params;
  if (!isId(id)) throw new SaleError("Analyse nicht gefunden.", 404);
  return id;
}

/** GET /api/marktanalyse/:id – eine gespeicherte Analyse. */
export async function GET(_req, { params }) {
  try {
    const analysis = await getAnalysis(await load(params));
    if (!analysis) throw new SaleError("Analyse nicht gefunden.", 404);
    return Response.json({ id: analysis.id, createdAt: analysis.createdAt, subject: analysis.subject, report: analysis.report, feedback: analysis.feedback || null });
  } catch (err) {
    return errorResponse(err, "Die Analyse konnte nicht geladen werden.");
  }
}

/** POST /api/marktanalyse/:id – Bewertung mit den gespeicherten Marktdaten erneuern. */
export async function POST(_req, { params }) {
  try {
    const id = await load(params);
    const analysis = await getAnalysis(id);
    if (!analysis) throw new SaleError("Analyse nicht gefunden.", 404);
    const { subject, report: previous } = analysis;
    if (!subject) throw new SaleError("Die gespeicherten Fahrzeugdaten fehlen.", 422);
    const [settings, memory] = await Promise.all([getSettings(), getMemory(subject).catch(() => null)]);
    const report = refreshReport({ subject, previous, settings, memory });
    if (!report.ok) throw new SaleError(report.error, 422);
    if (!(await updateAnalysisReport(id, report))) throw new SaleError("Analyse nicht gefunden.", 404);
    return Response.json({ report });
  } catch (err) {
    return errorResponse(err, "Die Analyse konnte nicht neu berechnet werden.");
  }
}

/**
 * PATCH /api/marktanalyse/:id – { bought: true, price } oder { bought: false }
 * Der Händler meldet, dass er das Fahrzeug gekauft hat, und zu welchem Preis.
 */
export async function PATCH(req, { params }) {
  try {
    const user = await staffUser();
    if (!user) throw new SaleError("Nicht angemeldet.", 401);
    const { id } = await params;
    if (!isId(id)) throw new SaleError("Analyse nicht gefunden.", 404);
    const body = await req.json().catch(() => null);
    let price = null;
    if (body?.bought === true) {
      price = Number(body.price);
      if (!Number.isInteger(price) || price < 1 || price > 5_000_000) throw new SaleError("Bitte den Kaufpreis in ganzen Euro eingeben.", 422);
    } else if (body?.bought !== false) {
      throw new SaleError("Ungültige Eingabe.");
    }
    const feedback = await setPurchase(id, price, user.name);
    if (!feedback) throw new SaleError("Analyse nicht gefunden.", 404);
    return Response.json({ feedback });
  } catch (err) {
    return errorResponse(err, "Der Kauf konnte nicht gespeichert werden.");
  }
}

/** DELETE /api/marktanalyse/:id – aus dem Verlauf entfernen. */
export async function DELETE(_req, { params }) {
  try {
    await deleteAnalysis(await load(params));
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "Die Analyse konnte nicht gelöscht werden.");
  }
}
