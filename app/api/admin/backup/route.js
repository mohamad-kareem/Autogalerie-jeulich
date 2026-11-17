// GET /api/admin/backup – every collection of the database as one JSON file (admins only).
// Extended JSON keeps ObjectIds and dates, so the file can be read back into MongoDB.

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { adminUser } from "@/lib/kaufvertragServer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await adminUser())) return Response.json({ error: "Nur für Admins." }, { status: 403 });
  try {
    const { db } = await connectDB();
    const { EJSON } = mongoose.mongo.BSON;
    const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."))
      .sort();

    const data = {};
    for (const name of collections) data[name] = await db.collection(name).find({}).toArray();

    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(new Date());
    const body = EJSON.stringify({ createdAt: new Date(), database: db.databaseName, collections: data }, { relaxed: false });
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="backup-${day}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("backup:", error);
    return Response.json({ error: "Backup konnte nicht erstellt werden." }, { status: 500 });
  }
}
