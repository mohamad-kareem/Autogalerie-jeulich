import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import CarSchein from "@/models/CarSchein"; // 👈 import this if not already

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // 🔒 1. Prevent duplicate invoice numbers
    const exists = await Kaufvertrag.findOne({
      invoiceNumber: data.invoiceNumber,
    });
    if (exists) {
      return NextResponse.json(
        { error: "Diese Rechnungsnummer existiert bereits." },
        { status: 409 }
      );
    }

    // 🧾 2. Create Kaufvertrag entry
    const newContract = await Kaufvertrag.create(data);

    // 🚗 3. Create or update CarSchein based on VIN and agreements
    const { carType, vin, agreements, issuer } = data;

    if (carType && vin && agreements?.trim()) {
      const parsedNotes = agreements
        .split("\n")
        .map((line) => line.replace(/^\* /, "").trim())
        .filter((line) => line !== "");

      if (parsedNotes.length > 0) {
        const existingSchein = await CarSchein.findOne({ finNumber: vin });

        if (existingSchein) {
          // ✅ Update existing: merge and deduplicate notes
          const combinedNotes = [
            ...(existingSchein.notes || []),
            ...parsedNotes,
          ];
          const uniqueNotes = [...new Set(combinedNotes)];

          await CarSchein.findByIdAndUpdate(existingSchein._id, {
            $set: { notes: uniqueNotes },
          });
        } else {
          // ✅ Create new CarSchein entry
          await CarSchein.create({
            carName: carType,
            finNumber: vin,
            notes: parsedNotes,
            assignedTo: "",
            owner: issuer === "karim" ? "Karim" : "Alawie",
          });
        }
      }
    }

    return NextResponse.json(newContract, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get all contracts (for list view)
export async function GET(req) {
  try {
    await connectDB();

    // ✅ Build full URL using req.headers.get('host')
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
        "buyerName issuer carType vin mileage invoiceNumber invoiceDate total"
      )
      .lean();

    return NextResponse.json(contracts);
  } catch (err) {
    console.error("GET ERROR:", err);
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
