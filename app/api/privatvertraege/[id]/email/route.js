export const runtime = "nodejs";

import { connectDB } from "@/lib/mongodb";
import PrivateContract from "@/models/PrivateContract";
import { SaleError, errorResponse, isId, staffUser } from "@/lib/kaufvertragServer";
import { escapeHtml, sendMail } from "@/lib/mailer";
import { normEmail } from "@/lib/sales";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY = { name: "Autogalerie Jülich", street: "Alte Dürener Straße 4", zip: "52428", city: "Jülich", phone: "02461 916006613", email: "autogalerie.juelich@web.de" };

/** POST /api/privatvertraege/:id/email – { to, pdf } sends the filled TÜV form (PDF from the page) */
export async function POST(req, { params }) {
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const { id } = await params;
  if (!isId(id)) return Response.json({ error: "Ungültige ID." }, { status: 400 });
  const body = await req.json().catch(() => ({}));

  try {
    await connectDB();
    const doc = await PrivateContract.findById(id).lean();
    if (!doc) throw new SaleError("Vertrag nicht gefunden.", 404);
    const to = normEmail(body?.to);
    if (!EMAIL_RE.test(to)) throw new SaleError("Bitte eine gültige E-Mail-Adresse angeben.", 400);
    const b64 = String(body?.pdf || "").replace(/^data:application\/pdf;[^,]*,/, "");
    if (b64.length < 200) throw new SaleError("PDF fehlt.", 400);
    const pdf = Buffer.from(b64, "base64");
    if (pdf.length > 12 * 1024 * 1024) throw new SaleError("PDF ist zu groß.", 413);

    const data = doc.data || {};
    const buyer = String(data.buyer?.name || "").trim();
    const car = [data.car?.maker, data.car?.type].filter(Boolean).join(" ") || "das Fahrzeug";
    const result = await sendMail({
      to,
      replyTo: COMPANY.email,
      subject: `Ihr Kaufvertrag – ${car}`,
      text: `Guten Tag${buyer ? ` ${buyer}` : ""},\n\nim Anhang erhalten Sie den Kaufvertrag für ${car}.\n\nVielen Dank für Ihr Vertrauen.\n\nMit freundlichen Grüßen\n${COMPANY.name}\n${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}\nTel. ${COMPANY.phone}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f1a2b;line-height:1.55">
        <p>Guten Tag${buyer ? ` ${escapeHtml(buyer)}` : ""},</p>
        <p>im Anhang erhalten Sie den Kaufvertrag für <strong>${escapeHtml(car)}</strong>.</p>
        <p>Vielen Dank für Ihr Vertrauen.</p>
        <p style="margin-top:22px">Mit freundlichen Grüßen<br><strong>${escapeHtml(COMPANY.name)}</strong><br>
        <span style="color:#64748b">${escapeHtml(COMPANY.street)}, ${escapeHtml(COMPANY.zip)} ${escapeHtml(COMPANY.city)} · Tel. ${escapeHtml(COMPANY.phone)}</span></p>
      </div>`,
      attachments: [{ filename: `Kaufvertrag_privat_${(car || "Fahrzeug").replace(/[^\w-]+/g, "-")}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
    if (!result.sent) throw new SaleError(`E-Mail konnte nicht gesendet werden. ${result.error}`.trim(), 502);

    await PrivateContract.updateOne({ _id: id }, { $set: { mailTo: to } });
    return Response.json({ ok: true, to });
  } catch (err) {
    return errorResponse(err, "E-Mail konnte nicht gesendet werden.");
  }
}
