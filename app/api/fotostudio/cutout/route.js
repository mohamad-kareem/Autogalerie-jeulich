/**
 * POST /api/fotostudio/cutout  (form field "image")
 *
 * Cuts the car out of a photo with remove.bg and returns the PNG itself
 * (not base64, so the answer stays small). Staff only — every call costs
 * remove.bg credits.
 *
 * remove.bg options used:
 *   type=car            – model trained for vehicles
 *   semitransparency    – windows stay see-through, the showroom shows through
 *   crop                – only the car, no empty border
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

function error(message, status) {
  return Response.json({ error: message }, { status });
}

/** remove.bg answers → short German messages for the page. */
function explain(status, body) {
  const code = body?.errors?.[0]?.code || "";
  if (status === 402) return "Kein remove.bg-Guthaben mehr. Bitte Credits aufladen.";
  if (status === 403) return "remove.bg-Zugang ungültig. Bitte den API-Schlüssel prüfen.";
  if (status === 429) return "Zu viele Anfragen – bitte kurz warten und erneut versuchen.";
  if (code === "unknown_foreground") return "Auf dem Foto wurde kein Fahrzeug erkannt.";
  if (status === 400) return body?.errors?.[0]?.title || "Das Foto konnte nicht verarbeitet werden.";
  return "remove.bg ist gerade nicht erreichbar. Bitte später erneut versuchen.";
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return error("Nicht angemeldet.", 401);

  if (!process.env.REMOVEBG_API_KEY) return error("remove.bg ist nicht eingerichtet (REMOVEBG_API_KEY fehlt).", 500);

  let image;
  try {
    const form = await request.formData();
    image = form.get("image");
  } catch {
    return error("Ungültige Anfrage.", 400);
  }
  if (!image || typeof image === "string") return error("Kein Foto übermittelt.", 400);
  if (image.size > MAX_BYTES) return error("Das Foto ist zu groß (max. 12 MB).", 413);

  const upstream = new FormData();
  upstream.append("image_file", image, image.name || "car.jpg");
  upstream.append("size", "auto");
  upstream.append("type", "car");
  upstream.append("format", "png");
  upstream.append("crop", "true");
  upstream.append("semitransparency", "true");

  let response;
  try {
    response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVEBG_API_KEY },
      body: upstream,
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return error("remove.bg hat nicht geantwortet. Bitte erneut versuchen.", 504);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return error(explain(response.status, body), response.status === 402 || response.status === 429 ? response.status : 502);
  }

  const png = await response.arrayBuffer();
  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      // remaining credits, if remove.bg tells us
      "X-Credits-Charged": response.headers.get("X-Credits-Charged") || "",
    },
  });
}
