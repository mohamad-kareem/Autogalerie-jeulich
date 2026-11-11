export const runtime = "nodejs";

import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { foundCount, listingSource, parseListingHtml, parseListingText } from "@/lib/listingParser";
import { MAX_HTML_LENGTH, mobileUrl } from "@/extensions/marktanalyse/protocol";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.6",
  "Cache-Control": "no-cache",
};

/**
 * POST /api/ankauf/import – { url } or { text, url? }
 * Reads the car data from a mobile.de / Kleinanzeigen / AutoScout24 listing.
 */
export async function POST(req) {
  if (!(await getStaffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const url = String(body?.url || "").trim();
  const text = String(body?.text || "");

  // The browser extension supplies the listing, so no portal request is needed.
  if (body?.pageHtml != null) {
    if (!mobileUrl(url) || typeof body.pageHtml !== "string" || body.pageHtml.length > MAX_HTML_LENGTH) {
      return Response.json({ error: "Ungültige Fahrzeuganzeige aus der Erweiterung." }, { status: 400 });
    }
    const vehicle = parseListingHtml(body.pageHtml, url);
    if (foundCount(vehicle) < 2) {
      return Response.json({ error: "Die Erweiterung hat keine lesbaren Fahrzeugdaten übertragen. Bitte die Anzeige erneut laden." }, { status: 422 });
    }
    return Response.json({ vehicle, via: "extension" });
  }

  // pasted text from the listing (fallback when the site blocks the request)
  if (text.trim()) {
    const vehicle = parseListingText(text.slice(0, 200_000), url);
    if (!foundCount(vehicle)) {
      return Response.json({ error: "Im Text wurden keine Fahrzeugdaten gefunden." }, { status: 422 });
    }
    return Response.json({ vehicle, via: "text" });
  }

  const source = listingSource(url);
  if (!source) {
    return Response.json({ error: "Bitte einen Link von mobile.de, Kleinanzeigen oder AutoScout24 einfügen." }, { status: 400 });
  }

  let html = "";
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(12000) });
    // only follow redirects that stay on a supported site
    if (!listingSource(res.url || url)) throw new Error("redirect");
    if (!res.ok) {
      return Response.json(
        { error: `${source} hat die Anfrage blockiert (${res.status}). Bitte den Text des Inserats einfügen.`, blocked: true },
        { status: 422 },
      );
    }
    html = (await res.text()).slice(0, 3_000_000);
  } catch {
    return Response.json(
      { error: `${source} ist gerade nicht erreichbar. Bitte den Text des Inserats einfügen.`, blocked: true },
      { status: 422 },
    );
  }

  const vehicle = parseListingHtml(html, url);
  if (foundCount(vehicle) < 2) {
    return Response.json(
      { error: `Auf der Seite wurden keine Fahrzeugdaten gefunden – ${source} hat die Anfrage vermutlich blockiert. Bitte den Text des Inserats einfügen.`, blocked: true, partial: vehicle },
      { status: 422 },
    );
  }
  return Response.json({ vehicle, via: "link" });
}
