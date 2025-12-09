// app/api/carschein/route.js
import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import cloudinary from "@/app/utils/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Small helper for JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------
// POST /api/carschein
// Create new CarSchein
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
      carName,
      finNumber,
      owner,
      notes,
      imageUrl,
      publicId,
      keyNumber,
      keyCount,
      keyColor,
      keySold,
      keyNote,
      fuelNeeded,
      dashboardHidden,
      completedTasks,
      rotKennzeichen,
    } = body;

    // FIN uniqueness check (only if provided)
    if (finNumber) {
      const existing = await CarSchein.findOne({ finNumber }).lean();
      if (existing) {
        return jsonResponse(
          { error: "Diese FIN-Nummer existiert bereits" },
          409
        );
      }
    }

    // Normalize notes → array of strings
    const notesArr = Array.isArray(notes)
      ? notes
      : (notes || "")
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean);

    // Normalize completedTasks → array of strings
    const completedArr = Array.isArray(completedTasks)
      ? completedTasks
      : (completedTasks || []).map((t) => String(t).trim()).filter(Boolean);

    const doc = await CarSchein.create({
      carName,
      finNumber: finNumber || "",
      owner: owner || "",
      notes: notesArr,
      completedTasks: completedArr,
      imageUrl: imageUrl || null,
      publicId: publicId || null,
      keyNumber: keyNumber ?? "",
      keyCount:
        typeof keyCount === "number" && !Number.isNaN(keyCount) ? keyCount : 2,
      keyColor: keyColor || "#000000",
      keySold: !!keySold,
      keyNote: keyNote || "",
      fuelNeeded: !!fuelNeeded,
      rotKennzeichen: !!rotKennzeichen,
      dashboardHidden: !!dashboardHidden,
    });

    return jsonResponse(doc, 201);
  } catch (err) {
    console.error("POST /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// GET /api/carschein
// Paginated list
// -----------------------
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      CarSchein.countDocuments(),
      CarSchein.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return jsonResponse({ docs, page, totalPages, total }, 200);
  } catch (err) {
    console.error("GET /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// DELETE /api/carschein?id=...
// Delete one document
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

    const doc = await CarSchein.findById(id);
    if (!doc) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    // NOTE: Image deletion is handled by /api/delete-image or explicitly
    await CarSchein.findByIdAndDelete(id);

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("DELETE /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// PUT /api/carschein
// Update full document
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
      carName,
      finNumber,
      owner,
      notes,
      completedTasks,
      imageUrl,
      publicId,
      oldPublicId,
      keyNumber,
      keyCount,
      keyColor,
      keySold,
      keyNote,
      fuelNeeded,
      dashboardHidden,
      rotKennzeichen,
    } = body;

    if (!id) {
      return jsonResponse({ error: "Missing data" }, 400);
    }

    // Delete old Cloudinary image if changed
    if (oldPublicId && oldPublicId !== publicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    const updateFields = {};

    if (typeof carName !== "undefined") updateFields.carName = carName;
    if (typeof finNumber !== "undefined")
      updateFields.finNumber = finNumber || "";
    if (typeof owner !== "undefined") updateFields.owner = owner;

    if (typeof notes !== "undefined") {
      updateFields.notes = Array.isArray(notes)
        ? notes
        : (notes || "")
            .split("\n")
            .map((n) => n.trim())
            .filter(Boolean);
    }

    if (typeof completedTasks !== "undefined") {
      updateFields.completedTasks = Array.isArray(completedTasks)
        ? completedTasks
        : (completedTasks || []).map((t) => String(t).trim()).filter(Boolean);
    }

    if (typeof imageUrl !== "undefined") {
      updateFields.imageUrl = imageUrl || null;
    }
    if (typeof publicId !== "undefined") {
      updateFields.publicId = publicId || null;
    }

    if (typeof keyNumber !== "undefined") updateFields.keyNumber = keyNumber;
    if (typeof keyCount !== "undefined") updateFields.keyCount = keyCount;
    if (typeof keyColor !== "undefined") updateFields.keyColor = keyColor;
    if (typeof keySold !== "undefined") updateFields.keySold = !!keySold;
    if (typeof keyNote !== "undefined") updateFields.keyNote = keyNote;

    if (typeof fuelNeeded !== "undefined") {
      updateFields.fuelNeeded = !!fuelNeeded;
    }

    if (typeof dashboardHidden !== "undefined") {
      updateFields.dashboardHidden = !!dashboardHidden;
    }

    if (typeof rotKennzeichen !== "undefined") {
      updateFields.rotKennzeichen = !!rotKennzeichen;
    }

    const updated = await CarSchein.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).lean();

    if (!updated) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("PUT /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// PATCH /api/carschein/tasks
// Update only completedTasks
// -----------------------
export async function PATCH(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { id, completedTasks } = body;

    if (!id || !Array.isArray(completedTasks)) {
      return jsonResponse({ error: "Missing id or completedTasks array" }, 400);
    }

    const updated = await CarSchein.findByIdAndUpdate(
      id,
      { completedTasks },
      { new: true }
    ).lean();

    if (!updated) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("PATCH /api/carschein/tasks error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}
