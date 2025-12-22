import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactCustomer from "@/models/ContactCustomer";

export async function GET() {
  await connectDB();
  const data = await ContactCustomer.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(data);
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const created = await ContactCustomer.create(body);
  return NextResponse.json(created, { status: 201 });
}
