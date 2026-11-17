// POST /api/admin/wipe – deletes ALL data in the database (admins only).
// body: { confirm: "LÖSCHEN" }
// Everything goes, the login accounts too. Collections stay (with their indexes), only their documents are removed.

import { connectDB } from "@/lib/mongodb";
import { adminUser } from "@/lib/kaufvertragServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  const user = await adminUser();
  if (!user) return Response.json({ error: "Nur für Admins." }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (String(body?.confirm || "").trim() !== "LÖSCHEN") {
    return Response.json({ error: "Bitte zur Bestätigung LÖSCHEN eingeben." }, { status: 400 });
  }
  try {
    const { db } = await connectDB();
    const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."));
    for (const name of collections) await db.collection(name).deleteMany({});
    console.warn(`wipe: all data deleted by ${user.email || user.name}`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("wipe:", error);
    return Response.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
