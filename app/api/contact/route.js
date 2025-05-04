// app/api/contact/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { name, email, phone, subject, message, carId, carName, carLink } =
      await request.json();

    // Make sure to use your real SMTP config (do NOT hardcode in production)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g. "smtp.gmail.com"
      port: Number(process.env.SMTP_PORT), // 587 for TLS
      secure: false, // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your email password or app password
      },
    });

    // Build the email
    const mailOptions = {
      from: `"Autogalerie Jülich" <${process.env.SMTP_USER}>`,
      to: process.env.COMPANY_EMAIL || "anfrage@juelicherautozentrum.de", // where you want to receive
      subject: `Neue Anfrage: ${subject}${carName ? ` für ${carName}` : ""}`,
      text: `
Name: ${name}
E-Mail: ${email}
Telefon: ${phone}
Betreff: ${subject}

Nachricht:
${message}

Fahrzeug: ${carName}
Link: ${carLink}
Fahrzeug-ID: ${carId}
      `,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone}</p>
        <p><strong>Betreff:</strong> ${subject}</p>
        <p><strong>Nachricht:</strong><br/>${message
          .replace(/\n/g, "<br/>")
          .trim()}</p>
        <hr />
        <p><strong>Fahrzeug:</strong> ${carName}</p>
        <p><strong>Link:</strong> <a href="${carLink}">${carLink}</a></p>
        <p><strong>Fahrzeug-ID:</strong> ${carId}</p>
      `,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mail error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
