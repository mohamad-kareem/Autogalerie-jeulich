import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { detailSource, fetchDetails } from "@/lib/feed/details";
import { looksRefused, pauseRemainingMs, pauseSource } from "@/lib/feed/pause";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Next to the portals, like the feed itself.
export const preferredRegion = "fra1";
export const maxDuration = 20;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/neue-angebote/details
 * body: { url }  — an AutoScout24 or Kleinanzeigen ad from the feed
 * → { ok, details } — HU, accident status, owners, service book, red flags …
 */
export async function POST(request) {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  const url = String(body?.url || "");
  const source = detailSource(url);
  if (!source) return json({ ok: false, error: "Nur Anzeigen von AutoScout24 und Kleinanzeigen." }, 400);

  const paused = pauseRemainingMs(source);
  if (paused > 0) {
    return json({ ok: false, paused: true, error: `Portal pausiert, wieder in ${Math.ceil(paused / 60_000)} Min.` });
  }

  try {
    const result = await fetchDetails(url);
    if (!result.ok && looksRefused(result)) pauseSource(source);
    return json(result);
  } catch (error) {
    return json({ ok: false, error: error?.message || "Fehler." });
  }
}
