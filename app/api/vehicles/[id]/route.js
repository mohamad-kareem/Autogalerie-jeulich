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

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const createdBy = getCreatedByFromEmail(email);

    if (!createdBy) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    // Check for duplicate VIN
    if (body.vin) {
      const existingVehicle = await Vehicle.findOne({
        vin: body.vin.toUpperCase(),
        createdBy,
        _id: { $ne: id },
      });

      if (existingVehicle) {
        return NextResponse.json(
          { message: "Another vehicle with this VIN already exists" },
          { status: 400 }
        );
      }
    }

    const filter = createdBy === "admin" ? { _id: id } : { _id: id, createdBy };

    const vehicle = await Vehicle.findOneAndUpdate(
      filter,
      { ...body, ...(body.vin && { vin: body.vin.toUpperCase() }) },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("[VEHICLES_PUT]", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const createdBy = getCreatedByFromEmail(email);

    if (!createdBy) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const filter = createdBy === "admin" ? { _id: id } : { _id: id, createdBy };

    const vehicle = await Vehicle.findOneAndDelete(filter);

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("[VEHICLES_DELETE]", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
