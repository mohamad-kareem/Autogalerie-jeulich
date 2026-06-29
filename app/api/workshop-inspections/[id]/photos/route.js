import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  getWorkshopCloudinary,
  workshopPhotoFolder,
} from "@/lib/workshopCloudinary";
import WorkshopInspection from "@/models/WorkshopInspection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getErrorStatus(error) {
  const status = Number(error?.http_code);

  if (Number.isInteger(status) && status >= 400 && status <= 599) {
    return status;
  }

  return 500;
}

function getUploadErrorMessage(error) {
  if (error?.http_code === 400) {
    return error?.message || "Cloudinary hat die Bilddatei abgelehnt.";
  }

  if (error?.http_code === 401) {
    return "Cloudinary-Anmeldung fehlgeschlagen.";
  }

  if (error?.http_code === 403) {
    return "Cloudinary hat den Upload abgelehnt.";
  }

  return "Die Fotos konnten nicht hochgeladen werden.";
}

function uploadBufferToCloudinary({
  cloudinary,
  buffer,
  folder,
  inspectionId,
  vehicleName,
}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        use_filename: false,
        transformation: [
          {
            width: 2400,
            height: 2400,
            crop: "limit",
            quality: "auto:good",
          },
        ],
        context: {
          inspectionId: String(inspectionId),
          vehicle: String(vehicleName || ""),
          category: "before-repair",
        },
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.public_id) {
          reject(
            new Error("Cloudinary hat keine gültige Public-ID zurückgegeben."),
          );
          return;
        }

        resolve(result);
      },
    );

    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

async function rollbackUploadedPhotos(publicIds) {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return;
  }

  try {
    const cloudinary = getWorkshopCloudinary();

    await cloudinary.api.delete_resources(publicIds, {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });
  } catch (error) {
    console.error("Cloudinary rollback error:", error);
  }
}

export async function POST(request, { params }) {
  const uploadedPublicIds = [];

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

    const formData = await request.formData();

    const files = formData
      .getAll("photos")
      .filter(
        (value) =>
          value &&
          typeof value === "object" &&
          typeof value.arrayBuffer === "function" &&
          Number(value.size) > 0,
      );

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Bitte mindestens ein Foto auswählen.",
        },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          success: false,
          message: `Es können höchstens ${MAX_FILES} Fotos gleichzeitig hochgeladen werden.`,
        },
        { status: 400 },
      );
    }

    for (const file of files) {
      const fileName = String(file.name || "Foto");
      const fileType = String(file.type || "").toLowerCase();
      const fileSize = Number(file.size || 0);

      if (!ALLOWED_TYPES.has(fileType)) {
        return NextResponse.json(
          {
            success: false,
            message: `Dateityp nicht erlaubt: ${fileName}. Erlaubt sind JPG, PNG, WebP, HEIC und HEIF.`,
          },
          { status: 400 },
        );
      }

      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: `${fileName} ist größer als 10 MB.`,
          },
          { status: 400 },
        );
      }
    }

    const cloudinary = getWorkshopCloudinary();
    const folder = workshopPhotoFolder(id);
    const uploadedPhotos = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await uploadBufferToCloudinary({
        cloudinary,
        buffer,
        folder,
        inspectionId: id,
        vehicleName: inspection.vehicle?.name || "",
      });

      uploadedPublicIds.push(result.public_id);

      uploadedPhotos.push({
        publicId: result.public_id,
        url: result.url || "",
        secureUrl: result.secure_url || result.url || "",
        width: Number(result.width) || 0,
        height: Number(result.height) || 0,
        format: String(result.format || ""),
        bytes: Number(result.bytes) || 0,
        originalFilename: String(file.name || ""),
        takenAt: new Date(),
      });
    }

    if (!Array.isArray(inspection.beforeRepairPhotos)) {
      inspection.beforeRepairPhotos = [];
    }

    inspection.beforeRepairPhotos.push(...uploadedPhotos);

    await inspection.save();

    return NextResponse.json(
      {
        success: true,
        message:
          uploadedPhotos.length === 1
            ? "Foto wurde hochgeladen."
            : `${uploadedPhotos.length} Fotos wurden hochgeladen.`,
        photos: inspection.beforeRepairPhotos,
        inspection,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST workshop photos error:", error);

    await rollbackUploadedPhotos(uploadedPublicIds);

    return NextResponse.json(
      {
        success: false,
        message: getUploadErrorMessage(error),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: getErrorStatus(error) },
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

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Ungültige Anfrage.",
        },
        { status: 400 },
      );
    }

    const publicId = String(body?.publicId || "").trim();

    if (!publicId) {
      return NextResponse.json(
        {
          success: false,
          message: "Die Cloudinary Public-ID fehlt.",
        },
        { status: 400 },
      );
    }

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

    const photos = Array.isArray(inspection.beforeRepairPhotos)
      ? inspection.beforeRepairPhotos
      : [];

    const photoExists = photos.some(
      (photo) => String(photo?.publicId || "") === publicId,
    );

    if (!photoExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Foto wurde nicht gefunden.",
        },
        { status: 404 },
      );
    }

    const cloudinary = getWorkshopCloudinary();

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "upload",
      invalidate: true,
    });

    if (!result || !["ok", "not found"].includes(result.result)) {
      throw new Error("Cloudinary konnte das Foto nicht löschen.");
    }

    inspection.beforeRepairPhotos = photos.filter(
      (photo) => String(photo?.publicId || "") !== publicId,
    );

    await inspection.save();

    return NextResponse.json(
      {
        success: true,
        message: "Foto wurde gelöscht.",
        photos: inspection.beforeRepairPhotos,
        inspection,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE workshop photo error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Das Foto konnte nicht gelöscht werden.",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: getErrorStatus(error) },
    );
  }
}
