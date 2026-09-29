import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

const escape = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/cars — the public stock, newest first (used by the comparison
 * and other pages). Optional filters: q, make, model, minYear, maxMileage,
 * maxPrice.
 */
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const minYear = Number(searchParams.get("minYear"));
    const maxMileage = Number(searchParams.get("maxMileage"));
    const maxPrice = Number(searchParams.get("maxPrice"));

    const query = {};
    if (q) {
      const pattern = { $regex: escape(q), $options: "i" };
      query.$or = [{ make: pattern }, { model: pattern }, { modelDescription: pattern }];
    }
    if (make) query.make = make;
    if (model) query.model = model;
    // firstRegistration is "YYYYMM"; compare the year as text.
    if (minYear > 1900) query.firstRegistration = { $gte: String(minYear) };
    if (maxMileage > 0) query.mileage = { $lte: maxMileage };
    if (maxPrice > 0) query.priceValue = { $lte: maxPrice };

    const cars = await Car.find(query).sort({ mobileCreatedAt: -1, createdAt: -1 }).lean();
    return NextResponse.json(cars);
  } catch (error) {
    console.error("GET /api/cars failed:", error?.message);
    return NextResponse.json({ error: "Fahrzeuge konnten nicht geladen werden." }, { status: 500 });
  }
}
