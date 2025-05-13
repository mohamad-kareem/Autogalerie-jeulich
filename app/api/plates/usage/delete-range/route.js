import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PlateUsage from "@/models/PlateUsage";

export async function POST(req) {
  try {
    const { startTime, endTime } = await req.json();

    if (!startTime || !endTime) {
      return NextResponse.json(
        { message: "Missing time range" },
        { status: 400 }
      );
    }

    await connectDB();

    const entries = await PlateUsage.find({
      startTime: {
        $gte: new Date(startTime),
        $lte: new Date(endTime),
      },
    });

    const ids = entries.map((entry) => entry._id);
    await PlateUsage.deleteMany({ _id: { $in: ids } });

    return NextResponse.json(ids, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
