import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "name";

    const where = {};
    if (q)
      where.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    if (category && category !== "All") where.category = category;

    const sort = {};
    if (sortBy === "name") sort.name = 1;
    if (sortBy === "employees") sort.employeesRequired = 1;
    if (sortBy === "difficulty") sort.difficulty = 1;

    const items = await Medicine.find(where).sort(sort).lean();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/medicines error:", err);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body?.name || !body?.description || !body?.category) {
      return NextResponse.json(
        { error: "name, category and description are required" },
        { status: 400 }
      );
    }

    const payload = {
      name: String(body.name).trim(),
      category: String(body.category).trim(),
      productionTime: body.productionTime || "0 days",
      employeesRequired: Number(body.employeesRequired || 0),
      difficulty: body.difficulty || "Low",
      ingredients: Array.isArray(body.ingredients)
        ? body.ingredients
        : String(body.ingredients || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      description: String(body.description),
      status: body.status || "Active Production",
      batchSize: Number(body.batchSize || 0),
      qualityControl: body.qualityControl || "—",
      lastProduced: body.lastProduced
        ? new Date(body.lastProduced)
        : new Date(),
      image: body.image || "/B12.png",
      imagePublicId: body.imagePublicId || "", // <— store public_id if provided
    };

    const created = await Medicine.create(payload);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/medicines error:", err);
    if (err instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create medicine" },
      { status: 500 }
    );
  }
}
