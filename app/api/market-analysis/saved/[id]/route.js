import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import MarketAnalysis from "@/models/MarketAnalysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 }) };
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: NextResponse.json({ error: "Unbekannte Analyse." }, { status: 400 }) };
  }

  return { id };
}

/** GET — one saved evaluation, complete, exactly as it was computed. */
export async function GET(request, { params }) {
  const { id, error } = await guard(params);
  if (error) return error;

  try {
    await connectDB();
    const entry = await MarketAnalysis.findById(id).lean();

    if (!entry) {
      return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ entry }, { status: 200 });
  } catch (err) {
    console.error("market-analysis/saved/[id]: load failed", err);
    return NextResponse.json(
      { error: "Die Analyse konnte nicht geladen werden." },
      { status: 500 },
    );
  }
}

/** PATCH — body: { note } — the buyer's own remark on a saved car. */
export async function PATCH(request, { params }) {
  const { id, error } = await guard(params);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  try {
    await connectDB();
    const entry = await MarketAnalysis.findByIdAndUpdate(
      id,
      { $set: { note: String(body?.note || "").slice(0, 2000) } },
      { new: true },
    ).lean();

    if (!entry) {
      return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ entry }, { status: 200 });
  } catch (err) {
    console.error("market-analysis/saved/[id]: update failed", err);
    return NextResponse.json(
      { error: "Die Notiz konnte nicht gespeichert werden." },
      { status: 500 },
    );
  }
}

/** DELETE — removes a saved evaluation. */
export async function DELETE(request, { params }) {
  const { id, error } = await guard(params);
  if (error) return error;

  try {
    await connectDB();
    const removed = await MarketAnalysis.findByIdAndDelete(id).lean();

    if (!removed) {
      return NextResponse.json({ error: "Analyse nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("market-analysis/saved/[id]: delete failed", err);
    return NextResponse.json(
      { error: "Die Analyse konnte nicht gelöscht werden." },
      { status: 500 },
    );
  }
}
