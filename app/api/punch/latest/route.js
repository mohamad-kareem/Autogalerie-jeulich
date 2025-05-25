// ✅ [BACKEND] /api/punch/latest/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TimeRecord from "@/models/TimeRecord";

export async function GET(request) {
  try {
    await connectDB();
    const adminId = request.headers.get("x-admin-id");
    if (!adminId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const latest = await TimeRecord.findOne({ admin: adminId })
      .sort({ time: -1 })
      .select("type time")
      .lean();

    return NextResponse.json(latest || {});
  } catch (error) {
    console.error("GET /api/punch/latest error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
