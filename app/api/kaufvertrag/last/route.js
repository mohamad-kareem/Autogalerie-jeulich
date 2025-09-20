import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { generateNextNumber } from "@/app/utils/invoiceHelpers";
import { getLastValidContract } from "@/app/utils/getLastValidContract"; // ✅ import helper

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

    // ✅ use helper instead of createdAt
    const lastValidContract = await getLastValidContract(issuer);

    const baseNumber =
      lastValidContract?.originalInvoiceNumber ||
      lastValidContract?.invoiceNumber ||
      null;

    const nextNumber = generateNextNumber(baseNumber, issuer);

    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
