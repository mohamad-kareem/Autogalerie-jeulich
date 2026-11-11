import nodemailer from "nodemailer";

/** Same SMTP setup as the contact form (UDAG). Returns { sent, error }. */
export async function sendMail({ to, cc, bcc, subject, html, text, replyTo, attachments }) {
  const host = process.env.SMTP_HOST || "smtps.udag.de";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const from = (process.env.SMTP_FROM || `Autogalerie Jülich <${user}>`).trim();

  if (!user || !pass) return { sent: false, error: "SMTP env vars fehlen (SMTP_USER / SMTP_PASS)." };

  const secure = port === 465;
  const tls = { rejectUnauthorized: false, minVersion: "TLSv1.2", servername: host };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      ...(secure ? { tls } : { requireTLS: true, tls }),
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    await transporter.sendMail({ from, to, cc, bcc, subject, html, text, replyTo, attachments });
    return { sent: true, error: "" };
  } catch (err) {
    return { sent: false, error: String(err?.message || err).slice(0, 300) };
  }
}

export const escapeHtml = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
