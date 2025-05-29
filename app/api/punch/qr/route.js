import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyPunchToken } from "@/lib/jwt";
import Admin from "@/models/Admin";
import TimeRecord from "@/models/TimeRecord";

export async function GET(req) {
  await connectDB();

  const token = new URL(req.url).searchParams.get("token");
  const payload = verifyPunchToken(token);

  if (!payload?.adminId) {
    return NextResponse.json(
      { success: false, error: "Token invalid or expired" },
      { status: 401 }
    );
  }

  const admin = await Admin.findById(payload.adminId);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Admin not found" },
      { status: 404 }
    );
  }

  const lastRecord = await TimeRecord.findOne({ admin: admin._id }).sort({
    time: -1,
  });
  const nextType = lastRecord?.type === "in" ? "out" : "in";

  await TimeRecord.create({
    admin: admin._id,
    type: nextType,
    location: { lat: 0, lng: 0, verified: false }, // No GPS for QR
  });

  admin.currentStatus = nextType;
  admin.lastPunch = new Date();
  await admin.save();

  return NextResponse.json({
    success: true,
    message: `Erfolgreich ${
      nextType === "in" ? "eingestempelt" : "ausgestempelt"
    }`,
  });
}
