// /app/api/punch/delete-day/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export async function DELETE(request) {
  try {
    await connectDB();
    const adminIdHeader = request.headers.get("x-admin-id");
    if (!adminIdHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { adminName, date } = await request.json();
    if (!adminName || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = await Admin.findOne({ name: adminName }).select("_id");
    if (!admin)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const s = startOfDay(date);
    const e = endOfDay(date);

    const res = await TimeRecord.deleteMany({
      admin: admin._id,
      time: { $gte: s, $lte: e },
    });

    return NextResponse.json({ success: true, deletedCount: res.deletedCount });
  } catch (e) {
    console.error("DELETE /api/punch/delete-day", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
