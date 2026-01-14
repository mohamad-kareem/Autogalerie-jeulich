// app/api/carschein/route.js
import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import cloudinary from "@/app/utils/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// -----------------------
// Helper: JSON response
// -----------------------
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// -----------------------
// Helpers
// -----------------------
function normalizeNotes(notes) {
  if (Array.isArray(notes))
    return notes
      .filter(Boolean)
      .map((n) => String(n).trim())
      .filter(Boolean);
  return String(notes || "")
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
}

function normalizeCompletedTasks(completedTasks) {
  return Array.isArray(completedTasks)
    ? completedTasks
        .filter(Boolean)
        .map((n) => String(n).trim())
        .filter(Boolean)
    : [];
}

function normalizeReclamations(reclamations) {
  if (!Array.isArray(reclamations)) return [];
  return reclamations.map((r) => ({
    date: r?.date ? new Date(r.date) : null,
    where: String(r?.where || "").trim(),
    what: String(r?.what || "").trim(),
    cost:
      r?.cost === null || r?.cost === undefined || r?.cost === ""
        ? null
        : Number(r.cost),
  }));
}

// optional: if you want a strict 1-year warranty (365 days)
// remaining days are calculated on frontend; backend just stores soldAt.
function ensureValidDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// -----------------------
// POST /api/carschein
// Create new CarSchein
// -----------------------
export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

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

      // ✅ NEW
      soldAt,
      reclamations,
    } = body;

    // FIN uniqueness check (only if provided)
    const fin = String(finNumber || "").trim();
    if (fin) {
      const existing = await CarSchein.findOne({ finNumber: fin }).lean();
      if (existing) {
        return jsonResponse(
          { error: "Diese FIN-Nummer existiert bereits" },
          409
        );
      }
    }

    const notesArr = normalizeNotes(notes);
    const completedArr = normalizeCompletedTasks(completedTasks);
    const reclamationsArr = normalizeReclamations(reclamations);

    const soldBool = !!keySold;

    // soldAt logic:
    // - if provided, use it
    // - else if keySold true, set now
    // - else null
    const soldAtValue =
      ensureValidDateOrNull(soldAt) || (soldBool ? new Date() : null);

    const doc = await CarSchein.create({
      carName: String(carName || "").trim(),
      finNumber: fin || "",
      owner: String(owner || "").trim(),
      notes: notesArr,
      completedTasks: completedArr,

      imageUrl: imageUrl || null,
      publicId: publicId || null,

      keyNumber: keyNumber ?? "",
      keyCount:
        typeof keyCount === "number" && !Number.isNaN(keyCount) ? keyCount : 2,
      keyColor: keyColor || "#000000",
      keySold: soldBool,
      keyNote: keyNote || "",

      fuelNeeded: !!fuelNeeded,
      rotKennzeichen: !!rotKennzeichen,
      dashboardHidden: !!dashboardHidden,

      // ✅ NEW
      soldAt: soldAtValue,
      reclamations: reclamationsArr,
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
// -----------------------
export async function DELETE(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonResponse({ error: "Missing id" }, 400);

    const doc = await CarSchein.findById(id);
    if (!doc) return jsonResponse({ error: "Not found" }, 404);

    await CarSchein.findByIdAndDelete(id);
    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error("DELETE /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// PUT /api/carschein
// Update document
// -----------------------
export async function PUT(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

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

      // ✅ NEW
      soldAt,
      reclamations,
    } = body;

    if (!id) return jsonResponse({ error: "Missing id" }, 400);

    // Load current doc (needed to detect transitions like keySold false -> true)
    const current = await CarSchein.findById(id).lean();
    if (!current) return jsonResponse({ error: "Not found" }, 404);

    // Delete old Cloudinary image if changed
    if (oldPublicId && oldPublicId !== publicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    const updateFields = {};

    // Basic fields
    if (carName !== undefined)
      updateFields.carName = String(carName || "").trim();
    if (finNumber !== undefined)
      updateFields.finNumber = String(finNumber || "").trim();
    if (owner !== undefined) updateFields.owner = String(owner || "").trim();

    if (notes !== undefined) updateFields.notes = normalizeNotes(notes);
    if (completedTasks !== undefined)
      updateFields.completedTasks = normalizeCompletedTasks(completedTasks);

    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl || null;
    if (publicId !== undefined) updateFields.publicId = publicId || null;

    if (keyNumber !== undefined) updateFields.keyNumber = keyNumber;
    if (keyCount !== undefined) updateFields.keyCount = keyCount;
    if (keyColor !== undefined) updateFields.keyColor = keyColor;
    if (keyNote !== undefined) updateFields.keyNote = keyNote;

    // Flags
    if (fuelNeeded !== undefined) updateFields.fuelNeeded = !!fuelNeeded;
    if (rotKennzeichen !== undefined)
      updateFields.rotKennzeichen = !!rotKennzeichen;

    // ✅ keySold + soldAt logic
    if (keySold !== undefined) {
      const newKeySold = !!keySold;
      updateFields.keySold = newKeySold;

      const wasSold = !!current.keySold;

      // If it becomes sold now, set soldAt if not provided
      if (!wasSold && newKeySold) {
        updateFields.soldAt = ensureValidDateOrNull(soldAt) || new Date();
      }

      // If it becomes NOT sold, clear soldAt (you can remove this if you prefer to keep history)
      if (wasSold && !newKeySold) {
        updateFields.soldAt = null;
      }
    }

    // Allow explicit soldAt set (manual override)
    if (soldAt !== undefined) {
      updateFields.soldAt = ensureValidDateOrNull(soldAt);
    }

    // ✅ Reclamations
    if (reclamations !== undefined) {
      updateFields.reclamations = normalizeReclamations(reclamations);
    }

    // ✅ IMPORTANT PART: dashboard close → release key
    if (dashboardHidden !== undefined) {
      updateFields.dashboardHidden = !!dashboardHidden;

      if (dashboardHidden === true) {
        updateFields.keyNumber = "";
        updateFields.keyColor = "";
        updateFields.keyCount = 0;
        updateFields.keyNote = "";
      }
    }

    const updated = await CarSchein.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).lean();

    if (!updated) return jsonResponse({ error: "Not found" }, 404);

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("PUT /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// -----------------------
// PATCH /api/carschein
// Update only completedTasks
// -----------------------
export async function PATCH(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { id, completedTasks } = body;

    if (!id || !Array.isArray(completedTasks)) {
      return jsonResponse({ error: "Missing id or completedTasks array" }, 400);
    }

    const updated = await CarSchein.findByIdAndUpdate(
      id,
      { completedTasks: normalizeCompletedTasks(completedTasks) },
      { new: true }
    ).lean();

    if (!updated) return jsonResponse({ error: "Not found" }, 404);

    return jsonResponse(updated, 200);
  } catch (err) {
    console.error("PATCH /api/carschein error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}
