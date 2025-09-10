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

    // ✅ Always get last contract for issuer (starred or not)
    const lastContract = await Kaufvertrag.findOne({ issuer })
      .sort({ createdAt: -1 })
      .lean();

    if (!lastContract) {
      return NextResponse.json(null);
    }

    // ✅ Ensure we return the base number, not the starred version
    const baseNumber =
      lastContract.originalInvoiceNumber || lastContract.invoiceNumber;

    return NextResponse.json({ ...lastContract, baseNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
