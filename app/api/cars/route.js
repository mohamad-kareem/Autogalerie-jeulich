import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const cars = await Car.find({}).lean();
    return NextResponse.json(cars);
  } catch (err) {
    return new NextResponse("Error loading cars", { status: 500 });
  }
}
