import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { filterKey, normalizeFilters } from "@/lib/feed/filters";
import { looksRefused, pauseRemainingMs, pauseSource } from "@/lib/feed/pause";
import { SEARCHERS } from "@/lib/feed/sources";
import { createCheckPool, streamCheck } from "@/lib/feed/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Run next to the portals (Frankfurt) instead of Vercel's default in the USA:
// every request to them is several round trips shorter.
export const preferredRegion = "fra1";
// Each portal gets 8 s; they run side by side, so a check stays well inside this.
export const maxDuration = 20;

const LABELS = { AUTOSCOUT24: "AutoScout24", KLEINANZEIGEN: "Kleinanzeigen", MOBILE_DE: "mobile.de" };

// Share both in-flight work and results within this server instance. Other
// serverless instances have separate memory; this is not a global rate limit.
const getCheck = createCheckPool();

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function withTimeout(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * POST /api/neue-angebote
 * body: { filters, source?, stream? }
 * → { items, sources: [{ id, label, ok, count, error, url, durationMs }], checkedAt }
 *
 * With `source` only that portal is asked. The page asks each portal on its
 * own, so a slow answer from one never holds back the cars from the others.
 *
 * Returns the newest ads per portal as they are right now. Which of them are
 * new to this buyer is decided by the page, which remembers what it has shown.
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

  const filters = normalizeFilters(body?.filters || {});
  const only = typeof body?.source === "string" && filters.sources.includes(body.source) ? body.source : null;
  const asked = only ? [only] : filters.sources;
  const page = Math.max(1, Math.min(200, Math.floor(Number(body?.page) || 1)));
  const cacheKey = `${filterKey(filters)}|${asked.slice().sort().join(",")}|${page}`;

  const job = getCheck(cacheKey, async (emit) => {
    const startedAt = Date.now();
    const results = await Promise.all(
      asked.map(async (id) => {
        const search = SEARCHERS[id];
        const paused = pauseRemainingMs(id);
        if (paused > 0) {
          const minutes = Math.ceil(paused / 60_000);
          return {
            id, ok: false, items: [], url: null, paused: true,
            error: `hat abgelehnt – Pause, wieder in ${minutes} Min.`,
          };
        }
        const fallback = { ok: false, items: [], error: "Zeitüberschreitung.", url: null };
        const began = Date.now();
        let accepting = true;
        let streamed = false;
        const publish = (batch) => {
          if (!accepting) return;
          streamed = true;
          emit({ type: "batch", source: id, ...batch, page, checkedAt: new Date().toISOString() });
        };
        try {
          const result = await withTimeout(search(filters, publish, { page }), 10_000, fallback);
          if (!streamed) publish({ ok: Boolean(result.ok), items: result.items || [] });
          if (looksRefused(result)) pauseSource(id);
          return { id, ...result, durationMs: Date.now() - began };
        } catch (error) {
          return { id, ok: false, items: [], error: error?.message || "Fehler.", url: null, durationMs: Date.now() - began };
        } finally {
          accepting = false;
        }
      }),
    );

    const items = results.flatMap((result) => result.items || []);
    const payload = {
      items,
      sources: results.map((result) => ({
        id: result.id,
        label: LABELS[result.id],
        ok: Boolean(result.ok),
        count: result.items?.length || 0,
        error: result.error || null,
        skipped: Boolean(result.skipped),
        paused: Boolean(result.paused),
        url: result.url || null,
        durationMs: result.durationMs ?? null,
        page,
        hasMore: Boolean(result.hasMore) && page < 200,
        total: result.total ?? null,
      })),
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    };

    emit({ type: "complete", ...payload });
    return payload;
  });

  if (body?.stream === true) {
    return new Response(streamCheck(job, request.signal), {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }
  const payload = await job.promise;
  return payload ? json(payload) : json({ error: "Prüfung fehlgeschlagen." }, 500);
}
