import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { nextNumber as computeNext } from "@/lib/kaufvertragServer";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const issuer = searchParams.get("issuer");

    if (!issuer) {
      return NextResponse.json(
        { error: "Issuer is required" },
        { status: 400 }
      );
    }

    const nextNumber = await computeNext(issuer);

    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
