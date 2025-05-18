// app/api/punch/latest/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TimeRecord from "@/models/TimeRecord";

export async function GET(request) {
  try {
    await connectDB();

    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latestRecord = await TimeRecord.findOne({ admin: adminId })
      .sort({ time: -1 })
      .populate("admin", "name email image")
      .lean();

    return NextResponse.json(latestRecord || {});
  } catch (error) {
    console.error("Error fetching latest record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
