import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import CarSchein from "@/models/CarSchein";

export async function POST() {
  try {
    await connectDB();

    const cars = await Car.find().lean();
    const scheins = await CarSchein.find().lean();

    const existingFINs = new Set(scheins.map((s) => s.finNumber));
    const existingNames = new Set(scheins.map((s) => s.carName.toLowerCase()));

    const inserts = [];

    for (const car of cars) {
      const name =
        car.modelDescription || `${car.make} ${car.model}` || "Ohne Name";

      const fin = car.vin || null;

      // avoid duplicates
      if (fin && existingFINs.has(fin)) continue;
      if (!fin && existingNames.has(name.toLowerCase())) continue;

      inserts.push({
        carName: name,
        finNumber: fin,
        owner: "Karim",
        notes: [],
        imageUrl: null,
        publicId: null,

        keyNumber: "",
        keyCount: 2,
        keyColor: "#000000",
        keySold: false,
        keyNote: "",
        fuelNeeded: false,

        dashboardHidden: false,
      });
    }

    if (inserts.length > 0) {
      await CarSchein.insertMany(inserts);
    }

    return new Response(
      JSON.stringify({
        message: "One-time generate complete",
        created: inserts.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
