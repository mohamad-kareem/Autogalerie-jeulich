import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { deviceId } = await req.json();

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: "Device ID required" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ deviceId });
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Device not registered" },
        { status: 404 }
      );
    }

    const lastRecord = await TimeRecord.findOne({ admin: admin._id })
      .sort({ time: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      adminId: admin._id,
      lastType: lastRecord?.type || "out",
    });
  } catch (error) {
    console.error("Device info error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
