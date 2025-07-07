import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";

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

    const lastContract = await Kaufvertrag.find({ issuer })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    return NextResponse.json(lastContract[0] || null);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
