import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { staffUser } from "@/lib/kaufvertragServer";

export async function GET(req) {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const admin = await Admin.findById(id)
        .select("name image email role")
        .lean();

      if (!admin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }
      return NextResponse.json(admin);
    }

    // Fallback: return all admins if no ID is specified
    const admins = await Admin.find().select("name image email").lean();
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const { id, name, image } = await req.json();

    // only the own profile – or any profile for admins
    const me = await staffUser();
    if (!me) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
    if (me.role !== "admin" && me.userId !== String(id)) return Response.json({ error: "Keine Berechtigung." }, { status: 403 });

    if (!id || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
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
