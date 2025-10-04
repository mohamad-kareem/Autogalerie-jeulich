import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import CarSchein from "@/models/CarSchein";
import { generateNextNumber } from "@/app/utils/invoiceHelpers";
import { getLastValidContract } from "@/app/utils/getLastValidContract"; // ✅ import helper

// ➕ Create new contract
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // 1️⃣ Use helper to get correct last contract
    const lastValidContract = await getLastValidContract(data.issuer);

    // 2️⃣ Determine base number
    const baseNumber =
      lastValidContract?.originalInvoiceNumber ||
      lastValidContract?.invoiceNumber;

    // 3️⃣ Generate new invoice number
    const newInvoiceNumber = generateNextNumber(baseNumber, data.issuer);

    // 4️⃣ Ensure uniqueness
    const exists = await Kaufvertrag.findOne({
      invoiceNumber: newInvoiceNumber,
    });
    if (exists) {
      return NextResponse.json(
        { error: "Diese Rechnungsnummer existiert bereits." },
        { status: 409 }
      );
    }

    // 5️⃣ Create new contract
    const newContract = await Kaufvertrag.create({
      ...data,
      invoiceNumber: newInvoiceNumber,
    });

    // 6️⃣ CarSchein sync
    const { carType, vin, agreements, issuer } = data;
    if (carType && vin) {
      let parsedNotes = [];

      if (Array.isArray(agreements)) {
        parsedNotes = agreements.map((line) => line.trim()).filter(Boolean);
      } else if (typeof agreements === "string") {
        parsedNotes = agreements
          .split(/\r?\n|;/) // split by newline or semicolon
          .map((line) => line.replace(/^\* /, "").trim())
          .filter(Boolean);
      }

      const existingSchein = await CarSchein.findOne({ finNumber: vin });

      if (existingSchein) {
        if (parsedNotes.length > 0) {
          const combinedNotes = [
            ...(existingSchein.notes || []),
            ...parsedNotes,
          ];
          const uniqueNotes = [...new Set(combinedNotes)];
          await CarSchein.findByIdAndUpdate(existingSchein._id, {
            $set: { notes: uniqueNotes },
          });
        }
      } else {
        await CarSchein.create({
          carName: carType,
          finNumber: vin,
          notes: parsedNotes,
          assignedTo: "",
          owner: issuer === "karim" ? "Karim" : "Alawie",
        });
      }
    }

    return NextResponse.json(newContract, { status: 201 });
  } catch (err) {
    console.error("POST ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 📋 List contracts
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(
      req.url,
      `http://${req.headers.get("host")}`
    );
    const showArchived = searchParams.get("archived") === "true";

    const contracts = await Kaufvertrag.find(
      showArchived ? { archived: true } : { archived: { $ne: true } }
    )
      .sort({ createdAt: -1 })
      .select(
        "buyerName issuer carType vin mileage invoiceNumber invoiceDate total starred ignored archived originalInvoiceNumber"
      )
      .lean();

    return NextResponse.json(contracts);
  } catch (err) {
    console.error("GET ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🛠️ Utility for single fetch
export async function GET_SINGLE(id) {
  try {
    await connectDB();
    const contract = await Kaufvertrag.findById(id).lean();
    return contract;
  } catch (err) {
    throw new Error(err.message);
  }
}
