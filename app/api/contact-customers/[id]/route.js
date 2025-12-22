import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactCustomer from "@/models/ContactCustomer";

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const updated = await ContactCustomer.findByIdAndUpdate(params.id, body, {
    new: true,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  await connectDB();
  await ContactCustomer.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
