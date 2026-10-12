import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { draftContactEmail, isEmail, sendContactEmail } from "@/lib/market/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/market-analysis/contact
 *   { action: "draft", result }                       → { subject, body }
 *   { action: "send", to, subject, body }              → { sentAt, to, test }
 * Sending always follows a click by the signed-in user; nothing is sent
 * automatically.
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }
  const senderName = String(session.user.name || "").slice(0, 80);

  try {
    if (body?.action === "draft") {
      if (!body.result?.target) return json({ error: "Keine Analyse vorhanden." }, 400);
      return json(await draftContactEmail(body.result, { senderName }));
    }

    if (body?.action === "send") {
      const to = String(body.to || "").trim();
      const subject = String(body.subject || "").trim().slice(0, 200);
      const text = String(body.body || "").trim().slice(0, 6000);
      if (!isEmail(to)) return json({ error: "Ungültige E-Mail-Adresse." }, 400);
      if (subject.length < 3 || text.length < 10) return json({ error: "Betreff und Text dürfen nicht leer sein." }, 400);
      const sent = await sendContactEmail({ to, subject, body: text, senderName });
      return json({ sentAt: new Date().toISOString(), ...sent });
    }

    return json({ error: "Unbekannte Aktion." }, 400);
  } catch (error) {
    console.error("market contact failed", error);
    const status = error?.status && error.status >= 400 && error.status < 600 ? error.status : 502;
    return json(
      { error: status === 502 ? `E-Mail konnte nicht gesendet werden${error?.message ? ` (${String(error.message).slice(0, 160)})` : ""}.` : error.message },
      status,
    );
  }
}
