// ✅ /api/punch/summary/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TimeRecord from "@/models/TimeRecord";
import Admin from "@/models/Admin";

export async function GET() {
  try {
    await connectDB();

    const raw = await TimeRecord.find({})
      .populate("admin", "name")
      .sort({ time: 1 }) // chronological for pairing
      .lean();

    const durations = {};

    for (const record of raw) {
      const name = record.admin?.name;
      if (!name) continue;

      if (!durations[name]) durations[name] = { totalMs: 0, lastIn: null };

      if (record.type === "in") {
        durations[name].lastIn = new Date(record.time);
      } else if (record.type === "out" && durations[name].lastIn) {
        const outTime = new Date(record.time);
        const diff = outTime - durations[name].lastIn;
        if (diff > 0 && diff < 1000 * 60 * 60 * 12) {
          durations[name].totalMs += diff;
        }
        durations[name].lastIn = null;
      }
    }

    const summary = Object.entries(durations).map(([name, data]) => ({
      name,
      hours: +(data.totalMs / (1000 * 60 * 60)).toFixed(2),
    }));

    return NextResponse.json(summary);
  } catch (err) {
    console.error("Summary fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
