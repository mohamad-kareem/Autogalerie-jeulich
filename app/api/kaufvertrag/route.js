import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import Kaufvertrag from "@/models/Kaufvertrag";
import CarSchein from "@/models/CarSchein";
import Car from "@/models/Car";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import ContactCustomer from "@/models/ContactCustomer";

import { nextNumber, staffUser } from "@/lib/kaufvertragServer";

/** Never lets the contract fail: the contract matters more than the label. */
async function markWebsiteCarSold({ vin, carId }) {
  try {
    const match = [];
    const fin = String(vin || "").trim().toUpperCase();
    if (fin.length >= 11) match.push({ vin: fin });
    if (carId && mongoose.isValidObjectId(carId)) match.push({ _id: carId });
    if (!match.length) return;
    const result = await Car.updateMany({ $or: match }, { $set: { sold: true } });
    if (result.modifiedCount) {
      revalidatePath("/gebrauchtwagen");
      revalidatePath("/gebrauchtwagen/[id]", "page");
    }
  } catch (error) {
    console.error("Kaufvertrag: website car not marked sold:", error?.message);
  }
}

/* ─────────────────────────────────────────────
   POST → Create Kaufvertrag
───────────────────────────────────────────── */
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    /* 1️⃣ + 2️⃣ Next invoice number (last valid contract, or the number set by hand) */
    const invoiceNumber = await nextNumber(data.issuer || "karim");

    /* 3️⃣ Ensure invoice number is unique */
    const exists = await Kaufvertrag.findOne({ invoiceNumber });
    if (exists) {
      return NextResponse.json(
        { error: "Diese Rechnungsnummer existiert bereits." },
        { status: 409 }
      );
    }

    /* 4️⃣ Create Kaufvertrag */
    const user = await staffUser();
    const contract = await Kaufvertrag.create({
      ...data,
      issuer: data.issuer || "karim",
      invoiceNumber,
      paid: data.paid === true,
      createdBy: user?.name || "",
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

    /* 7️⃣ Website: the car sold with this contract shows "Verkauft".
          Found by FIN (and by the car picked in the list, if any). It is
          removed from the website when its mobile.de ad is deleted. */
    await markWebsiteCarSold({ vin, carId: data.carId });

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
        "buyerName buyerStreet buyerCity issuer carType vin mileage invoiceNumber invoiceDate total starred ignored archived originalInvoiceNumber"
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
