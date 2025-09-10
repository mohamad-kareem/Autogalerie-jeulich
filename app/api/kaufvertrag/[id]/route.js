import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { makeStarredNumber } from "@/app/utils/invoiceHelpers"; // ⭐ missing import

export async function GET(request, { params }) {
  try {
    await connectDB();
    const contract = await Kaufvertrag.findById(params.id).lean();

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    const contract = await Kaufvertrag.findById(params.id);

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // ⭐ Toggle star logic
    if (body.toggleStar) {
      if (!contract.starred) {
        // Store original and apply starred format
        contract.originalInvoiceNumber = contract.invoiceNumber;
        contract.invoiceNumber = makeStarredNumber(
          contract.invoiceNumber,
          contract.issuer
        );
        contract.starred = true;
      } else {
        // Restore original
        contract.invoiceNumber =
          contract.originalInvoiceNumber || contract.invoiceNumber;
        contract.starred = false;
        contract.originalInvoiceNumber = null;
      }
      await contract.save();
      return NextResponse.json(contract);
    }

    // Default update
    const updated = await Kaufvertrag.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const deleted = await Kaufvertrag.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Contract not found for deletion" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
