export const runtime = "nodejs";

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import CarSchein from "@/models/CarSchein";
import { errorResponse, staffUser } from "@/lib/kaufvertragServer";
import { regMonth } from "@/lib/fahrzeugakte";
import { normVin } from "@/lib/sales";

/** POST /api/fahrzeugakte/import – one Fahrzeugakte for every website car (mobile.de) that has none yet */
export async function POST() {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    await connectDB();
    const cars = await Car.find({ sold: { $ne: true } })
      .select("vin make model modelDescription firstRegistration mileage priceValue numberOfPreviousOwners mobileCreatedAt createdAt")
      .lean();
    const existing = new Set((await CarSchein.find({}).select("finNumber").lean()).map((x) => normVin(x.finNumber)).filter(Boolean));
    let created = 0;
    for (const c of cars) {
      const vin = normVin(c.vin);
      if (vin.length !== 17 || existing.has(vin)) continue;
      await CarSchein.create({
        carName: [c.make, c.model].filter(Boolean).join(" ") || c.modelDescription || "Fahrzeug",
        finNumber: vin,
        owner: "Karim",
        keyCount: 2,
        stage: "PLATZ",
        vorbesitzer: Number.isInteger(c.numberOfPreviousOwners) ? c.numberOfPreviousOwners : null,
        firstRegistration: regMonth(c.firstRegistration),
        mileage: Number.isFinite(c.mileage) ? c.mileage : null,
        price: Number.isFinite(c.priceValue) ? c.priceValue : null,
        boughtAt: c.mobileCreatedAt || c.createdAt || new Date(),
      }).catch(() => null);
      existing.add(vin);
      created += 1;
    }
    return Response.json({ created, total: cars.length, updated: 0 });
  } catch (err) {
    return errorResponse(err, "Import fehlgeschlagen.");
  }
}
