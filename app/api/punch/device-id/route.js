// ✅ /api/admin/device-id/route.js
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const adminId = req.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await Admin.findById(adminId).lean();
    return NextResponse.json({ deviceId: admin?.deviceId || null });
  } catch (err) {
    console.error("GET /api/admin/device-id error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
