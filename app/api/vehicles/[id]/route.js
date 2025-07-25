import { connectDB } from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Check if VIN is being updated to a value that already exists
    if (body.vin) {
      const existingVehicle = await Vehicle.findOne({
        vin: body.vin.toUpperCase(),
        createdBy: session.user.id,
        _id: { $ne: id },
      });

      if (existingVehicle) {
        return NextResponse.json(
          { message: "Another vehicle with this VIN already exists" },
          { status: 400 }
        );
      }
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: id, createdBy: session.user.id },
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

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const vehicle = await Vehicle.findOneAndDelete({
      _id: id,
      createdBy: session.user.id,
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Vehicle deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[VEHICLES_DELETE]", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
