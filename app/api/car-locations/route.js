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

  return {
    ...doc,
    _id: idToString(doc._id),
    plateNumber: doc.plateNumber || "DN-06919",
    marked: !!doc.marked,
    markNote: doc.markNote || "",
    rotbuchNumber: doc.rotbuchNumber ?? null,
  };
}

/** Rotbuch numbers are 1–20; anything else is stored as "none". */
function toRotbuchNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : null;
}

function toDateOrNull(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizePlateNumber(value) {
  const plate = String(value || "")
    .trim()
    .toUpperCase();

  if (plate === "DN-06921") {
    return "DN-06921";
  }

  return "DN-06919";
}

export async function GET() {
  try {
    await connectDB();

    const docs = await CarLocation.find()
      .sort({
        startDateTime: 1,
        createdAt: 1,
      })
      .lean();

    return jsonResponse(
      {
        docs: Array.isArray(docs) ? docs.map(normalizeDoc) : [],
      },
      200,
    );
  } catch (err) {
    console.error("GET /api/car-locations error:", err);

    return jsonResponse(
      {
        error: err.message,
      },
      500,
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const body = await req.json();

    const marked = !!body.marked;

    const doc = await CarLocation.create({
      plateNumber: normalizePlateNumber(body.plateNumber),

      startDateTime: toDateOrNull(body.startDateTime),
      endDateTime: toDateOrNull(body.endDateTime),

      vehicleType: body.vehicleType || "",
      manufacturer: body.manufacturer || "",
      vehicleId: body.vehicleId || "",
      routeSummary: body.routeSummary || "",
      driverInfo: body.driverInfo || "",
      rotbuchNumber: toRotbuchNumber(body.rotbuchNumber),

      marked,
      markNote: marked ? String(body.markNote || "").trim() : "",
    });

    const obj = doc?.toObject ? doc.toObject() : doc;

    return jsonResponse(normalizeDoc(obj), 201);
  } catch (err) {
    console.error("POST /api/car-locations error:", err);

    return jsonResponse(
      {
        error: err.message,
      },
      500,
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const body = await req.json();

    if (!body?.id) {
      return jsonResponse(
        {
          error: "Missing id",
        },
        400,
      );
    }

    const updateFields = {};

    if (body.plateNumber !== undefined) {
      updateFields.plateNumber = normalizePlateNumber(body.plateNumber);
    }

    if (body.startDateTime !== undefined) {
      updateFields.startDateTime = toDateOrNull(body.startDateTime);
    }

    if (body.endDateTime !== undefined) {
      updateFields.endDateTime = toDateOrNull(body.endDateTime);
    }

    if (body.vehicleType !== undefined) {
      updateFields.vehicleType = body.vehicleType || "";
    }

    if (body.manufacturer !== undefined) {
      updateFields.manufacturer = body.manufacturer || "";
    }

    if (body.vehicleId !== undefined) {
      updateFields.vehicleId = body.vehicleId || "";
    }

    if (body.routeSummary !== undefined) {
      updateFields.routeSummary = body.routeSummary || "";
    }

    if (body.driverInfo !== undefined) {
      updateFields.driverInfo = body.driverInfo || "";
    }

    if (body.rotbuchNumber !== undefined) {
      updateFields.rotbuchNumber = toRotbuchNumber(body.rotbuchNumber);
    }

    if (body.marked !== undefined) {
      updateFields.marked = !!body.marked;

      if (body.marked === false) {
        updateFields.markNote = "";
      }
    }

    if (body.markNote !== undefined) {
      updateFields.markNote = String(body.markNote || "").trim();
    }

    if (body.marked === false) {
      updateFields.markNote = "";
    }

    const updated = await CarLocation.findByIdAndUpdate(body.id, updateFields, {
      new: true,
    }).lean();

    if (!updated) {
      return jsonResponse(
        {
          error: "Not found",
        },
        404,
      );
    }

    return jsonResponse(normalizeDoc(updated), 200);
  } catch (err) {
    console.error("PUT /api/car-locations error:", err);

    return jsonResponse(
      {
        error: err.message,
      },
      500,
    );
  }
}

/**
 * PATCH { updates: [{ id, rotbuchNumber }] }
 * Stores the Rotbuch-Nr. on many trips at once (one-time fill for trips
 * saved before trips kept their own number).
 */
export async function PATCH(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => null);
    const updates = Array.isArray(body?.updates) ? body.updates.slice(0, 5000) : [];

    const ops = updates
      .filter((u) => u?.id && /^[a-f0-9]{24}$/i.test(String(u.id)))
      .map((u) => ({
        updateOne: {
          // only fills trips that have no number yet – never overwrites
          filter: { _id: String(u.id), rotbuchNumber: null },
          update: { $set: { rotbuchNumber: toRotbuchNumber(u.rotbuchNumber) } },
        },
      }));

    if (!ops.length) {
      return jsonResponse({ updated: 0 }, 200);
    }

    const result = await CarLocation.bulkWrite(ops, { ordered: false });

    return jsonResponse({ updated: result?.modifiedCount ?? 0 }, 200);
  } catch (err) {
    console.error("PATCH /api/car-locations error:", err);

    return jsonResponse({ error: err.message }, 500);
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonResponse(
        {
          error: "Missing id",
        },
        400,
      );
    }

    const doc = await CarLocation.findById(id).select("_id").lean();

    if (!doc) {
      return jsonResponse(
        {
          error: "Not found",
        },
        404,
      );
    }

    await CarLocation.findByIdAndDelete(id);

    return jsonResponse(
      {
        success: true,
      },
      200,
    );
  } catch (err) {
    console.error("DELETE /api/car-locations error:", err);

    return jsonResponse(
      {
        error: err.message,
      },
      500,
    );
  }
}
