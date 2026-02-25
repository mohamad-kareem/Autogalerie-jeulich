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

function idToString(id) {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && id.$oid) return String(id.$oid);
  return String(id);
}

function normalizeDoc(doc) {
  if (!doc) return doc;
  return { ...doc, _id: idToString(doc._id) };
}

export async function GET() {
  try {
    await connectDB();
    const docs = await CarLocation.find()
      .sort({ startDateTime: -1, createdAt: -1 })
      .lean();
    return jsonResponse(
      { docs: Array.isArray(docs) ? docs.map(normalizeDoc) : [] },
      200,
    );
  } catch (err) {
    console.error("GET /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();

    const doc = await CarLocation.create({
      startDateTime: body.startDateTime ? new Date(body.startDateTime) : null,
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : null,
      vehicleType: body.vehicleType || "",
      manufacturer: body.manufacturer || "",
      vehicleId: body.vehicleId || "",
      routeSummary: body.routeSummary || "",
      driverInfo: body.driverInfo || "",
    });

    const obj = doc?.toObject ? doc.toObject() : doc;
    return jsonResponse(normalizeDoc(obj), 201);
  } catch (err) {
    console.error("POST /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();
    if (!body?.id) return jsonResponse({ error: "Missing id" }, 400);

    const updateFields = {
      startDateTime: body.startDateTime ? new Date(body.startDateTime) : null,
      endDateTime: body.endDateTime ? new Date(body.endDateTime) : null,
      vehicleType: body.vehicleType || "",
      manufacturer: body.manufacturer || "",
      vehicleId: body.vehicleId || "",
      routeSummary: body.routeSummary || "",
      driverInfo: body.driverInfo || "",
    };

    const updated = await CarLocation.findByIdAndUpdate(body.id, updateFields, {
      new: true,
    }).lean();
    if (!updated) return jsonResponse({ error: "Not found" }, 404);

    return jsonResponse(normalizeDoc(updated), 200);
  } catch (err) {
    console.error("PUT /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonResponse({ error: "Missing id" }, 400);

    const doc = await CarLocation.findById(id).select("_id").lean();
    if (!doc) return jsonResponse({ error: "Not found" }, 404);

    await CarLocation.findByIdAndDelete(id);
    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("DELETE /api/car-locations error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}
