// app/api/admins/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const admin = await Admin.findById(params.id)
      .select("name image email")
      .lean();

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { name, image } = await request.json();

    const updatedAdmin = await Admin.findByIdAndUpdate(
      params.id,
      { name, image },
      { new: true }
    ).select("name image email");

    if (!updatedAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
