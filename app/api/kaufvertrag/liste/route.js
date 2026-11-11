export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { adminUser, errorResponse, listContracts, staffUser } from "@/lib/kaufvertragServer";

/** GET /api/kaufvertrag/liste?scope=year|archive&year=&tab=&q=&month= */
export async function GET(req) {
  const user = await staffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  if (sp.get("scope") === "archive" && !(await adminUser())) {
    return Response.json({ error: "Nur für Administratoren." }, { status: 403 });
  }
  try {
    return Response.json(await listContracts(sp));
  } catch (err) {
    return errorResponse(err, "Verträge konnten nicht geladen werden.");
  }
}
