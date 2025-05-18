// app/api/punch/delete-range/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";

export async function DELETE(request) {
  try {
    await connectDB();

    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { start, end, adminId: filterAdminId } = await request.json();
    if (!start || !end) {
      return NextResponse.json(
        { error: "Both start and end dates are required" },
        { status: 400 }
      );
    }

    // Convert to Date objects
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999); // Include entire end day

    // Build query
    const query = {
      time: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Add admin filter if specified
    if (filterAdminId && filterAdminId !== "all") {
      query.admin = filterAdminId;
    }

    // Delete records
    const result = await TimeRecord.deleteMany(query);

    // Update admin status if needed
    if (filterAdminId && filterAdminId !== "all") {
      const admin = await Admin.findById(filterAdminId);
      const lastRecord = await TimeRecord.findOne({ admin: filterAdminId })
        .sort({ time: -1 })
        .limit(1);

      admin.currentStatus = lastRecord?.type || "out";
      admin.lastPunch = lastRecord?.time || null;
      await admin.save();
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting records by range:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
