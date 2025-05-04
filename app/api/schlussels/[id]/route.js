// File: app/api/schlussels/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Schlussel from "@/models/Schlussel";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  await connectDB();
  const updates = await request.json();
  updates.updatedAt = Date.now();

  const schlussel = await Schlussel.findByIdAndUpdate(params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!schlussel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ schlussel });
}

export async function DELETE(request, { params }) {
  await connectDB();
  const schlussel = await Schlussel.findByIdAndDelete(params.id);
  if (!schlussel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
