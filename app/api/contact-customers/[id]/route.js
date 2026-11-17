import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactCustomer from "@/models/ContactCustomer";
import { staffUser } from "@/lib/kaufvertragServer";

export async function PUT(req, { params }) {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const updated = await ContactCustomer.findByIdAndUpdate(params.id, body, {
    new: true,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  await connectDB();
  await ContactCustomer.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
