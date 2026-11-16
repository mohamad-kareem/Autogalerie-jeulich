import { errorResponse, SaleError, staffUser } from "@/lib/kaufvertragServer";
import { parseKleinanzeigenPage } from "@/lib/neue-angebote/sources";
import { missingFields } from "@/lib/marktanalyse/brain.js";
import { parseAutoScoutSearch, parseMobileMs, parseMobileSearch } from "@/lib/marktanalyse/portalPages.js";
import { isListingUrl, portalOf } from "@/lib/marktanalyse/search.js";
import { readSubject } from "@/lib/marktanalyse/subject.js";
import { fuelKey, gearKey, regMonths } from "@/lib/marktanalyse/text.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HTML = 4_000_000;

function kleinanzeigenSearch(html, seller) {
  const parsed = parseKleinanzeigenPage(html);
  return {
    ok: !parsed.error,
    error: parsed.error,
    blocked: /blockiert/.test(parsed.error || ""),
    total: null,
    hasMore: Boolean(parsed.hasMore),
    items: parsed.items.map((item) => ({
      key: item.key, source: "KLEINANZEIGEN", id: item.id, url: item.url, title: item.title, make: null, model: null,
      price: item.price, mileageKm: item.mileageKm, firstRegistration: item.firstRegistration, regMonths: regMonths(item.firstRegistration),
      powerPs: item.powerPs, fuel: fuelKey(item.fuel), gearbox: gearKey(item.gearbox), sellerType: seller === "PRIVATE" ? "PRIVATE" : seller === "DEALER" ? "DEALER" : "UNKNOWN",
      location: item.location, zip: item.location?.match(/^\d{5}/)?.[0] || null,
    })),
  };
}

/**
 * POST /api/marktanalyse/parse – { kind, url, html, seller? }
 * Liest eine Seite, die die Browser-Erweiterung geladen hat:
 *   kind "listing"       → das Fahrzeug der Anzeige
 *   kind "search"        → die Vergleichsfahrzeuge einer Trefferliste
 *   kind "mobile-model"  → mobile.de-Nummern für Marke und Modell
 */
export async function POST(req) {
  try {
    if (!(await staffUser())) throw new SaleError("Nicht angemeldet.", 401);
    const body = await req.json().catch(() => null);
    const url = String(body?.url || "").trim();
    const html = body?.html;
    const portal = portalOf(url);
    if (!portal) throw new SaleError("Bitte einen Link von mobile.de, AutoScout24 oder Kleinanzeigen verwenden.");
    if (typeof html !== "string" || html.length < 200 || html.length > MAX_HTML) throw new SaleError("Die Seite wurde nicht vollständig übertragen.", 422);

    if (body.kind === "listing") {
      if (!isListingUrl(url)) throw new SaleError("Das ist keine einzelne Fahrzeuganzeige. Bitte den Link der Anzeige einfügen.");
      const read = readSubject(html, url);
      if (!read.ok) throw new SaleError(read.error, 422);
      return Response.json({ subject: read.subject, missing: missingFields(read.subject) });
    }
    if (body.kind === "mobile-model") {
      if (portal !== "MOBILE_DE") throw new SaleError("Ungültige Anfrage.");
      return Response.json(parseMobileMs(html));
    }
    if (body.kind === "search") {
      const result = portal === "MOBILE_DE" ? parseMobileSearch(html)
        : portal === "AUTOSCOUT24" ? parseAutoScoutSearch(html)
          : kleinanzeigenSearch(html, body.seller);
      return Response.json({ portal, ...result });
    }
    throw new SaleError("Ungültige Anfrage.");
  } catch (err) {
    return errorResponse(err, "Die Seite konnte nicht gelesen werden.");
  }
}
