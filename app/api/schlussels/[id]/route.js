// File: app/api/schlussels/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Schlussel from "@/models/Schlussel";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const updates = await request.json();
    updates.updatedAt = Date.now();

    const schlussel = await Schlussel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!schlussel) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ schlussel });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const schlussel = await Schlussel.findByIdAndDelete(id);

    if (!schlussel) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
