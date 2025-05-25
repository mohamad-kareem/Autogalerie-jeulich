// ✅ [BACKEND] /api/punch/delete-range/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TimeRecord from "@/models/TimeRecord";
import Admin from "@/models/Admin";

export async function DELETE(request) {
  try {
    await connectDB();
    const adminId = request.headers.get("x-admin-id");
    if (!adminId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { start, end, adminId: filterAdminId } = await request.json();
    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const query = {
      time: {
        $gte: new Date(start),
        $lte: new Date(new Date(end).setHours(23, 59, 59, 999)),
      },
    };
    if (filterAdminId) query.admin = filterAdminId;

    const { deletedCount } = await TimeRecord.deleteMany(query);

    if (filterAdminId) {
      const last = await TimeRecord.findOne({ admin: filterAdminId }).sort({
        time: -1,
      });
      await Admin.findByIdAndUpdate(filterAdminId, {
        currentStatus: last?.type || "out",
        lastPunch: last?.time || null,
      });
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("DELETE /api/punch/delete-range error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
