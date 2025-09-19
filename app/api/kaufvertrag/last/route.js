import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { generateNextNumber } from "@/app/utils/invoiceHelpers";

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

    // ✅ Get the last NON-IGNORED contract for this issuer
    const lastValidContract = await Kaufvertrag.findOne({
      issuer,
      ignored: { $ne: true }, // skip ignored ones
    })
      .sort({ createdAt: -1 })
      .lean();

    const baseNumber =
      lastValidContract?.originalInvoiceNumber ||
      lastValidContract?.invoiceNumber ||
      null;

    // ✅ Generate the next number with utils
    const nextNumber = generateNextNumber(baseNumber, issuer);

    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
