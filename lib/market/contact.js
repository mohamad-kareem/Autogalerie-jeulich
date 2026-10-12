/**
 * Contacting a seller about a car: the AI drafts a short German e-mail from
 * the analysis, the buyer reads and edits it, and only his click sends it —
 * from the company mailbox (SMTP_* in .env). Nothing is ever sent on its own.
 *
 * MARKET_CONTACT_TEST_TO: while testing, every mail goes to this address
 * instead of the seller (the subject names the real recipient).
 */

import { completionSettings } from "./openaiParams";
import { de } from "./labels";

const CONTACT_MODEL = process.env.OPENAI_MARKET_CONTACT_MODEL || "gpt-5-mini";

const euro = (value) =>
  Number.isFinite(value) ? `${Math.round(value).toLocaleString("de-DE")} €` : null;

export function isEmail(value) {
  return /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i.test(String(value || "").trim());
}

function carName(target) {
  return (
    target.title ||
    [target.make, target.model, target.variant].filter(Boolean).join(" ") ||
    "Ihr Fahrzeug"
  );
}

/** The questions worth asking: open points the analysis found. */
function openQuestions(result) {
  const deep = result.deep || {};
  const questions = [];
  for (const finding of deep.findings || []) {
    if (finding.type === "FRAGE" && finding.text) questions.push(finding.text);
  }
  for (const cause of deep.causes || []) {
    if (cause.symptom) questions.push(`Ursache/Diagnose zu: ${cause.symptom}`);
  }
  for (const question of result.recommendation?.questionsForSeller || []) questions.push(question);
  return [...new Set(questions)].slice(0, 5);
}

/** Without the AI: a plain, correct letter from the same facts. */
function templateDraft(result, senderName) {
  const t = result.target || {};
  const name = carName(t);
  const questions = openQuestions(result);
  const greeting = t.sellerType === "DEALER" ? "Sehr geehrte Damen und Herren," : "Guten Tag,";
  const lines = [
    greeting,
    "",
    `ich interessiere mich für Ihr Angebot „${name}“${euro(t.price) ? ` zu ${euro(t.price)}` : ""}.`,
    ...(questions.length ? ["", "Vorab hätte ich ein paar Fragen:", ...questions.map((q) => `- ${q}`)] : []),
    "",
    "Wäre eine Besichtigung mit Probefahrt in den nächsten Tagen möglich? Über eine kurze Rückmeldung würde ich mich freuen.",
    "",
    "Mit freundlichen Grüßen",
    senderName || "",
    "Autogalerie Jülich",
  ];
  return {
    subject: `Anfrage zu Ihrem ${[t.make, t.model].filter(Boolean).join(" ") || "Fahrzeug"}`,
    body: lines.join("\n").trim(),
    generatedBy: "Vorlage",
  };
}

/** A short German e-mail to the seller, drafted by the AI from the analysis. */
export async function draftContactEmail(result, { senderName = "" } = {}) {
  const fallback = templateDraft(result, senderName);
  if (!process.env.OPENAI_API_KEY) return fallback;

  const t = result.target || {};
  const facts = {
    fahrzeug: carName(t),
    angebotspreis: euro(t.price),
    verkaeufer: { art: de("seller", t.sellerType), name: t.contact?.name || t.sellerName || null },
    anzeige: t.listingUrl || null,
    offene_fragen: openQuestions(result),
    unsere_entscheidung: result.deep?.decision?.action || null,
    absender: { name: senderName || null, firma: "Autogalerie Jülich" },
  };

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
    const response = await client.chat.completions.create({
      model: CONTACT_MODEL,
      ...completionSettings(CONTACT_MODEL, { maxTokens: 700, temperature: 0.4, effort: "minimal" }),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Du schreibst für einen Gebrauchtwagenhändler (Autogalerie Jülich) eine kurze, freundliche Anfrage-E-Mail an den Verkäufer eines Autos.",
            "Deutsch, höflich, sachlich, maximal 120 Wörter. Anrede passend zur Verkäuferart (Händler: 'Sehr geehrte Damen und Herren', privat: 'Guten Tag' bzw. mit Namen, falls bekannt).",
            "Inhalt: Interesse am Fahrzeug, die wichtigsten offenen Fragen (höchstens 4, als kurze Liste), Bitte um Besichtigung mit Probefahrt. Keinen Preis anbieten, nichts über unsere Kalkulation, Marge oder Analyse verraten, keine Kritik am Auto.",
            "Unterschrift: Name des Absenders (falls bekannt) und 'Autogalerie Jülich'. Keine erfundenen Telefonnummern oder Adressen.",
            'Antworte als JSON: {"betreff": "...", "text": "..."}',
          ].join(" "),
        },
        { role: "user", content: JSON.stringify(facts) },
      ],
    });
    const data = JSON.parse(response.choices?.[0]?.message?.content || "{}");
    const subject = typeof data.betreff === "string" ? data.betreff.trim().slice(0, 150) : "";
    const body = typeof data.text === "string" ? data.text.trim().slice(0, 4000) : "";
    if (subject.length < 4 || body.length < 40) return fallback;
    return { subject, body, generatedBy: CONTACT_MODEL };
  } catch (error) {
    console.error("contact draft: AI failed –", error?.message || error);
    return fallback;
  }
}

/** Sends one e-mail from the company mailbox. Throws a German message. */
export async function sendContactEmail({ to, subject, body, senderName = "" }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw Object.assign(new Error("E-Mail-Versand ist nicht eingerichtet (SMTP_* in .env fehlt)."), { status: 503 });
  }
  const recipient = String(to || "").trim();
  if (!isEmail(recipient)) throw Object.assign(new Error("Ungültige E-Mail-Adresse."), { status: 400 });

  // While testing, every mail goes to the test address — never to a seller.
  const testTo = String(process.env.MARKET_CONTACT_TEST_TO || "").trim();
  const actualTo = isEmail(testTo) ? testTo : recipient;
  const actualSubject = isEmail(testTo) ? `[TEST – an ${recipient}] ${subject}` : subject;

  const nodemailer = (await import("nodemailer")).default;
  const port = Number(SMTP_PORT) || 587;
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const replyTo = isEmail(process.env.COMPANY_EMAIL) ? process.env.COMPANY_EMAIL : SMTP_USER;
  await transport.sendMail({
    // Gmail only sends as the logged-in account; the name makes it readable.
    from: `"${(senderName ? `${senderName} – ` : "") + "Autogalerie Jülich"}" <${SMTP_USER}>`,
    to: actualTo,
    replyTo,
    subject: actualSubject,
    text: body,
  });
  return { to: actualTo, test: actualTo !== recipient };
}
