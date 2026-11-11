export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import ContactCustomer from "@/models/ContactCustomer";
import Kaufvertrag from "@/models/Kaufvertrag";
import { errorResponse, staffUser } from "@/lib/kaufvertragServer";
import { normPhone } from "@/lib/sales";
import { splitCity } from "@/lib/kaufvertrag";

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** GET /api/kaufvertrag/kunden?q= – existing customers while typing the buyer (name or phone) */
export async function GET(req) {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const q = String(new URL(req.url).searchParams.get("q") || "").trim().slice(0, 60);
  if (q.length < 2) return Response.json({ customers: [] });
  try {
    await connectDB();
    const rx = { $regex: esc(q), $options: "i" };
    const digits = normPhone(q);
    const or = [{ customerName: rx }, { email: rx }];
    if (digits.length >= 3) or.push({ phone: { $regex: esc(digits.slice(-6)) } });
    const docs = await ContactCustomer.find({ $or: or }).sort({ updatedAt: -1 }).limit(12).lean();

    // ID number only lives in the contracts – take it from the newest contract of that buyer
    const out = [];
    const seen = new Set();
    for (const d of docs) {
      const key = `${String(d.customerName || "").toLowerCase()}|${normPhone(d.phone)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const last = await Kaufvertrag.findOne({ buyerName: d.customerName }).sort({ createdAt: -1 }).select("idNumber buyerCity").lean();
      const fromCity = splitCity(last?.buyerCity);
      out.push({
        _id: String(d._id),
        name: d.customerName || "",
        street: d.street || "",
        zip: d.postalCode || fromCity.zip || "",
        city: d.postalCode ? d.city || "" : splitCity(d.city).city || fromCity.city || "",
        phone: d.phone || "",
        email: d.email || "",
        idNumber: last?.idNumber || "",
      });
    }
    return Response.json({ customers: out.slice(0, 6) });
  } catch (err) {
    return errorResponse(err, "Kunden konnten nicht geladen werden.");
  }
}
