import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactCustomer from "@/models/ContactCustomer";
import { staffUser } from "@/lib/kaufvertragServer";

export async function GET() {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  await connectDB();
  const data = await ContactCustomer.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(data);
}

export async function POST(req) {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const created = await ContactCustomer.create(body);
  return NextResponse.json(created, { status: 201 });
}
