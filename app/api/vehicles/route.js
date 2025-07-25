import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await Vehicle.find({ createdBy: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("[VEHICLES_GET]", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const existingVehicle = await Vehicle.findOne({
      vin: body.vin.toUpperCase(),
      createdBy: session.user.id,
    });

    if (existingVehicle) {
      return NextResponse.json(
        { message: "Vehicle with this VIN already exists" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.create({
      ...body,
      vin: body.vin.toUpperCase(),
      createdBy: session.user.id,
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("[VEHICLES_POST]", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
