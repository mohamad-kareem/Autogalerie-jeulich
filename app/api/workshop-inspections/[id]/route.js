import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import WorkshopInspection from "@/models/WorkshopInspection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parsePrice(value) {
  if (value === null || value === undefined || value === "") return 0;

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

function sanitizeBodywork(bodywork) {
  if (!Array.isArray(bodywork)) return [];

  return bodywork.map((mark) => ({
    id: String(mark?.id || "").trim(),
    local: Array.isArray(mark?.local)
      ? mark.local.slice(0, 3).map((value) => Number(value) || 0)
      : [0, 0, 0],
    normal: Array.isArray(mark?.normal)
      ? mark.normal.slice(0, 3).map((value) => Number(value) || 0)
      : [0, 0, 1],
    type: String(mark?.type || "other").trim(),
    action: String(mark?.action || "").trim(),
    panel: String(mark?.panel || "").trim(),
    note: String(mark?.note || "").trim(),
    price: mark?.price ?? "",
    size: Number(mark?.size) || 0.06,
    length: Number(mark?.length) || 0.06,
    rotation: Number(mark?.rotation) || 0,
  }));
}

function sanitizeMechanicalTasks(tasks) {
  if (!Array.isArray(tasks)) return [];

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

/**
 * GET /api/workshop-inspections/:id
 *
 * Loads one workshop inspection.
 */
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

/**
 * PATCH /api/workshop-inspections/:id
 *
 * Updates vehicle details, bodywork marks, mechanical tasks and status.
 */
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

    const existingInspection = await WorkshopInspection.findById(id);

    if (!existingInspection) {
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
        body.vehicle.brandId ?? existingInspection.vehicle.brandId ?? "",
      ).trim();

      const brandLabel = String(
        body.vehicle.brandLabel ?? existingInspection.vehicle.brandLabel ?? "",
      ).trim();

      const name = String(
        body.vehicle.name ?? existingInspection.vehicle.name ?? "",
      ).trim();

      const fin = String(
        body.vehicle.fin ?? existingInspection.vehicle.fin ?? "",
      )
        .trim()
        .toUpperCase();

      if (!brandId) {
        return NextResponse.json(
          {
            success: false,
            message: "Bitte eine Fahrzeugmarke auswählen.",
          },
          { status: 400 },
        );
      }

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Bitte die Fahrzeugbezeichnung eintragen.",
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

      existingInspection.vehicle = {
        brandId,
        brandLabel,
        name,
        fin,
      };
    }

    if (body.bodywork !== undefined) {
      existingInspection.bodywork = sanitizeBodywork(body.bodywork);
    }

    if (body.mechanicalTasks !== undefined) {
      existingInspection.mechanicalTasks = sanitizeMechanicalTasks(
        body.mechanicalTasks,
      );
    }

    if (body.status !== undefined) {
      const allowedStatuses = [
        "draft",
        "in_progress",
        "completed",
        "cancelled",
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Ungültiger Werkstattstatus.",
          },
          { status: 400 },
        );
      }

      existingInspection.status = body.status;
    }

    const cleanBodywork = sanitizeBodywork(existingInspection.bodywork);

    const cleanMechanicalTasks = sanitizeMechanicalTasks(
      existingInspection.mechanicalTasks,
    );

    existingInspection.bodywork = cleanBodywork;
    existingInspection.mechanicalTasks = cleanMechanicalTasks;
    existingInspection.totals = calculateTotals(
      cleanBodywork,
      cleanMechanicalTasks,
    );

    await existingInspection.save();

    return NextResponse.json(
      {
        success: true,
        message: "Werkstattauftrag wurde gespeichert.",
        inspection: existingInspection,
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
      const validationErrors = Object.values(error.errors || {}).map(
        (item) => item.message,
      );

      return NextResponse.json(
        {
          success: false,
          message: validationErrors[0] || "Die Werkstattdaten sind ungültig.",
          errors: validationErrors,
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

/**
 * DELETE /api/workshop-inspections/:id
 *
 * Deletes one complete workshop inspection.
 */
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

    const deletedInspection = await WorkshopInspection.findByIdAndDelete(id);

    if (!deletedInspection) {
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
        message: "Werkstattauftrag wurde gelöscht.",
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
