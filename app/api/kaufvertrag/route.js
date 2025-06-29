import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";

// Create new contract
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // Check for duplicate invoiceNumber
    const exists = await Kaufvertrag.findOne({
      invoiceNumber: data.invoiceNumber,
    });
    if (exists) {
      return NextResponse.json(
        { error: "Diese Rechnungsnummer existiert bereits." },
        { status: 409 }
      );
    }

    const newContract = await Kaufvertrag.create(data);
    return NextResponse.json(newContract, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get all contracts (for list view)
export async function GET() {
  try {
    await connectDB();

    const contracts = await Kaufvertrag.find()
      .sort({ createdAt: -1 })
      .select(
        "buyerName issuer carType vin mileage invoiceNumber invoiceDate total"
      )
      .lean();

    return NextResponse.json(contracts);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Utility for internal use: fetch single contract by ID
export async function GET_SINGLE(id) {
  try {
    await connectDB();
    const contract = await Kaufvertrag.findById(id).lean();
    return contract;
  } catch (err) {
    throw new Error(err.message);
  }
}
