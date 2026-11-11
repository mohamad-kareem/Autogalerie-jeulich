export const runtime = "nodejs";

import { connectDB as dbConnect } from "@/lib/mongodb";
import Pickup from "@/models/Pickup";
import { staffUser as getStaffUser } from "@/lib/kaufvertragServer";
import { escapeHtml, sendMail } from "@/lib/mailer";
import { COMPANY } from "@/lib/company";
import { normEmail, parseEuro, str } from "@/lib/sales";
import { normMonthYear as normMonthYearSafe } from "@/lib/listingParser";
import { ANKAUF_MAIL_SECTIONS, ANKAUF_MAIL_TITLE, ankaufAccidentLabel } from "@/lib/ankaufMail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECTION_HEADINGS = new Set(Object.values(ANKAUF_MAIL_SECTIONS));

/** plain text → simple, clean HTML (label rows become a small table) */
function toHtml(text) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let rows = [];
  const flush = () => {
    if (!rows.length) return;
    out.push(
      `<table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 18px;border-collapse:collapse;font-size:14px">${rows
        .map(
          ([l, v]) =>
            `<tr><td style="width:36%;padding:5px 12px 5px 0;border-bottom:1px solid #edf1f5;color:#475569;vertical-align:top">${escapeHtml(l)}</td><td style="padding:5px 0;border-bottom:1px solid #edf1f5;color:#0f1a2b;font-weight:600;vertical-align:top;overflow-wrap:anywhere">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}</table>`,
    );
    rows = [];
  };
  let para = [];
  const flushPara = () => {
    if (para.length) out.push(`<p style="margin:0 0 12px">${para.map(escapeHtml).join("<br>")}</p>`);
    para = [];
  };
  for (const line of lines) {
    const heading = line.trim();
    if (heading === ANKAUF_MAIL_TITLE || SECTION_HEADINGS.has(heading)) {
      flush();
      flushPara();
      out.push(heading === ANKAUF_MAIL_TITLE
        ? `<h1 style="margin:0 0 16px;font-size:23px;line-height:1.25;color:#0b1b33">${escapeHtml(heading)}</h1>`
        : `<h2 style="margin:0 0 4px;padding:7px 0 5px;border-bottom:1px solid #cbd5e1;font-size:14px;line-height:1.35;color:#0b1b33">${escapeHtml(heading)}</h2>`);
      continue;
    }
    const m = line.match(/^([A-Za-zÄÖÜäöüß. -]{2,24}):\s{2,}(.+)$/);
    if (m) {
      flushPara();
      rows.push([m[1].trim(), m[2].trim()]);
      continue;
    }
    flush();
    if (!line.trim()) flushPara();
    else para.push(line);
  }
  flush();
  flushPara();
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1e293b;max-width:620px">
    <div style="border-bottom:2px solid #0b1b33;padding-bottom:10px;margin-bottom:18px">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:2px;color:#0b1b33;font-weight:bold">AUTOGALERIE</span>
      <span style="font-size:11px;letter-spacing:4px;color:#36b8ea;margin-left:6px">JÜLICH</span>
    </div>
    ${out.join("\n")}
  </div>`;
}

/**
 * POST /api/ankauf/bestaetigung
 * { vehicle, seller: { name, email, phone }, price, payment, handoverDate, subject, body }
 * Sends the confirmation to the seller and adds the car to "Abholungen".
 */
export async function POST(req) {
  const user = await getStaffUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const v = b.vehicle || {};
  const seller = b.seller || {};
  const email = normEmail(seller.email);
  const price = parseEuro(b.price);
  const subject = str(b.subject, 200);
  const text = String(b.body || "").slice(0, 8000).trim();

  if (!EMAIL_RE.test(email)) return Response.json({ error: "Bitte eine gültige E-Mail-Adresse des Verkäufers angeben." }, { status: 400 });
  if (!(price > 0)) return Response.json({ error: "Bitte den Ankaufspreis angeben." }, { status: 400 });
  if (!subject || !text) return Response.json({ error: "Betreff und Text der E-Mail fehlen." }, { status: 400 });

  const result = await sendMail({
    to: email,
    bcc: b.copy ? COMPANY.email : undefined,
    replyTo: COMPANY.email,
    subject,
    text,
    html: toHtml(text),
  });
  if (!result.sent) {
    return Response.json({ error: `E-Mail konnte nicht gesendet werden. ${result.error}`.trim() }, { status: 502 });
  }

  // the bought car goes to "Abholungen" (does not block the answer if the database is slow)
  let id = "";
  try {
    await dbConnect();
    const details = [
      ["Unfallhistorie", ankaufAccidentLabel(v.accidentStatus)],
      ["Fahrzeugtyp", v.bodyType],
      ["Innenausstattung", v.interior],
      ["Türen", v.doors],
      ["Sitzplätze", v.seats],
      ["Vorbesitzer", v.owners],
      ["Hubraum", v.displacement],
    ]
      .filter(([, val]) => val != null && String(val).trim())
      .map(([l, val]) => `${l}: ${str(val, 80)}`)
      .join("\n");
    const mileage = Number(v.mileage);
    const doc = await Pickup.create({
      vehicle: {
        name: str(v.name, 140),
        brand: str(v.brand, 60),
        model: str(v.model, 80),
        firstRegistration: normMonthYearSafe(v.firstRegistration),
        mileage: Number.isFinite(mileage) && v.mileage !== "" && v.mileage != null ? mileage : null,
        fuel: str(v.fuel, 30),
        power: str(v.power, 40),
        gearbox: str(v.gearbox, 30),
        tuevUntil: str(v.tuevUntil, 10),
        owners: /^\d{1,2}$/.test(String(v.owners ?? "").trim()) ? Number(String(v.owners).trim()) : null,
        color: str(v.color, 40),
        details,
        image: str(v.image, 600),
        url: str(v.url, 600),
        adPrice: Number(v.adPrice) > 0 ? Number(v.adPrice) : null,
      },
      seller: {
        name: str(seller.name, 120),
        email,
        phone: str(seller.phone, 40),
        street: str(seller.street, 120),
        zip: str(seller.zip, 10),
        city: str(seller.city, 80),
      },
      price,
      payment: b.payment === "cash" ? "cash" : "transfer",
      mode: b.mode === "delivery" ? "delivery" : "pickup",
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.handoverDate || "")) ? b.handoverDate : "",
      time: /^\d{2}:\d{2}$/.test(String(b.handoverTime || "")) ? b.handoverTime : "",
      emailTo: email,
      createdBy: user.name || "",
    });
    id = String(doc._id);
  } catch (err) {
    console.error("ANKAUF_CONFIRM_SAVE_ERROR:", err?.message || err);
  }

  return Response.json({ ok: true, to: email, id, copy: Boolean(b.copy) });
}
