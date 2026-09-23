import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { filterKey, normalizeFilters } from "@/lib/feed/filters";
import { SEARCHERS } from "@/lib/feed/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Each portal gets 9 s; they run side by side, so a check stays well inside this.
export const maxDuration = 20;

const LABELS = { AUTOSCOUT24: "AutoScout24", KLEINANZEIGEN: "Kleinanzeigen", MOBILE_DE: "mobile.de" };

// Two tabs (or a PC and a phone) watching the same filter share one check.
// Portals see at most one request per filter every 12 seconds from here,
// however many pages are open.
const RECENT_MS = 12_000;
const recent = new Map();

// A portal that refuses us (403/429, captcha) is left alone for a while: every
// further request would only extend the block — and the Marktanalyse uses the
// same server address.
const COOLDOWN_MS = 5 * 60_000;
const pausedUntil = new Map();

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
 * body: { filters }
 * → { items, sources: [{ id, label, ok, count, error, url }], checkedAt }
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
  const cacheKey = `${filterKey(filters)}|${filters.sources.slice().sort().join(",")}`;

  const cached = recent.get(cacheKey);
  if (cached && Date.now() - cached.at < RECENT_MS) {
    return json({ ...cached.payload, shared: true });
  }

  const startedAt = Date.now();
  const results = await Promise.all(
    filters.sources.map(async (id) => {
      const search = SEARCHERS[id];
      const paused = pausedUntil.get(id) || 0;
      if (paused > Date.now()) {
        const minutes = Math.ceil((paused - Date.now()) / 60_000);
        return {
          id, ok: false, items: [], url: null, paused: true,
          error: `hat abgelehnt – Pause, wieder in ${minutes} Min.`,
        };
      }
      const fallback = { ok: false, items: [], error: "Zeitüberschreitung.", url: null };
      try {
        const result = await withTimeout(search(filters), 12_000, fallback);
        const refused = result.blocked || /\b(403|429)\b|blockiert|captcha/i.test(result.error || "");
        if (refused) pausedUntil.set(id, Date.now() + COOLDOWN_MS);
        return { id, ...result };
      } catch (error) {
        return { id, ok: false, items: [], error: error?.message || "Fehler.", url: null };
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
    })),
    checkedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };

  recent.set(cacheKey, { at: Date.now(), payload });
  if (recent.size > 50) recent.delete(recent.keys().next().value);

  return json(payload);
}
