import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const { adminId, deviceId } = await req.json();

    if (!adminId || !deviceId) {
      return NextResponse.json(
        { success: false, error: "Missing data" },
        { status: 400 }
      );
    }

    // Check if device ID is already registered
    const existing = await Admin.findOne({ deviceId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Device already registered" },
        { status: 400 }
      );
    }

    // Update admin with new device ID
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { deviceId },
      { new: true }
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register device error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
