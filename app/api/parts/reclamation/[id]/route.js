import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import PartReclamation from "@/models/PartReclamation";

const OWNERS = ["Karim", "Alawie"];

export async function GET(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const part = await PartReclamation.findById(params.id).lean();
    if (!part) {
      return new Response(JSON.stringify({ error: "Part not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true, data: part }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();

    const update = {
      partName: body.partName,
      vehicleId: body.vehicleId,
      finNumber: body.finNumber,
      quantity: body.quantity,
      price: body.price,
      currency: body.currency,
      urgency: body.urgency,
      status: body.status,
      supplier: body.supplier,
      notes: body.notes,
      returnToSupplier: body.returnToSupplier,
      returnReason: body.returnReason,
      returnDate: body.returnDate,
      updatedBy: session.user.id,
    };

    if (body.owner) {
      if (!OWNERS.includes(body.owner)) {
        return new Response(JSON.stringify({ error: "Invalid owner" }), {
          status: 400,
        });
      }
      update.owner = body.owner;
    }

    // Strip undefined
    Object.keys(update).forEach(
      (k) => update[k] === undefined && delete update[k]
    );

    const updatedPart = await PartReclamation.findByIdAndUpdate(
      params.id,
      update,
      {
        new: true,
      }
    );

    if (!updatedPart) {
      return new Response(JSON.stringify({ error: "Part not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true, data: updatedPart }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const deletedPart = await PartReclamation.findByIdAndDelete(params.id);
    if (!deletedPart) {
      return new Response(JSON.stringify({ error: "Part not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
