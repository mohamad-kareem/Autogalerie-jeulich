import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Kaufvertrag from "@/models/Kaufvertrag";
import { makeStarredNumber } from "@/app/utils/invoiceHelpers";
import { toContract, fromForm } from "@/lib/kaufvertrag";
import { DAY_RE, berlinDay } from "@/lib/sales";
import {
  adminUser,
  errorResponse,
  isId,
  makeVehicleAvailable,
  scheinOf,
  markVehicleSold,
  SaleError,
  staffUser,
} from "@/lib/kaufvertragServer";

// 🔎 Get a single contract
export async function GET(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const contract = await Kaufvertrag.findById(id).lean();

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Händlerportal contract page: stored contract + portal shape + vehicle state
    if (new URL(request.url).searchParams.get("view") === "1") {
      const schein = await scheinOf(contract.vin);
      return NextResponse.json({
        doc: contract,
        contract: toContract(contract),
        vehicle: schein
          ? { fin: schein.finNumber, sold: schein.stage === "SOLD" || Boolean(schein.keySold), soldAt: schein.soldAt || null }
          : null,
      });
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

// 🗑️ Delete contract  (?available=1 → the car is available again)
export async function DELETE(request, context) {
  try {
    await connectDB();
    const { params } = context;
    const { id } = await params;
    const deleted = await Kaufvertrag.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Contract not found for deletion" },
        { status: 404 }
      );
    }

    if (new URL(request.url).searchParams.get("available") === "1" && deleted.vin) {
      await makeVehicleAvailable(deleted.vin);
    }

    return NextResponse.json(
      { message: "Deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────
   PATCH → Händlerportal actions
   { action: "star" | "paid" | "cancel" | "uncancel" | "archive" | "stamp" | "correct", … }
───────────────────────────────────────────── */
export async function PATCH(request, context) {
  const user = await staffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await context.params;
  if (!isId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");
  const adminOnly = ["cancel", "uncancel", "archive"];
  if (adminOnly.includes(action) && !(await adminUser())) {
    return Response.json({ error: "Nur für Administratoren." }, { status: 403 });
  }

  try {
    await connectDB();
    const contract = await Kaufvertrag.findById(id);
    if (!contract) throw new SaleError("Vertrag nicht gefunden.", 404);
    const log = (what) => {
      contract.log = [...(contract.log || []), { at: new Date(), by: user.name, action: what }];
    };

    if (action === "star") {
      // same marking as before: the number gets an "A"
      if (!contract.starred) {
        contract.originalInvoiceNumber = contract.invoiceNumber;
        contract.invoiceNumber = makeStarredNumber(contract.invoiceNumber, contract.issuer);
        contract.starred = true;
      } else {
        contract.invoiceNumber = contract.originalInvoiceNumber || contract.invoiceNumber;
        contract.starred = false;
        contract.originalInvoiceNumber = null;
      }
      await contract.save();
      return Response.json({ starred: contract.starred, contract: toContract(contract.toObject()) });
    }

    if (action === "paid") {
      const paid = Boolean(body.paid);
      contract.paid = paid;
      contract.paidAt = paid ? (DAY_RE.test(String(body.paidAt || "")) ? body.paidAt : berlinDay()) : "";
      log(paid ? "paid" : "unpaid");
      await contract.save();
      return Response.json({ contract: toContract(contract.toObject()) });
    }

    if (action === "archive") {
      contract.archived = Boolean(body.archived);
      contract.archivedAt = contract.archived ? new Date() : null;
      contract.archivedBy = contract.archived ? user.name : "";
      log(contract.archived ? "archive" : "unarchive");
      await contract.save();
      return Response.json({ contract: toContract(contract.toObject()) });
    }

    if (action === "cancel") {
      if (contract.ignored) throw new SaleError("Der Vertrag ist bereits storniert.", 409);
      // same as "Ignorieren" before: the number gets an "X" and is free again
      contract.originalInvoiceNumberX = contract.invoiceNumber;
      if (!String(contract.invoiceNumber || "").endsWith("X")) contract.invoiceNumber = `${contract.invoiceNumber || ""}X`;
      contract.ignored = true;
      contract.cancelledAt = new Date();
      contract.cancelledBy = user.name;
      contract.cancelReason = String(body.reason || "").trim().slice(0, 300);
      log("cancel");
      await contract.save();
      if (body.makeAvailable && contract.vin) await makeVehicleAvailable(contract.vin);
      return Response.json({ contract: toContract(contract.toObject()) });
    }

    if (action === "uncancel") {
      if (!contract.ignored) throw new SaleError("Der Vertrag ist nicht storniert.", 409);
      const wanted = contract.originalInvoiceNumberX || String(contract.invoiceNumber || "").replace(/X$/, "");
      const taken = await Kaufvertrag.exists({ _id: { $ne: contract._id }, invoiceNumber: wanted, ignored: { $ne: true } });
      if (taken) throw new SaleError(`Die Nummer ${wanted} ist inzwischen vergeben.`, 409);
      contract.invoiceNumber = wanted;
      contract.ignored = false;
      contract.originalInvoiceNumberX = null;
      contract.cancelledAt = null;
      contract.cancelledBy = "";
      contract.cancelReason = "";
      log("uncancel");
      await contract.save();
      if (contract.vin) await markVehicleSold(contract.vin, contract.invoiceDate);
      return Response.json({ contract: toContract(contract.toObject()) });
    }

    if (action === "stamp") {
      contract.stamp = Boolean(body.stamp);
      await contract.save();
      return Response.json({ contract: toContract(contract.toObject()) });
    }

    if (action === "correct") {
      const data = fromForm(body);
      if (!data.buyerName || !data.carType || !(data.total > 0)) {
        throw new SaleError("Bitte die markierten Felder ausfüllen.", 400);
      }
      Object.assign(contract, data);
      log("correct");
      await contract.save();
      return Response.json({ contract: toContract(contract.toObject()) });
    }

    throw new SaleError("Unbekannte Aktion.", 400);
  } catch (err) {
    return errorResponse(err);
  }
}
