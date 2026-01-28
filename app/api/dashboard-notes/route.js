import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // ✅ adjust if your file path differs
import DashboardNote from "@/models/DashboardNote";

/* ---------------------------
   GET: list notes
   --------------------------- */
export async function GET() {
  try {
    await connectDB();

    const notes = await DashboardNote.find({})
      .sort({ pinned: -1, updatedAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ notes }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load notes" },
      { status: 500 },
    );
  }
}

/* ---------------------------
   POST: create note
   body: { text, pinned?, createdBy? }
   --------------------------- */
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const text = String(body?.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const note = await DashboardNote.create({
      text,
      pinned: !!body?.pinned,
      createdBy: String(body?.createdBy || ""),
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}

/* ---------------------------
   PUT: update note
   body: { id, text?, pinned? }
   --------------------------- */
export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();

    const id = String(body?.id || "");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const update = {};
    if (typeof body?.text === "string") update.text = body.text.trim();
    if (typeof body?.pinned === "boolean") update.pinned = body.pinned;

    const note = await DashboardNote.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

/* ---------------------------
   DELETE: delete note
   body: { id }
   --------------------------- */
export async function DELETE(req) {
  try {
    await connectDB();
    const body = await req.json();

    const id = String(body?.id || "");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await DashboardNote.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
