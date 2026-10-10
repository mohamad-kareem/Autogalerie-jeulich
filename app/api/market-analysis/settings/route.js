import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { geocode, extractPostcode } from "@/lib/market/pickup";
import { normalizeSettings, rowsToBands, bandsToRows } from "@/lib/market/settings";
import { connectDB } from "@/lib/mongodb";
import MarketSettings from "@/models/MarketSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Settings as the window shows them: bands as editable rows. */
function forWindow(doc) {
  const settings = normalizeSettings(doc || {});
  return {
    ...settings,
    bandRows: bandsToRows(settings.profitBands),
    updatedAt: doc?.updatedAt || null,
    updatedBy: doc?.updatedBy || "",
  };
}

/** GET /api/market-analysis/settings */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  try {
    await connectDB();
    const doc = await MarketSettings.findOne({ key: "default" }).lean();
    return json({ settings: forWindow(doc) });
  } catch (error) {
    console.error("market settings GET", error);
    return json({ error: "Einstellungen konnten nicht geladen werden." }, 500);
  }
}

/**
 * PUT { bandRows, location, inboundMode, hourlyRate, onSiteMinutes,
 *       fuelLitresPer100Km, fuelPricePerLitre, saleDiscountPercent, defaultDepth }
 * `location` ("52428 Jülich") is looked up once here, so every pickup
 * calculation can start from its coordinates.
 */
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  try {
    await connectDB();
    const current = normalizeSettings((await MarketSettings.findOne({ key: "default" }).lean()) || {});

    let origin = current.origin;
    const location = String(body?.location || "").trim();
    const currentText = [current.origin.postcode, current.origin.label].filter(Boolean).join(" ");
    if (location && location !== currentText) {
      const code = extractPostcode(location);
      const found = await geocode(code ? `${code}, Deutschland` : `${location}, Deutschland`);
      if (!found) {
        return json({ error: `Standort „${location}“ wurde nicht gefunden – bitte PLZ und Ort prüfen.` }, 400);
      }
      const place = location.replace(/\b\d{5}\b/, "").trim();
      origin = {
        label: place || found.label,
        postcode: code || "",
        latitude: found.latitude,
        longitude: found.longitude,
      };
    }

    const next = normalizeSettings({
      ...current,
      ...body,
      origin,
      profitBands: rowsToBands(body?.bandRows),
    });

    const updatedBy = String(session.user.name || session.user.email || "").slice(0, 120);
    const doc = await MarketSettings.findOneAndUpdate(
      { key: "default" },
      { $set: { ...next, updatedBy } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return json({ settings: forWindow(doc) });
  } catch (error) {
    console.error("market settings PUT", error);
    return json({ error: "Einstellungen konnten nicht gespeichert werden." }, 500);
  }
}
