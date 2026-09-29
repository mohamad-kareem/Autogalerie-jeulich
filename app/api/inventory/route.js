import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import InventoryItem from "@/models/InventoryItem";

async function authorized() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session : null;
}

export async function GET() {
  try {
    if (!(await authorized())) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const items = await InventoryItem.find().sort({ updatedAt: -1 }).lean();
    return Response.json(items);
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return Response.json({ error: "Lagerbestand konnte nicht geladen werden" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await authorized();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const item = await InventoryItem.create({ ...body, createdBy: session.user.id });
    return Response.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return Response.json({ error: error.message || "Artikel konnte nicht gespeichert werden" }, { status: 400 });
  }
}
