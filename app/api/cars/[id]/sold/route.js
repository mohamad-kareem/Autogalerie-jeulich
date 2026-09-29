import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { staffSession } from "@/lib/cars/auth";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

/** PUT /api/cars/:id/sold { sold } — only for signed-in employees. */
export async function PUT(request, { params }) {
  if (!(await staffSession())) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Fahrzeug nicht gefunden." }, { status: 404 });
  }

  try {
    const { sold } = await request.json();
    await connectDB();
    const car = await Car.findByIdAndUpdate(id, { sold: Boolean(sold) }, { new: true }).lean();
    if (!car) return NextResponse.json({ error: "Fahrzeug nicht gefunden." }, { status: 404 });

    revalidatePath("/gebrauchtwagen");
    revalidatePath(`/gebrauchtwagen/${id}`);
    return NextResponse.json(car);
  } catch (error) {
    return NextResponse.json({ error: error?.message || "Fehler." }, { status: 500 });
  }
}
