// app/api/punch/route.js
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

    const { type, location } = await request.json();

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Prevent duplicate clock in/out
    const lastRecord = await TimeRecord.findOne({ admin: adminId })
      .sort({ time: -1 })
      .limit(1);

    if (lastRecord && lastRecord.type === type) {
      return NextResponse.json(
        { error: `Already clocked ${type}` },
        { status: 400 }
      );
    }

    const newRecord = await TimeRecord.create({
      admin: admin._id,
      type,
      location: {
        ...location,
        verified: true, // Since we checked distance in frontend
      },
    });

    // Update admin status
    admin.currentStatus = type;
    admin.lastPunch = new Date();
    await admin.save();

    return NextResponse.json({
      success: true,
      record: {
        ...newRecord.toObject(),
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          image: admin.image,
        },
      },
    });
  } catch (error) {
    console.error("Error processing punch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
