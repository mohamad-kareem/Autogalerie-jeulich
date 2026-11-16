import { errorResponse, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { knowledgeView } from "@/lib/marktanalyse/store.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/marktanalyse/wissen – alles, was die Marktanalyse weiß.
 * Mit ?export=1 als Datei zum Herunterladen ("Export für Claude").
 */
export async function GET(req) {
  try {
    if (!(await staffUser())) throw new SaleError("Nicht angemeldet.", 401);
    const view = await knowledgeView();
    if (new URL(req.url).searchParams.get("export") !== "1") return Response.json(view);

    const day = new Date().toISOString().slice(0, 10);
    const file = {
      hinweis: "Export der Marktanalyse für die regelmäßige Pflege. Siehe docs/marktanalyse-gehirn.md.",
      erstellt: new Date().toISOString(),
      zusammenfassung: view.summary,
      unbekannteHinweise: view.unknown,
      regelZaehler: view.rules.map(({ id, count }) => ({ id, count })),
      modellwissenZaehler: view.models.map(({ id, count }) => ({ id, count })),
      kaeufe: view.purchases,
      marktdaten: view.market,
      aenderungen: view.log,
      einstellungen: view.settings,
    };
    return new Response(JSON.stringify(file, null, 2), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="marktanalyse-export-${day}.json"`, "Cache-Control": "no-store" },
    });
  } catch (err) {
    return errorResponse(err, "Das Wissen konnte nicht geladen werden.");
  }
}
