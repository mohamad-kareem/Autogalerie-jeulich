import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TimeRecord from "@/models/TimeRecord";

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const adminId = req.headers.get("x-admin-id");
    const editorName = req.headers.get("x-admin-name");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { type, time, method } = await req.json();

    const updated = await TimeRecord.findByIdAndUpdate(
      id,
      {
        type,
        time: new Date(time),
        method: "edited",
        editedBy: editorName,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error("PATCH /api/punch/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ NEW DELETE endpoint
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const adminId = req.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const deleted = await TimeRecord.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/punch/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
