import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getWorkshopCloudinary } from "@/lib/workshopCloudinary";
import WorkshopInspection from "@/models/WorkshopInspection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["draft", "in_progress", "completed", "cancelled"];

const ALLOWED_BODYWORK_TYPES = [
  "scratch",
  "dent",
  "paint",
  "rust",
  "crack",
  "repair",
  "adjust",
  "polish",
  "other",
];

const DEFAULT_ACTION_BY_TYPE = {
  scratch: "Lackieren",
  dent: "Beule ausbeulen",
  paint: "Lackieren",
  rust: "Rost entfernen",
  crack: "Reparieren",
  repair: "Reparieren",
  adjust: "Einstellen / Anpassen",
  polish: "Polieren",
  other: "",
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

function parsePrice(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const number = Number.parseFloat(normalized);

  return Number.isFinite(number) ? number : 0;
}

function normalizeBodyworkType(type) {
  const cleanType = String(type || "other").trim();

  if (ALLOWED_BODYWORK_TYPES.includes(cleanType)) {
    return cleanType;
  }

  return "other";
}

function sanitizeBodywork(bodywork) {
  if (!Array.isArray(bodywork)) {
    return [];
  }

  return bodywork.map((mark) => {
    const type = normalizeBodyworkType(mark?.type);
    const action = String(
      mark?.action || DEFAULT_ACTION_BY_TYPE[type] || "",
    ).trim();

    return {
      id: String(mark?.id || "").trim(),

      local: Array.isArray(mark?.local)
        ? mark.local.slice(0, 3).map((value) => Number(value) || 0)
        : [0, 0, 0],

      normal: Array.isArray(mark?.normal)
        ? mark.normal.slice(0, 3).map((value) => Number(value) || 0)
        : [0, 0, 1],

      type,
      action,
      panel: String(mark?.panel || "").trim(),
      note: String(mark?.note || "").trim(),
      price: mark?.price ?? "",

      size: Number(mark?.size) || 0.06,
      length: Number(mark?.length) || 0.06,
      rotation: Number(mark?.rotation) || 0,

      done: Boolean(mark?.done),
    };
  });
}

function sanitizeMechanicalTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks.map((task) => ({
    id: String(task?.id || "").trim(),
    area: String(task?.area || "").trim(),
    job: String(task?.job || "").trim(),
    note: String(task?.note || "").trim(),
    price: task?.price ?? "",
    done: Boolean(task?.done),
  }));
}

function calculateTotals(bodywork, mechanicalTasks) {
  const bodyworkTotal = bodywork.reduce(
    (sum, mark) => sum + parsePrice(mark.price),
    0,
  );

  const mechanicalTotal = mechanicalTasks.reduce(
    (sum, task) => sum + parsePrice(task.price),
    0,
  );

  return {
    bodywork: bodyworkTotal,
    mechanical: mechanicalTotal,
    total: bodyworkTotal + mechanicalTotal,
  };
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Ungültige Werkstattauftrag-ID.",
        },
        { status: 400 },
      );
    }

    const inspection = await WorkshopInspection.findById(id).lean();

    if (!inspection) {
      return NextResponse.json(
        {
          success: false,
          message: "Werkstattauftrag wurde nicht gefunden.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        inspection,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET workshop inspection by ID error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Werkstattauftrag konnte nicht geladen werden.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Ungültige Werkstattauftrag-ID.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const inspection = await WorkshopInspection.findById(id);

    if (!inspection) {
      return NextResponse.json(
        {
          success: false,
          message: "Werkstattauftrag wurde nicht gefunden.",
        },
        { status: 404 },
      );
    }

    if (body.vehicle) {
      const brandId = String(
        body.vehicle.brandId ?? inspection.vehicle.brandId ?? "",
      ).trim();

      const brandLabel = String(
        body.vehicle.brandLabel ?? inspection.vehicle.brandLabel ?? "",
      ).trim();

      const name = String(
        body.vehicle.name ?? inspection.vehicle.name ?? "",
      ).trim();

      const fin = String(body.vehicle.fin ?? inspection.vehicle.fin ?? "")
        .trim()
        .toUpperCase();

      if (!brandId || !brandLabel || !name) {
        return NextResponse.json(
          {
            success: false,
            message: "Marke und Fahrzeugbezeichnung sind erforderlich.",
          },
          { status: 400 },
        );
      }

      if (fin) {
        const duplicate = await WorkshopInspection.findOne({
          _id: { $ne: id },
          "vehicle.fin": fin,
        }).lean();

        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Für diese FIN existiert bereits ein anderer Werkstattauftrag.",
            },
            { status: 409 },
          );
        }
      }

      inspection.vehicle = {
        brandId,
        brandLabel,
        name,
        fin,
      };
    }

    if (body.bodywork !== undefined) {
      inspection.bodywork = sanitizeBodywork(body.bodywork);
    }

    if (body.mechanicalTasks !== undefined) {
      inspection.mechanicalTasks = sanitizeMechanicalTasks(
        body.mechanicalTasks,
      );
    }

    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Ungültiger Werkstattstatus.",
          },
          { status: 400 },
        );
      }

      inspection.status = body.status;
    }

    /*
      Photos are intentionally not accepted through PATCH.

      Photos can only be added or deleted through:
      /api/workshop-inspections/[id]/photos
    */

    const cleanBodywork = sanitizeBodywork(inspection.bodywork);

    const cleanMechanicalTasks = sanitizeMechanicalTasks(
      inspection.mechanicalTasks,
    );

    inspection.bodywork = cleanBodywork;
    inspection.mechanicalTasks = cleanMechanicalTasks;

    inspection.totals = calculateTotals(cleanBodywork, cleanMechanicalTasks);

    await inspection.save();

    return NextResponse.json(
      {
        success: true,
        message: "Werkstattauftrag wurde gespeichert.",
        inspection,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH workshop inspection error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Für diese FIN existiert bereits ein anderer Werkstattauftrag.",
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
          message: errors[0] || "Die Werkstattdaten sind ungültig.",
          errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Werkstattauftrag konnte nicht gespeichert werden.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Ungültige Werkstattauftrag-ID.",
        },
        { status: 400 },
      );
    }

    const inspection = await WorkshopInspection.findById(id).lean();

    if (!inspection) {
      return NextResponse.json(
        {
          success: false,
          message: "Werkstattauftrag wurde nicht gefunden.",
        },
        { status: 404 },
      );
    }

    const publicIds = (inspection.beforeRepairPhotos || [])
      .map((photo) => photo.publicId)
      .filter(Boolean);

    if (publicIds.length > 0) {
      const cloudinary = getWorkshopCloudinary();

      await cloudinary.api.delete_resources(publicIds, {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      });
    }

    await WorkshopInspection.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Werkstattauftrag und Fotos wurden gelöscht.",
        deletedId: id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE workshop inspection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Werkstattauftrag konnte nicht gelöscht werden.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
