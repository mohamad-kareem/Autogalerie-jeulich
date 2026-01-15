// app/api/carschein/sold/route.js
import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import ContactCustomer from "@/models/ContactCustomer";
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
   Helpers
------------------------ */
function toStr(v) {
  return String(v ?? "").trim();
}

function ensureValidDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function findSoldContactIdByFin(finNumber) {
  const fin = toStr(finNumber);
  if (!fin) return null;

  // VINs are often uppercase -> try exact + uppercase
  const finUpper = fin.toUpperCase();

  const byVin = await ContactCustomer.findOne({ vin: { $in: [fin, finUpper] } })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();

  return byVin?._id || null;
}

/* =========================================================
   POST /api/carschein/sold  (Mark sold by FIN)
   body: { finNumber, soldAt? }
========================================================= */
export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const finNumber = toStr(body.finNumber);
    if (!finNumber) return json({ error: "Missing finNumber" }, 400);

    // Find the CarSchein by FIN (try exact + uppercase)
    const finUpper = finNumber.toUpperCase();
    const current = await CarSchein.findOne({
      finNumber: { $in: [finNumber, finUpper] },
    })
      .select("_id finNumber soldAt soldContactId")
      .lean();

    if (!current) return json({ error: "CarSchein not found" }, 404);

    const incomingSoldAt = ensureValidDateOrNull(body.soldAt);
    const soldAt = incomingSoldAt || current.soldAt || new Date();

    // set soldContactId only if missing
    let soldContactId = current.soldContactId || null;
    if (!soldContactId) {
      soldContactId = await findSoldContactIdByFin(
        current.finNumber || finNumber
      );
    }

    const updated = await CarSchein.findByIdAndUpdate(
      current._id,
      {
        $set: {
          stage: "SOLD",
          keySold: true,
          soldAt,
          ...(soldContactId ? { soldContactId } : {}),
        },
      },
      { new: true }
    )
      .populate("soldContactId", "customerName phone street postalCode city")
      .lean();

    return json(updated, 200);
  } catch (err) {
    console.error("POST /api/carschein/sold error:", err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
