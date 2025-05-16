import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";

export async function GET() {
  try {
    await connectDB();
    const records = await TimeRecord.find()
      .populate("admin", "name email image")
      .sort({ time: -1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching punch data:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, location, deviceInfo } = await request.json();

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const newRecord = await TimeRecord.create({
      admin: admin._id,
      type,
      location,
      deviceInfo,
    });

    admin.currentStatus = type;
    admin.lastPunch = new Date();
    await admin.save();

    return NextResponse.json({
      success: true,
      status: admin.currentStatus,
      lastPunch: admin.lastPunch,
      recordId: newRecord._id,
    });
  } catch (error) {
    console.error("Error processing punch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
