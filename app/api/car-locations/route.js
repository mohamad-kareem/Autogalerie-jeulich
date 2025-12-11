// app/api/car-locations/route.js
import { connectDB } from "@/lib/mongodb";
import CarLocation from "@/models/CarLocation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------
// GET /api/car-locations
// -----------------------
export async function GET() {
  try {
    await connectDB();

    const docs = await CarLocation.find()
      .sort({ startDateTime: -1, createdAt: -1 })
      .lean();

    return jsonResponse({ docs }, 200);
  } catch (err) {
    console.error("GET /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// POST /api/car-locations
// -----------------------
export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const {
      startDateTime,
      endDateTime,
      vehicleType,
      manufacturer,
      vehicleId,
      routeSummary,
      driverInfo,
    } = body;

    const startDate = startDateTime ? new Date(startDateTime) : null;
    const endDate = endDateTime ? new Date(endDateTime) : null;

    const doc = await CarLocation.create({
      startDateTime: startDate,
      endDateTime: endDate,
      vehicleType: vehicleType || "",
      manufacturer: manufacturer || "",
      vehicleId: vehicleId || "",
      routeSummary: routeSummary || "",
      driverInfo: driverInfo || "",
    });

    return jsonResponse(doc, 201);
  } catch (err) {
    console.error("POST /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// PUT /api/car-locations
// -----------------------
export async function PUT(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const {
      id,
      startDateTime,
      endDateTime,
      vehicleType,
      manufacturer,
      vehicleId,
      routeSummary,
      driverInfo,
    } = body;

    if (!id) {
      return jsonResponse({ error: "Missing id" }, 400);
    }

    const updateFields = {};

    if (typeof startDateTime !== "undefined") {
      updateFields.startDateTime = startDateTime
        ? new Date(startDateTime)
        : null;
    }
    if (typeof endDateTime !== "undefined") {
      updateFields.endDateTime = endDateTime ? new Date(endDateTime) : null;
    }
    if (typeof vehicleType !== "undefined") {
      updateFields.vehicleType = vehicleType || "";
    }
    if (typeof manufacturer !== "undefined") {
      updateFields.manufacturer = manufacturer || "";
    }
    if (typeof vehicleId !== "undefined") {
      updateFields.vehicleId = vehicleId || "";
    }
    if (typeof routeSummary !== "undefined") {
      updateFields.routeSummary = routeSummary || "";
    }
    if (typeof driverInfo !== "undefined") {
      updateFields.driverInfo = driverInfo || "";
    }

    const updated = await CarLocation.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).lean();

    if (!updated) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("PUT /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// DELETE /api/car-locations?id=...
// -----------------------
export async function DELETE(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonResponse({ error: "Missing id" }, 400);
    }

    const doc = await CarLocation.findById(id);
    if (!doc) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    await CarLocation.findByIdAndDelete(id);

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("DELETE /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}
