import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ScheduleEvent from "@/models/ScheduleEvent";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

// ✅ Allowed futuristic variants
const ALLOWED_VARIANTS = new Set(["red", "yellow", "green"]);

// ✅ Map old variants to new ones (old frontend/data won’t break)
function normalizeVariant(v) {
  if (!v) return "green";
  const x = String(v).toLowerCase();

  if (x === "blue") return "green";
  if (x === "emerald") return "green";
  if (x === "amber") return "yellow";

  return x;
}

export async function GET() {
  try {
    await connectDB();

    // ✅ GLOBAL: fetch everything
    const items = await ScheduleEvent.find({})
      .sort({ day: 1, startMin: 1 })
      .lean();

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return bad(e?.message || "Server error", 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const day = body.day;
    const startMin = Number(body.startMin);
    const endMin = Number(body.endMin);
    const title = (body.title || "").trim();
    const variant = normalizeVariant(body.variant);

    if (!day) return bad("Missing day");
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin))
      return bad("Invalid time");
    if (!title) return bad("Title is required");
    if (endMin <= startMin) return bad("endMin must be > startMin");

    if (!ALLOWED_VARIANTS.has(variant))
      return bad("Invalid variant (use red/yellow/green)");

    const doc = await ScheduleEvent.create({
      day,
      startMin,
      endMin,
      title,
      variant,
    });

    return NextResponse.json(
      { ok: true, item: doc.toObject() },
      { status: 201 },
    );
  } catch (e) {
    return bad(e?.message || "Server error", 500);
  }
}
