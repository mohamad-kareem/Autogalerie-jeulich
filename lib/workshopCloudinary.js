import { v2 as cloudinary } from "cloudinary";

function getWorkshopCredentials() {
  const cloudName = process.env.WORKSHOP_CLOUDINARY_CLOUD_NAME?.trim();

  const apiKey = process.env.WORKSHOP_CLOUDINARY_API_KEY?.trim();

  const apiSecret = process.env.WORKSHOP_CLOUDINARY_API_SECRET?.trim();

  if (!cloudName) {
    throw new Error("WORKSHOP_CLOUDINARY_CLOUD_NAME fehlt in .env.local.");
  }

  if (!apiKey) {
    throw new Error("WORKSHOP_CLOUDINARY_API_KEY fehlt in .env.local.");
  }

  if (!apiSecret) {
    throw new Error("WORKSHOP_CLOUDINARY_API_SECRET fehlt in .env.local.");
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };
}

export function getWorkshopCloudinary() {
  const credentials = getWorkshopCredentials();

  cloudinary.config(credentials);

  return cloudinary;
}

export function workshopPhotoFolder(inspectionId) {
  const cleanId = String(inspectionId || "").trim();

  if (!cleanId) {
    throw new Error("Für den Cloudinary-Ordner fehlt die Werkstattauftrag-ID.");
  }

  return `autogalerie-juelich/workshop-inspections/${cleanId}/before-repair`;
}
