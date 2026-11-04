import { connectDB } from "@/lib/mongodb";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { addDays } from "date-fns";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * POST /api/auth/forgot-password  body: { email }
 * Sends a reset link to an admin. The answer is the same whether the address
 * exists or not (nobody can probe for accounts); what really happened is in
 * the server log.
 */
export async function POST(req) {
  const { email: rawEmail } = await req.json().catch(() => ({}));
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email) return Response.json({ error: "E-Mail fehlt." }, { status: 400 });

  const { db } = await connectDB();
  // Older accounts may be stored with capitals ("Max@…").
  const user =
    (await db.collection("admins").findOne({ email })) ||
    (await db.collection("admins").findOne({ email: { $regex: `^\\s*${escapeRegex(email)}\\s*$`, $options: "i" } }));

  if (!user) {
    console.warn("forgot-password: no admin with this e-mail –", email);
    return Response.json({ ok: true });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, COMPANY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("forgot-password: SMTP_HOST / SMTP_USER / SMTP_PASS missing");
    return Response.json({ error: "E-Mail-Versand ist nicht eingerichtet." }, { status: 500 });
  }

  const token = uuidv4();
  await db.collection("passwordResetTokens").insertOne({
    userId: user._id,
    token,
    expires: addDays(new Date(), 1),
    used: false,
  });

  // The link must point to the site the request came from when NEXTAUTH_URL
  // is missing (e.g. a Vercel preview).
  const base = (process.env.NEXTAUTH_URL || new URL(req.url).origin).replace(/\/+$/, "");
  const resetLink = `${base}/reset-password?token=${token}`;

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    // Sent from the SMTP account itself: Gmail refuses or rewrites any other
    // sender, and other mail servers then sort the mail out as spam.
    const info = await transporter.sendMail({
      from: `"Autogalerie Jülich" <${SMTP_USER}>`,
      replyTo: COMPANY_EMAIL || SMTP_USER,
      to: user.email.trim(),
      subject: "Passwort zurücksetzen – Autogalerie Jülich",
      text: `Hallo ${user.name || ""},\n\nüber diesen Link kannst du dein Passwort neu setzen (24 Stunden gültig):\n${resetLink}\n\nFalls du das nicht angefordert hast, ignoriere diese E-Mail.`,
      html: `<p>Hallo ${user.name || ""},</p><p>über diesen Link kannst du dein Passwort neu setzen (24&nbsp;Stunden gültig):</p><p><a href="${resetLink}">Passwort zurücksetzen</a></p><p>Falls du das nicht angefordert hast, ignoriere diese E-Mail.</p>`,
    });
    console.log("forgot-password: mail sent –", { to: user.email, accepted: info.accepted, rejected: info.rejected });
  } catch (error) {
    console.error("forgot-password: sending failed –", error?.message || error);
    return Response.json({ error: "Die E-Mail konnte nicht gesendet werden." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
