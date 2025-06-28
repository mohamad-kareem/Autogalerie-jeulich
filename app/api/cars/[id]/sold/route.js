import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { NextResponse } from "next/server";

export async function PUT(request, context) {
  try {
    await connectDB();

    const { params } = context; // ✅ No need to await — `context` is directly available
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing car ID" }, { status: 400 });
    }

    const { sold } = await request.json();

    const updatedCar = await Car.findByIdAndUpdate(
      id,
      { sold },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedCar) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCar, { status: 200 });
  } catch (error) {
    console.error("Error updating car sold status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
