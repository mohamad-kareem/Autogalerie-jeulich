/**
 * Fahrzeugverwaltung — every call to the server in one place.
 * Each function throws an Error with the server's own message on failure.
 */

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dclgxdwrc/image/upload";
const CLOUDINARY_PRESET = "car_scheins_unsigned";

async function send(method, body) {
  const response = await fetch("/api/carschein", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Fehler ${response.status}`);
  return data;
}

export async function fetchScheins(limit) {
  const response = await fetch(`/api/carschein?page=1&limit=${limit}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Abruf fehlgeschlagen");
  const data = await response.json();
  return data?.docs || [];
}

export const createSchein = (payload) => send("POST", payload);

/** Partial update: only the fields given are changed. */
export const updateSchein = (id, changes) => send("PUT", { id, ...changes });

export async function deleteSchein(id) {
  // The API also removes the Cloudinary image.
  const response = await fetch(`/api/carschein?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Löschen fehlgeschlagen");
}

/** Uploads the photo of the registration document to Cloudinary. */
export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);
  const response = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
  const data = await response.json().catch(() => null);
  if (data?.error) throw new Error(`Cloudinary-Fehler: ${data.error.message}`);
  if (!data?.secure_url) throw new Error("Fehler beim Bild-Upload");
  return { imageUrl: data.secure_url, publicId: data.public_id };
}
