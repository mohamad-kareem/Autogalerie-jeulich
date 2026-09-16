import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import MarketAnalysis from "@/models/MarketAnalysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only what the list needs — the stored result is large. */
const LIST_FIELDS = [
  "listingUrl",
  "marketplace",
  "title",
  "make",
  "model",
  "firstRegistration",
  "mileageKm",
  "listPrice",
  "negotiatedPrice",
  "askingPrice",
  "marketValue",
  "maximumPurchasePrice",
  "expectedProfit",
  "verdict",
  "confidence",
  "note",
  "savedBy",
  "analyzedAt",
  "createdAt",
  "updatedAt",
].join(" ");

function unauthorised() {
  return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
}

/**
 * GET /api/market-analysis/saved
 * The saved evaluations, newest first. Optional ?q= filters by title or link.
 */
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorised();

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 60, 200);

    const filter = query
      ? {
          $or: [
            // Escaped: a link pasted into the search box is full of regex
            // metacharacters and must be matched literally.
            { title: { $regex: escapeRegex(query), $options: "i" } },
            { listingUrl: { $regex: escapeRegex(query), $options: "i" } },
            { make: { $regex: escapeRegex(query), $options: "i" } },
            { model: { $regex: escapeRegex(query), $options: "i" } },
          ],
        }
      : {};

    const entries = await MarketAnalysis.find(filter, LIST_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error("market-analysis/saved: list failed", error);
    return NextResponse.json(
      { error: "Gespeicherte Analysen konnten nicht geladen werden." },
      { status: 500 },
    );
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * POST /api/market-analysis/saved
 * body: { result, inputs?, note? }
 *
 * Saving the same ad twice updates the existing entry rather than piling up
 * near-identical copies — the newest evaluation of a car is the one that counts.
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorised();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const result = body?.result;
  const listingUrl = String(
    result?.target?.listingUrl || body?.listingUrl || "",
  ).trim();

  if (!result || !listingUrl) {
    return NextResponse.json(
      { error: "Es liegt keine Analyse zum Speichern vor." },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const target = result.target || {};
    const dealer = result.dealer || {};
    const market = result.market || {};

    const entry = await MarketAnalysis.findOneAndUpdate(
      { listingUrl },
      {
        $set: {
          listingUrl,
          marketplace: result.marketplace?.label || result.marketplace?.id || "",

          title: String(target.title || "").slice(0, 240),
          make: target.make || "",
          model: target.model || "",
          firstRegistration: target.firstRegistration || "",
          mileageKm: numberOrNull(target.mileageKm),

          listPrice: numberOrNull(dealer.listPrice ?? target.price),
          negotiatedPrice: numberOrNull(dealer.negotiatedPrice),
          askingPrice: numberOrNull(dealer.askingPrice ?? target.price),
          marketValue: numberOrNull(market.marketValue),
          maximumPurchasePrice: numberOrNull(dealer.maximumPurchasePrice),
          expectedProfit: numberOrNull(dealer.expectedProfit),
          verdict: result.verdict || "",
          confidence: numberOrNull(result.confidence),

          note: String(body?.note || "").slice(0, 2000),
          result,
          inputs: body?.inputs || null,

          savedBy: session.user.email || session.user.name || "",
          analyzedAt: result.meta?.analyzedAt
            ? new Date(result.meta.analyzedAt)
            : new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("market-analysis/saved: save failed", error);
    return NextResponse.json(
      { error: "Die Analyse konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
