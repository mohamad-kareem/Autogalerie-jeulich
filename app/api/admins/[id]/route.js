// app/api/admins/[id]/route.js
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import Admin from "@/models/Admin";
import { staffUser } from "@/lib/kaufvertragServer";

export async function GET(req, context) {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
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
  // only the own profile – or any profile for admins
  const me = await staffUser();
  if (!me) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id: target } = await params;
  if (me.role !== "admin" && me.userId !== String(target)) return Response.json({ error: "Keine Berechtigung." }, { status: 403 });
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
