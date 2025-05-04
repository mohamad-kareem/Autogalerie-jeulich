import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function GET(request, { params }) {
  await connectDB();
  const car = await Car.findById(params.id).lean();
  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }
  // If public and car is inactive, block it
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin && !car.active) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(car, { status: 200 });
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const { active } = await request.json();
  try {
    const car = await Car.findById(params.id);
    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }
    car.active = active;
    await car.save();
    return NextResponse.json({ car }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  try {
    await Car.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Car deleted" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
