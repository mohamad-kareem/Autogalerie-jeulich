import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const contract = await Kaufvertrag.findById(params.id).lean();

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();

    const updatedContract = await Kaufvertrag.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    );

    if (!updatedContract) {
      return NextResponse.json(
        { error: "Contract not found for update" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedContract);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const deleted = await Kaufvertrag.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Contract not found for deletion" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
