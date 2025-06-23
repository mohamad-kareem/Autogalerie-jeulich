import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();

    const { adminId, deviceId } = await req.json();
    console.log("📥 Registering device", { adminId, deviceId });

    if (!adminId || !deviceId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    admin.deviceId = deviceId;
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Register Device Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
