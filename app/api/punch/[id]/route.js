import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recordId = params.id;

    if (!recordId) {
      return NextResponse.json(
        { error: "Record ID required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return NextResponse.json(
        { error: "Invalid record ID format" },
        { status: 400 }
      );
    }

    // Find and delete the record
    const record = await TimeRecord.findOneAndDelete({
      _id: recordId,
      admin: adminId,
    });

    if (!record) {
      return NextResponse.json(
        { error: "Record not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update admin status
    const admin = await Admin.findById(adminId);
    const lastRecord = await TimeRecord.findOne({ admin: adminId })
      .sort({ time: -1 })
      .limit(1);

    admin.currentStatus = lastRecord?.type || "out";
    admin.lastPunch = lastRecord?.time || null;
    await admin.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
