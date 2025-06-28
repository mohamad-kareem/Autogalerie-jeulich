// File: app/api/schlussels/route.js
import { connectDB } from "@/lib/mongodb";
import Schlussel from "@/models/Schlussel";

export async function GET(request) {
  await connectDB();
  const schlussels = await Schlussel.find().sort({ createdAt: -1 }).lean();
  return new Response(JSON.stringify({ schlussels }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  await connectDB();
  const data = await request.json();
  const schlussel = await Schlussel.create(data);
  return new Response(JSON.stringify({ schlussel }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
