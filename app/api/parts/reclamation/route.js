import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import PartReclamation from "@/models/PartReclamation";

// Allowed owners (central place)
const OWNERS = ["Karim", "Alawie"];

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "all";
    const owner = (searchParams.get("owner") || "all").trim(); // 'all' | 'Karim' | 'Alawie'
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const query = {};

    if (search) {
      query.$or = [
        { partName: { $regex: search, $options: "i" } },
        { vehicleId: { $regex: search, $options: "i" } },
        { finNumber: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
        { owner: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all" && status) query.status = status;
    if (owner !== "all" && OWNERS.includes(owner)) query.owner = owner;

    const total = await PartReclamation.countDocuments(query);
    const parts = await PartReclamation.find(query)
      .sort({ urgency: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return new Response(
      JSON.stringify({
        success: true,
        data: parts,
        total,
        page,
        pages: Math.ceil(total / limit),
        owners: OWNERS, // for the UI dropdown
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();

    if (!OWNERS.includes(body.owner)) {
      return new Response(JSON.stringify({ error: "Invalid owner" }), {
        status: 400,
      });
    }

    const partData = {
      partName: body.partName,
      vehicleId: body.vehicleId,
      finNumber: body.finNumber,
      quantity: body.quantity ?? 1,
      price: body.price ?? 0,
      currency: body.currency || "EUR",
      urgency: body.urgency || "medium",
      status: body.status || "pending",
      supplier: body.supplier || "",
      notes: body.notes || "",
      returnToSupplier: !!body.returnToSupplier,
      owner: body.owner, // "Karim" | "Alawie"
      createdBy: session.user.id,
      updatedBy: session.user.id,
      assignedTo: session.user.id,
    };

    const newPart = await PartReclamation.create(partData);
    return new Response(JSON.stringify({ success: true, data: newPart }), {
      status: 201,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
