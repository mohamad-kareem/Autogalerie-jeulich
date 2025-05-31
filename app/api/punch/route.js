// ✅ [BACKEND] /api/punch/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";

export async function GET() {
  try {
    await connectDB();
    const records = await TimeRecord.find({})
      .populate("admin", "name")
      .sort({ time: -1 })
      .lean();

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/punch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const adminId = request.headers.get("x-admin-id");
    if (!adminId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, location, method } = await request.json();

    const admin = await Admin.findById(adminId);
    if (!admin)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const lastRecord = await TimeRecord.findOne({ admin: adminId }).sort({
      time: -1,
    });
    if (lastRecord && lastRecord.type === type)
      return NextResponse.json(
        { error: `Already clocked ${type}` },
        { status: 400 }
      );

    await TimeRecord.create({
      admin: admin._id,
      type,
      location,
      method: method || "manual", // ✅ fallback in case it's missing
    });

    admin.currentStatus = type;
    admin.lastPunch = new Date();
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/punch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
