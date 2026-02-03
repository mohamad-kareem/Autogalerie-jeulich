import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ScheduleEvent from "@/models/ScheduleEvent";
import mongoose from "mongoose";

function bad(msg, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

const ALLOWED_VARIANTS = new Set(["red", "yellow", "green"]);

function normalizeVariant(v) {
  if (!v) return v;
  const x = String(v).toLowerCase();

  if (x === "blue") return "green";
  if (x === "emerald") return "green";
  if (x === "amber") return "yellow";

  return x;
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const id = params?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) return bad("Invalid id");

    const body = await req.json();
    const patch = {};

    if (typeof body.day === "string") patch.day = body.day;

    if (body.startMin !== undefined) patch.startMin = Number(body.startMin);
    if (body.endMin !== undefined) patch.endMin = Number(body.endMin);

    if (typeof body.title === "string") patch.title = body.title.trim();

    if (typeof body.variant === "string") {
      const normalized = normalizeVariant(body.variant);
      if (!ALLOWED_VARIANTS.has(normalized))
        return bad("Invalid variant (use red/yellow/green)");
      patch.variant = normalized;
    }

    if (patch.startMin !== undefined && !Number.isFinite(patch.startMin))
      return bad("Invalid startMin");
    if (patch.endMin !== undefined && !Number.isFinite(patch.endMin))
      return bad("Invalid endMin");

    if (patch.title !== undefined && !patch.title)
      return bad("Title cannot be empty");

    // If both exist in patch
    if (
      patch.startMin !== undefined &&
      patch.endMin !== undefined &&
      patch.endMin <= patch.startMin
    ) {
      return bad("endMin must be > startMin");
    }

    // If only endMin changed -> compare with current startMin
    if (patch.endMin !== undefined && patch.startMin === undefined) {
      const current = await ScheduleEvent.findById(id).lean();
      if (!current) return bad("Not found", 404);
      if (patch.endMin <= current.startMin)
        return bad("endMin must be > startMin");
    }

    // If only startMin changed -> compare with current endMin
    if (patch.startMin !== undefined && patch.endMin === undefined) {
      const current = await ScheduleEvent.findById(id).lean();
      if (!current) return bad("Not found", 404);
      if (current.endMin <= patch.startMin)
        return bad("endMin must be > startMin");
    }

    const updated = await ScheduleEvent.findByIdAndUpdate(id, patch, {
      new: true,
    }).lean();

    if (!updated) return bad("Not found", 404);

    return NextResponse.json({ ok: true, item: updated });
  } catch (e) {
    return bad(e?.message || "Server error", 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const id = params?.id;

    if (!mongoose.Types.ObjectId.isValid(id)) return bad("Invalid id");

    const deleted = await ScheduleEvent.findByIdAndDelete(id).lean();
    if (!deleted) return bad("Not found", 404);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return bad(e?.message || "Server error", 500);
  }
}
