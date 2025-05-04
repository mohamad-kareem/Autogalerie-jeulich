import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  await connectDB();

  const { searchParams } = new URL(request.url);
  const query = {};

  // Only admins see all cars; public sees only active ones
  if (!session?.user?.isAdmin) {
    query.active = true;
  }

  if (searchParams.get("make")) {
    query.name = { $regex: `^${searchParams.get("make")}$`, $options: "i" };
  }
  if (searchParams.get("model")) {
    query.model = { $regex: searchParams.get("model"), $options: "i" };
  }
  if (searchParams.get("type")) {
    query.category = searchParams.get("type");
  }
  if (searchParams.get("transmission")) {
    query.transmission = searchParams.get("transmission");
  }
  if (searchParams.get("fuel")) {
    query.fuel = searchParams.get("fuel");
  }
  if (searchParams.get("maxPrice")) {
    query.price = { $lte: Number(searchParams.get("maxPrice")) };
  }
  if (searchParams.get("maxKilometers")) {
    query.kilometers = { $lte: Number(searchParams.get("maxKilometers")) };
  }
  if (searchParams.get("minYear")) {
    query.registrationYear = { $gte: Number(searchParams.get("minYear")) };
  }

  const cars = await Car.find(query).sort({ createdAt: -1 });
  return NextResponse.json({ cars }, { status: 200 });
}
