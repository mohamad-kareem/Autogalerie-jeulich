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
const UPLOAD_TRANSFORMATION = "c_limit,h_2400,q_auto:good,w_2400";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  // Some mobile browsers do not send a useful MIME type.
  "application/octet-stream",
  "",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getExtension(fileName = "") {
  return String(fileName).split(".").pop()?.toLowerCase() || "";
}

function isAllowedFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const extension = getExtension(file?.name);
  return ALLOWED_TYPES.has(type) && ALLOWED_EXTENSIONS.has(extension);
}

function getErrorStatus(error) {
  const status = Number(error?.http_code || error?.status);
  return Number.isInteger(status) && status >= 400 && status <= 599
    ? status
    : 500;
}

function getUploadErrorMessage(error) {
  if (error?.http_code === 400) {
    return error?.message || "Cloudinary hat die Bilddatei abgelehnt.";
  }
  if (error?.http_code === 401) return "Cloudinary-Anmeldung fehlgeschlagen.";
  if (error?.http_code === 403) return "Cloudinary hat den Upload abgelehnt.";
  return error?.message || "Die Fotos konnten nicht hochgeladen werden.";
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
          { width: 2400, height: 2400, crop: "limit", quality: "auto:good" },
        ],
        context: {
          inspectionId: String(inspectionId),
          vehicle: String(vehicleName || ""),
          category: "before-repair",
        },
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.public_id) {
          return reject(
            new Error("Cloudinary hat keine gültige Public-ID zurückgegeben."),
          );
        }
        resolve(result);
      },
    );

    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

async function rollbackUploadedPhotos(publicIds) {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return;

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

function mapCloudinaryPhoto(result, originalFilename = "") {
  return {
    publicId: String(result.public_id || result.publicId || ""),
    url: String(result.url || ""),
    secureUrl: String(
      result.secure_url || result.secureUrl || result.url || "",
    ),
    width: Number(result.width) || 0,
    height: Number(result.height) || 0,
    format: String(result.format || ""),
    bytes: Number(result.bytes) || 0,
    originalFilename: String(
      originalFilename || result.original_filename || "",
    ),
    takenAt: new Date(),
  };
}

async function getInspection(id) {
  if (!isValidId(id)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Ungültige Werkstattauftrag-ID." },
        { status: 400 },
      ),
    };
  }

  const inspection = await WorkshopInspection.findById(id);
  if (!inspection) {
    return {
      error: NextResponse.json(
        { success: false, message: "Werkstattauftrag wurde nicht gefunden." },
        { status: 404 },
      ),
    };
  }

  return { inspection };
}

export async function POST(request, { params }) {
  const uploadedPublicIds = [];

  try {
    await connectDB();
    const { id } = await params;
    const found = await getInspection(id);
    if (found.error) return found.error;
    const { inspection } = found;

    const contentType = request.headers.get("content-type") || "";

    // Mobile-safe flow: return a signed Cloudinary upload payload.
    // The phone uploads directly to Cloudinary instead of sending a large file
    // through the Next.js/Vercel request body limit.
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const action = String(body?.action || "");

      if (action === "signature") {
        const requestedCount = Number(body?.count || 0);
        if (!Number.isInteger(requestedCount) || requestedCount < 1) {
          return NextResponse.json(
            { success: false, message: "Keine Fotos ausgewählt." },
            { status: 400 },
          );
        }
        if (requestedCount > MAX_FILES) {
          return NextResponse.json(
            {
              success: false,
              message: `Es können höchstens ${MAX_FILES} Fotos gleichzeitig hochgeladen werden.`,
            },
            { status: 400 },
          );
        }

        const cloudinary = getWorkshopCloudinary();
        const config = cloudinary.config();
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = workshopPhotoFolder(id);
        const context = `inspectionId=${id}|vehicle=${String(
          inspection.vehicle?.name || "",
        )}|category=before-repair`;

        const signedParams = {
          timestamp,
          folder,
          context,
          transformation: UPLOAD_TRANSFORMATION,
          unique_filename: true,
          overwrite: false,
          use_filename: false,
        };

        const signature = cloudinary.utils.api_sign_request(
          signedParams,
          config.api_secret,
        );

        return NextResponse.json({
          success: true,
          upload: {
            cloudName: config.cloud_name,
            apiKey: config.api_key,
            timestamp,
            signature,
            folder,
            context,
            transformation: UPLOAD_TRANSFORMATION,
          },
        });
      }

      if (action === "save") {
        const incoming = Array.isArray(body?.photos) ? body.photos : [];
        if (incoming.length < 1 || incoming.length > MAX_FILES) {
          return NextResponse.json(
            {
              success: false,
              message: "Ungültige Anzahl hochgeladener Fotos.",
            },
            { status: 400 },
          );
        }

        const folderPrefix = `${workshopPhotoFolder(id)}/`;
        const uploadedPhotos = incoming.map((photo) => {
          const mapped = mapCloudinaryPhoto(photo, photo?.originalFilename);
          if (!mapped.publicId || !mapped.publicId.startsWith(folderPrefix)) {
            throw Object.assign(new Error("Ungültige Cloudinary Public-ID."), {
              status: 400,
            });
          }
          if (!mapped.secureUrl) {
            throw Object.assign(new Error("Foto-URL fehlt."), { status: 400 });
          }
          return mapped;
        });

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
      }

      return NextResponse.json(
        { success: false, message: "Ungültige Upload-Aktion." },
        { status: 400 },
      );
    }

    // Backward-compatible multipart upload for desktop/smaller files.
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
        { success: false, message: "Bitte mindestens ein Foto auswählen." },
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
      if (!isAllowedFile(file)) {
        return NextResponse.json(
          {
            success: false,
            message: `Dateityp nicht erlaubt: ${fileName}. Erlaubt sind JPG, PNG, WebP, HEIC und HEIF.`,
          },
          { status: 400 },
        );
      }
      if (Number(file.size || 0) > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: `${fileName} ist größer als 10 MB.` },
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
      uploadedPhotos.push(mapCloudinaryPhoto(result, file.name));
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
    const found = await getInspection(id);
    if (found.error) return found.error;
    const { inspection } = found;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Ungültige Anfrage." },
        { status: 400 },
      );
    }

    const publicId = String(body?.publicId || "").trim();
    if (!publicId) {
      return NextResponse.json(
        { success: false, message: "Die Cloudinary Public-ID fehlt." },
        { status: 400 },
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
        { success: false, message: "Foto wurde nicht gefunden." },
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

    return NextResponse.json({
      success: true,
      message: "Foto wurde gelöscht.",
      photos: inspection.beforeRepairPhotos,
      inspection,
    });
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
