// app/api/admins/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function GET() {
  await connectDB();
  const admins = await Admin.find().select("name image email").lean();
  return NextResponse.json(admins);
}
