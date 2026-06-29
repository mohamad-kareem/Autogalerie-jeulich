import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WorkshopInspection from "@/models/WorkshopInspection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { "vehicle.name": { $regex: safeSearch, $options: "i" } },
        { "vehicle.fin": { $regex: safeSearch, $options: "i" } },
        { "vehicle.brandLabel": { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`);
        if (!Number.isNaN(fromDate.getTime())) filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`);
        if (!Number.isNaN(toDate.getTime())) filter.createdAt.$lte = toDate;
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const inspections = await WorkshopInspection.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, count: inspections.length, inspections },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET workshop inspections error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Werkstattaufträge konnten nicht geladen werden.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const brandId = String(body?.vehicle?.brandId || "").trim();
    const brandLabel = String(body?.vehicle?.brandLabel || "").trim();
    const name = String(body?.vehicle?.name || "").trim();
    const fin = String(body?.vehicle?.fin || "")
      .trim()
      .toUpperCase();

    if (!brandId) {
      return NextResponse.json(
        { success: false, message: "Bitte eine Fahrzeugmarke auswählen." },
        { status: 400 },
      );
    }
    if (!brandLabel) {
      return NextResponse.json(
        { success: false, message: "Der Markenname fehlt." },
        { status: 400 },
      );
    }
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Bitte die Fahrzeugbezeichnung eintragen." },
        { status: 400 },
      );
    }

    if (fin) {
      const existingInspection = await WorkshopInspection.findOne({
        "vehicle.fin": fin,
      }).lean();
      if (existingInspection) {
        return NextResponse.json(
          {
            success: false,
            message: "Für diese FIN existiert bereits ein Werkstattauftrag.",
          },
          { status: 409 },
        );
      }
    }

    const inspection = await WorkshopInspection.create({
      vehicle: { brandId, brandLabel, name, fin },
      bodywork: [],
      mechanicalTasks: [],
      beforeRepairPhotos: [],
      totals: { bodywork: 0, mechanical: 0, total: 0 },
      status: "draft",
    });

    return NextResponse.json(
      { success: true, message: "Fahrzeug wurde angelegt.", inspection },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST workshop inspection error:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Für diese FIN existiert bereits ein Werkstattauftrag.",
        },
        { status: 409 },
      );
    }
    if (error?.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map(
        (item) => item.message,
      );
      return NextResponse.json(
        {
          success: false,
          message: errors[0] || "Die eingegebenen Fahrzeugdaten sind ungültig.",
          errors,
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Das Fahrzeug konnte nicht angelegt werden.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
