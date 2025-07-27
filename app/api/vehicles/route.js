import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

function getCreatedByFromEmail(email) {
  if (email === "autogalerie.juelich@web.de") return "karim";
  if (
    email === "autogalerie-juelich@web.de" ||
    email === "autogalerie-juelich@hotmail.com"
  )
    return "autogalerie-juelich";
  if (email === "admin@gmail.com") return "admin";
  return null;
}

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    const email = session?.user?.email;
    const createdBy = getCreatedByFromEmail(email);

    if (!createdBy) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const filter = createdBy === "admin" ? {} : { createdBy };

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 }).lean();

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

    const email = session?.user?.email;
    const createdBy = getCreatedByFromEmail(email);

    if (!createdBy) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    const existingVehicle = await Vehicle.findOne({
      vin: body.vin.toUpperCase(),
      createdBy,
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
      createdBy,
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
