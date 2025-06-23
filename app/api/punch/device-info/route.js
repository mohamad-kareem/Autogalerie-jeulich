import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { deviceId } = await req.json();

    if (!deviceId)
      return NextResponse.json({ success: false, error: "Missing device ID" });

    const admin = await Admin.findOne({ deviceId }).lean();
    if (!admin)
      return NextResponse.json({ success: false, error: "Device not found" });

    const lastRecord = await TimeRecord.findOne({ admin: admin._id })
      .sort({ time: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      adminId: admin._id,
      lastType: lastRecord?.type || "out",
    });
  } catch (err) {
    console.error("❌ Device Info Error:", err);
    return NextResponse.json({ success: false, error: "Server error" });
  }
}
