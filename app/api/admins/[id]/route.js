// app/api/admins/[id]/route.js
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Admin from "@/models/Admin";

export async function GET(req, context) {
  try {
    const id = context.params.id;

    await connectDB();

    const admin = await Admin.findById(id)
      .select("name image email role")
      .lean();

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error("GET admin error:", error);
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
