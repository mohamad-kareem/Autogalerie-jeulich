import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { makeStarredNumber } from "@/app/utils/invoiceHelpers";

// 🔎 Get a single contract
export async function GET(request, context) {
  try {
    await connectDB();
    const { params } = context;
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

// ✏️ Update contract (toggle star/ignore/archive or normal update)
export async function PUT(request, context) {
  try {
    await connectDB();
    const { params } = context;
    const body = await request.json();
    const contract = await Kaufvertrag.findById(params.id);

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // ⭐ Toggle star
    if (body.toggleStar) {
      if (!contract.starred) {
        contract.originalInvoiceNumber = contract.invoiceNumber;
        contract.invoiceNumber = makeStarredNumber(
          contract.invoiceNumber,
          contract.issuer
        );
        contract.starred = true;
      } else {
        contract.invoiceNumber =
          contract.originalInvoiceNumber || contract.invoiceNumber;
        contract.starred = false;
        contract.originalInvoiceNumber = null;
      }
      await contract.save();
      return NextResponse.json(contract);
    }

    // 🚫 Toggle ignore
    if (body.toggleIgnore) {
      if (!contract.ignored) {
        contract.originalInvoiceNumberX = contract.invoiceNumber;
        if (!contract.invoiceNumber.endsWith("X")) {
          contract.invoiceNumber = contract.invoiceNumber + "X";
        }
        contract.ignored = true;
      } else {
        contract.invoiceNumber =
          contract.originalInvoiceNumberX ||
          contract.invoiceNumber.replace(/X$/, "");
        contract.ignored = false;
        contract.originalInvoiceNumberX = null;
      }
      await contract.save();
      return NextResponse.json(contract);
    }

    // 📦 Toggle archive/unarchive
    if (typeof body.archived !== "undefined") {
      contract.archived = body.archived;
      await contract.save();
      return NextResponse.json(contract);
    }

    // 🔄 Default update (any other fields)
    const updated = await Kaufvertrag.findByIdAndUpdate(params.id, body, {
      new: true,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🗑️ Delete contract
export async function DELETE(request, context) {
  try {
    await connectDB();
    const { params } = context;
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
