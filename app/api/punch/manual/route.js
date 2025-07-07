import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TimeRecord from "@/models/TimeRecord";
import Admin from "@/models/Admin";

export async function POST(request) {
  try {
    await connectDB();
    const creatorId = request.headers.get("x-admin-id");
    const creatorName = request.headers.get("x-admin-name");
    const { admin: adminName, type, time, method } = await request.json();
    if (!adminName || !type || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const admin = await Admin.findOne({ name: adminName });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    await TimeRecord.create({
      admin: admin._id,
      type,
      method: "added",
      time: new Date(time),
      createdBy: creatorId,
      addedBy: creatorName, // NEW
      location: { lat: 0, lng: 0 },
    });

    // ✅ Update admin status
    admin.currentStatus = type;
    admin.lastPunch = new Date(time);
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/punch/manual error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
