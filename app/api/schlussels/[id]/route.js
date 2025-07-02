// File: app/api/schlussels/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Schlussel from "@/models/Schlussel";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const id = params.id;
    const updates = await request.json();

    const setFields = {};
    const unsetFields = {};

    for (const key in updates) {
      if (updates[key] === "") {
        unsetFields[key] = "";
      } else {
        setFields[key] = updates[key];
      }
    }

    setFields.updatedAt = Date.now();

    const schlussel = await Schlussel.findByIdAndUpdate(
      id,
      {
        $set: setFields,
        ...(Object.keys(unsetFields).length > 0 && { $unset: unsetFields }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return NextResponse.json({ schlussel });
  } catch (error) {
    console.error("PUT error:", error);
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
