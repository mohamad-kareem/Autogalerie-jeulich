import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const car = await Car.findById(params.id);
    if (!car) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error("Error fetching car by ID:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
