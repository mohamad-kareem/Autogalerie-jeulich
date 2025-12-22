import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import Kaufvertrag from "@/models/Kaufvertrag";
import CarSchein from "@/models/CarSchein";
import ContactCustomer from "@/models/ContactCustomer";

import { generateNextNumber } from "@/app/utils/invoiceHelpers";
import { getLastValidContract } from "@/app/utils/getLastValidContract";

/* ─────────────────────────────────────────────
   POST → Create Kaufvertrag
───────────────────────────────────────────── */
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    /* 1️⃣ Get last valid contract for correct numbering */
    const lastValidContract = await getLastValidContract(data.issuer);

    const baseNumber =
      lastValidContract?.originalInvoiceNumber ||
      lastValidContract?.invoiceNumber;

    /* 2️⃣ Generate new invoice number */
    const invoiceNumber = generateNextNumber(baseNumber, data.issuer);

    /* 3️⃣ Ensure invoice number is unique */
    const exists = await Kaufvertrag.findOne({ invoiceNumber });
    if (exists) {
      return NextResponse.json(
        { error: "Diese Rechnungsnummer existiert bereits." },
        { status: 409 }
      );
    }

    /* 4️⃣ Create Kaufvertrag */
    const contract = await Kaufvertrag.create({
      ...data,
      invoiceNumber,
    });

    /* 5️⃣ Save ContactCustomer (independent from Kaufvertrag) */
    await ContactCustomer.create({
      customerName: data.buyerName,
      phone: data.phone,
      email: data.email,
      street: data.buyerStreet,
      city: data.buyerCity,
      postalCode: data.postalCode || "",
      carName: data.carType,
      vin: data.vin,
      firstRegistration: data.firstRegistration,
      source: "kaufvertrag",
    });

    /* 6️⃣ CarSchein sync + mark vehicle as sold */
    const { carType, vin, agreements, issuer } = data;

    if (carType && vin) {
      let parsedNotes = [];

      if (Array.isArray(agreements)) {
        parsedNotes = agreements.map((l) => l.trim()).filter(Boolean);
      } else if (typeof agreements === "string") {
        parsedNotes = agreements
          .split(/\r?\n|;/)
          .map((l) => l.replace(/^\* /, "").trim())
          .filter(Boolean);
      }

      const existingSchein = await CarSchein.findOne({ finNumber: vin });

      if (existingSchein) {
        const update = {
          keySold: true,
        };

        if (parsedNotes.length > 0) {
          const merged = [...(existingSchein.notes || []), ...parsedNotes];
          update.notes = [...new Set(merged)];
        }

        await CarSchein.findByIdAndUpdate(existingSchein._id, {
          $set: update,
        });
      } else {
        await CarSchein.create({
          carName: carType,
          finNumber: vin,
          notes: parsedNotes,
          assignedTo: "",
          owner: issuer === "karim" ? "Karim" : "Alawie",
          keySold: true,
        });
      }
    }

    return NextResponse.json(contract, { status: 201 });
  } catch (err) {
    console.error("POST /kaufvertrag ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────
   GET → List Kaufverträge (archived / active)
───────────────────────────────────────────── */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
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
    console.error("GET /kaufvertrag ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────
   Utility → Fetch single contract (internal use)
───────────────────────────────────────────── */
export async function GET_SINGLE(id) {
  try {
    await connectDB();
    return await Kaufvertrag.findById(id).lean();
  } catch (err) {
    throw new Error(err.message);
  }
}
