import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import CarSchein from "@/models/CarSchein";

// 🔧 helper: extract last number and increment
function generateNextNumber(baseNumber) {
  if (!baseNumber) return "1"; // if no contracts yet
  const match = baseNumber.match(/(\d+)$/);
  if (!match) return baseNumber + "1";
  const num = parseInt(match[1], 10) + 1;
  return baseNumber.replace(/\d+$/, String(num));
}

// ➕ Create new contract
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // 1️⃣ Find last NON-IGNORED contract for this issuer
    const lastValidContract = await Kaufvertrag.findOne({
      issuer: data.issuer,
      ignored: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    // 2️⃣ Determine base number
    const baseNumber =
      lastValidContract?.originalInvoiceNumber ||
      lastValidContract?.invoiceNumber;

    // 3️⃣ Generate new invoice number
    const newInvoiceNumber = generateNextNumber(baseNumber);

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
      const parsedNotes = (agreements || "")
        .split("\n")
        .map((line) => line.replace(/^\* /, "").trim())
        .filter((line) => line !== "");

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
