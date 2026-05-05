import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const minYear = searchParams.get("minYear");
    const maxMileage = searchParams.get("maxMileage");
    const maxPrice = searchParams.get("maxPrice");

    const query = {};

    // 🔎 Search (name / model / description)
    if (q) {
      query.$or = [
        { make: { $regex: q, $options: "i" } },
        { model: { $regex: q, $options: "i" } },
        { modelDescription: { $regex: q, $options: "i" } },
      ];
    }

    // 🏷️ Exact filters
    if (make) query.make = make;
    if (model) query.model = model;

    // 📅 Year filter (based on firstRegistration like "2014-05")
    if (minYear) {
      query.firstRegistration = {
        $gte: `${minYear}-01`,
      };
    }

    // 🚗 Mileage
    if (maxMileage) {
      query.mileage = {
        $lte: Number(maxMileage),
      };
    }

    // 💰 Price
    if (maxPrice) {
      query["price.consumerPriceGross"] = {
        $lte: Number(maxPrice),
      };
    }

    const cars = await Car.find(query).lean();

    return NextResponse.json(cars);
  } catch (err) {
    console.error(err);
    return new NextResponse("Error loading cars", { status: 500 });
  }
}
