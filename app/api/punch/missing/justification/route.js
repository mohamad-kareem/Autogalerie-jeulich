// /app/api/punch/missing/justification/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import MissingPunch from "@/models/MissingPunch";

// Helpers
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const adminName = searchParams.get("adminName"); // optional

    const query = {};
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = startOfDay(from);
      if (to) query.date.$lte = startOfDay(to);
    }

    if (adminName) {
      const admin = await Admin.findOne({ name: adminName }).select("_id");
      if (!admin) return NextResponse.json([], { status: 200 });
      query.admin = admin._id;
    }

    const rows = await MissingPunch.find(query)
      .populate("admin", "name")
      .sort({ date: 1 })
      .lean();

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/punch/missing/justification", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const adminIdHeader = request.headers.get("x-admin-id");
    const adminNameHeader = request.headers.get("x-admin-name");
    if (!adminIdHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { adminName, date, reason } = await request.json();
    if (!adminName || !date || !reason?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = await Admin.findOne({ name: adminName });
    if (!admin)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const doc = await MissingPunch.findOneAndUpdate(
      { admin: admin._id, date: startOfDay(date) },
      { reason: reason.trim(), createdBy: adminNameHeader || "System" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: doc });
  } catch (e) {
    console.error("POST /api/punch/missing/justification", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// /app/api/punch/missing/justification/route.js
export async function DELETE(request) {
  try {
    await connectDB();
    const { adminName, date } = await request.json();
    if (!adminName || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = await Admin.findOne({ name: adminName });
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const doc = await MissingPunch.findOneAndUpdate(
      { admin: admin._id, date: startOfDay(date) },
      { ignored: true, reason: null },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc });
  } catch (e) {
    console.error("DELETE /api/punch/missing/justification", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
