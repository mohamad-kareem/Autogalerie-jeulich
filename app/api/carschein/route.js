// app/api/carschein/route.js
import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import ContactCustomer from "@/models/ContactCustomer";
import cloudinary from "@/app/utils/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/* -----------------------
   Response helper
------------------------ */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* -----------------------
   Auth helper
------------------------ */
async function requireAuth() {
  const session = await getServerSession(authOptions);
  return session || null;
}

/* -----------------------
   Normalizers
------------------------ */
const STAGES = ["WERKSTATT", "AUFBEREITUNG", "PLATZ", "TUEV", "SOLD"];

function toStr(v) {
  return String(v ?? "").trim();
}
function toBool(v) {
  return !!v;
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function ensureValidDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
function normalizeStage(stage, fallback = "WERKSTATT") {
  const s = toStr(stage).toUpperCase();
  return STAGES.includes(s) ? s : fallback;
}
function normalizeNotes(notes) {
  if (Array.isArray(notes)) {
    return notes.map(toStr).filter(Boolean);
  }
  return toStr(notes).split("\n").map(toStr).filter(Boolean);
}
function normalizeCompletedTasks(completedTasks) {
  if (!Array.isArray(completedTasks)) return [];
  return completedTasks.map(toStr).filter(Boolean);
}
function normalizeReclamations(reclamations) {
  if (!Array.isArray(reclamations)) return [];
  return reclamations.map((r) => ({
    date: r?.date ? ensureValidDateOrNull(r.date) : null,
    where: toStr(r?.where),
    what: toStr(r?.what),
    cost:
      r?.cost === null || r?.cost === undefined || r?.cost === ""
        ? null
        : toNum(r.cost),
  }));
}
function normalizeStageMeta(meta) {
  const m = meta && typeof meta === "object" ? meta : {};
  return {
    werkstatt: {
      where: toStr(m?.werkstatt?.where),
      what: toStr(m?.werkstatt?.what),
    },
    platz: { note: toStr(m?.platz?.note) },
    tuev: { passed: toBool(m?.tuev?.passed), issue: toStr(m?.tuev?.issue) },
  };
}

/* -----------------------
   FIN uniqueness helper
------------------------ */
async function finExists(finNumber, excludeId = null) {
  const fin = toStr(finNumber);
  if (!fin) return false;

  const query = { finNumber: fin };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await CarSchein.findOne(query).select("_id").lean();
  return !!existing;
}

/* -----------------------
   SOLD Contact auto-link (FIN ONLY)
   ContactCustomer.vin must equal CarSchein.finNumber
------------------------ */
async function findSoldContactIdByFin(finNumber) {
  const fin = toStr(finNumber);
  if (!fin) return null;

  const byVin = await ContactCustomer.findOne({ vin: fin })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();

  return byVin?._id || null;
}

/* -----------------------
   Dead record checker (server)
   sold + removed (keyNumber empty/– and keyCount 0/null) OR dashboardHidden
------------------------ */
function isDeadSoldRecord(doc) {
  const sold = !!doc?.keySold || doc?.stage === "SOLD";
  if (!sold) return false;

  const keyNumber = toStr(doc?.keyNumber);
  const keyCount = toNum(doc?.keyCount);

  const looksRemoved =
    (!keyNumber || keyNumber === "–") && (keyCount === 0 || keyCount === null);
  const hidden = !!doc?.dashboardHidden;

  return looksRemoved || hidden;
}

/* =========================================================
   POST /api/carschein  (Create)
========================================================= */
export async function POST(req) {
  try {
    await connectDB();

    const session = await requireAuth();
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();

    const carName = toStr(body.carName);
    const finNumber = toStr(body.finNumber);
    const owner = toStr(body.owner);

    if (!carName) return json({ error: "carName is required" }, 400);

    if (finNumber) {
      const exists = await finExists(finNumber);
      if (exists)
        return json({ error: "Diese FIN-Nummer existiert bereits" }, 409);
    }

    const stage = normalizeStage(body.stage, "WERKSTATT");
    const stageMeta = normalizeStageMeta(body.stageMeta);

    const notes = normalizeNotes(body.notes);
    const completedTasks = normalizeCompletedTasks(body.completedTasks);
    const reclamations = normalizeReclamations(body.reclamations);

    let keySold = toBool(body.keySold);
    let soldAt = ensureValidDateOrNull(body.soldAt);

    if (stage === "SOLD") keySold = true;
    if (!soldAt && keySold) soldAt = new Date();

    const soldContactId =
      stage === "SOLD" ? await findSoldContactIdByFin(finNumber) : null;

    const doc = await CarSchein.create({
      carName,
      finNumber: finNumber || "",
      owner,

      imageUrl: body.imageUrl || null,
      publicId: body.publicId || null,

      notes,
      completedTasks,

      keyNumber: toStr(body.keyNumber),
      keyCount: Number.isFinite(Number(body.keyCount))
        ? Number(body.keyCount)
        : 2,
      keyColor: toStr(body.keyColor) || "#000000",
      keySold,
      keyNote: toStr(body.keyNote),

      fuelNeeded: toBool(body.fuelNeeded),
      rotKennzeichen: toBool(body.rotKennzeichen),
      dashboardHidden: toBool(body.dashboardHidden),

      soldAt,
      soldContactId,
      reclamations,

      stage,
      stageMeta,
    });

    const populated = await CarSchein.findById(doc._id)
      .populate("soldContactId", "customerName phone street postalCode city")
      .lean();

    return json(populated, 201);
  } catch (err) {
    console.error("POST /api/carschein error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}

/* =========================================================
   GET /api/carschein?page=1&limit=10&hideDead=1
========================================================= */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const hideDead = searchParams.get("hideDead") === "1";

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      CarSchein.countDocuments(),
      CarSchein.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("soldContactId", "customerName phone street postalCode city")
        .lean(),
    ]);

    // ✅ Server-side cleanup filter if hideDead=1
    const finalDocs = hideDead
      ? docs.filter((d) => !isDeadSoldRecord(d))
      : docs;

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return json({ docs: finalDocs, page, totalPages, total }, 200);
  } catch (err) {
    console.error("GET /api/carschein error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}

/* =========================================================
   DELETE /api/carschein?id=...  OR  /api/carschein?finNumber=...
   ✅ This is the piece you need for “cascade delete”
========================================================= */
export async function DELETE(req) {
  try {
    await connectDB();

    const session = await requireAuth();
    if (!session) return json({ error: "Unauthorized" }, 401);

    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const finNumber = toStr(searchParams.get("finNumber"));

    // ✅ delete by id (existing)
    if (id) {
      const doc = await CarSchein.findById(id).select("_id publicId").lean();
      if (!doc) return json({ error: "Not found" }, 404);

      // optional: cleanup cloudinary
      if (doc.publicId) {
        try {
          await cloudinary.uploader.destroy(doc.publicId);
        } catch (e) {
          console.warn("Cloudinary delete failed:", e?.message);
        }
      }

      await CarSchein.findByIdAndDelete(id);
      return json({ success: true, mode: "id" }, 200);
    }

    // ✅ delete by FIN (NEW)
    if (finNumber) {
      const docs = await CarSchein.find({ finNumber })
        .select("_id publicId")
        .lean();

      // optional cloudinary cleanup
      for (const d of docs) {
        if (!d.publicId) continue;
        try {
          await cloudinary.uploader.destroy(d.publicId);
        } catch (e) {
          console.warn("Cloudinary delete failed:", e?.message);
        }
      }

      const res = await CarSchein.deleteMany({ finNumber });
      return json(
        {
          success: true,
          mode: "finNumber",
          deletedCount: res?.deletedCount || 0,
        },
        200,
      );
    }

    return json({ error: "Missing id or finNumber" }, 400);
  } catch (err) {
    console.error("DELETE /api/carschein error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}

/* =========================================================
   PUT /api/carschein  (Update)
========================================================= */
export async function PUT(req) {
  try {
    await connectDB();

    const session = await requireAuth();
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const id = body.id;
    if (!id) return json({ error: "Missing id" }, 400);

    const current = await CarSchein.findById(id).lean();
    if (!current) return json({ error: "Not found" }, 404);

    // FIN uniqueness if changed
    if (body.finNumber !== undefined) {
      const nextFin = toStr(body.finNumber);
      const prevFin = toStr(current.finNumber);
      if (nextFin && nextFin !== prevFin) {
        const exists = await finExists(nextFin, id);
        if (exists)
          return json({ error: "Diese FIN-Nummer existiert bereits" }, 409);
      }
    }

    // Delete old Cloudinary image if changed
    if (body.oldPublicId && body.oldPublicId !== body.publicId) {
      try {
        await cloudinary.uploader.destroy(body.oldPublicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err?.message);
      }
    }

    const update = {};

    // Basic
    if (body.carName !== undefined) update.carName = toStr(body.carName);
    if (body.finNumber !== undefined) update.finNumber = toStr(body.finNumber);
    if (body.owner !== undefined) update.owner = toStr(body.owner);

    // Notes/tasks
    if (body.notes !== undefined) update.notes = normalizeNotes(body.notes);
    if (body.completedTasks !== undefined)
      update.completedTasks = normalizeCompletedTasks(body.completedTasks);

    // Image
    if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl || null;
    if (body.publicId !== undefined) update.publicId = body.publicId || null;

    // Key
    if (body.keyNumber !== undefined) update.keyNumber = toStr(body.keyNumber);
    if (body.keyCount !== undefined)
      update.keyCount = Number.isFinite(Number(body.keyCount))
        ? Number(body.keyCount)
        : 2;
    if (body.keyColor !== undefined)
      update.keyColor = toStr(body.keyColor) || "#000000";
    if (body.keyNote !== undefined) update.keyNote = toStr(body.keyNote);

    // Flags
    if (body.fuelNeeded !== undefined)
      update.fuelNeeded = toBool(body.fuelNeeded);
    if (body.rotKennzeichen !== undefined)
      update.rotKennzeichen = toBool(body.rotKennzeichen);

    // Stage + meta
    if (body.stage !== undefined)
      update.stage = normalizeStage(body.stage, current.stage || "WERKSTATT");
    if (body.stageMeta !== undefined)
      update.stageMeta = normalizeStageMeta(body.stageMeta);

    // Reclamations
    if (body.reclamations !== undefined)
      update.reclamations = normalizeReclamations(body.reclamations);

    // dashboardHidden behavior (clears key fields)
    if (body.dashboardHidden !== undefined) {
      const hide = toBool(body.dashboardHidden);
      update.dashboardHidden = hide;

      if (hide) {
        update.keyNumber = "";
        update.keyColor = "";
        update.keyCount = 0;
        update.keyNote = "";
      }
    }

    // keySold + soldAt logic
    if (body.keySold !== undefined) {
      const newKeySold = toBool(body.keySold);
      const wasSold = toBool(current.keySold);

      update.keySold = newKeySold;

      if (!wasSold && newKeySold)
        update.soldAt = ensureValidDateOrNull(body.soldAt) || new Date();
      if (wasSold && !newKeySold) update.soldAt = null;
    }

    if (body.soldAt !== undefined)
      update.soldAt = ensureValidDateOrNull(body.soldAt);

    // ✅ SOLD behavior (FIN ONLY)
    const nextStage = update.stage ?? current.stage;
    if (nextStage === "SOLD") {
      update.keySold = true;
      update.soldAt = current.soldAt || new Date();

      if (!current.soldContactId) {
        const fin = update.finNumber ?? current.finNumber;
        update.soldContactId = await findSoldContactIdByFin(fin);
      }
    }

    const updated = await CarSchein.findByIdAndUpdate(id, update, { new: true })
      .populate("soldContactId", "customerName phone street postalCode city")
      .lean();

    return json(updated, 200);
  } catch (err) {
    console.error("PUT /api/carschein error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}

/* =========================================================
   PATCH /api/carschein  (Update completedTasks only)
========================================================= */
export async function PATCH(req) {
  try {
    await connectDB();

    const session = await requireAuth();
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { id, completedTasks } = body;

    if (!id || !Array.isArray(completedTasks)) {
      return json({ error: "Missing id or completedTasks array" }, 400);
    }

    const updated = await CarSchein.findByIdAndUpdate(
      id,
      { completedTasks: normalizeCompletedTasks(completedTasks) },
      { new: true },
    )
      .populate("soldContactId", "customerName phone street postalCode city")
      .lean();

    if (!updated) return json({ error: "Not found" }, 404);
    return json(updated, 200);
  } catch (err) {
    console.error("PATCH /api/carschein error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
