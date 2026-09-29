import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import InventoryItem from "@/models/InventoryItem";

async function canAccess() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user?.id);
}

export async function PUT(req, { params }) {
  try {
    if (!(await canAccess())) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Ungültige Artikel-ID" }, { status: 400 });
    await connectDB();
    const item = await InventoryItem.findByIdAndUpdate(id, await req.json(), { new: true, runValidators: true }).lean();
    if (!item) return Response.json({ error: "Artikel nicht gefunden" }, { status: 404 });
    return Response.json(item);
  } catch (error) {
    console.error("PUT /api/inventory error:", error);
    return Response.json({ error: error.message || "Artikel konnte nicht gespeichert werden" }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    if (!(await canAccess())) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Ungültige Artikel-ID" }, { status: 400 });
    await connectDB();
    const item = await InventoryItem.findByIdAndDelete(id);
    if (!item) return Response.json({ error: "Artikel nicht gefunden" }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/inventory error:", error);
    return Response.json({ error: "Artikel konnte nicht gelöscht werden" }, { status: 500 });
  }
}
