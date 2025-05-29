// app/api/contact/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      carId,
      carName,
      carLink,
      date,
    } = await request.json();

    const formatDateTime = (value) => {
      if (!value) return "Nicht angegeben";
      const dateObj = new Date(value);
      return dateObj.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate email subject based on available information
    const emailSubject = `📬 Neue ${
      carName ? "Fahrzeuganfrage" : "Kontaktanfrage"
    }${name ? ` von ${name}` : ""}`;

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kontaktanfrage | Autogalerie Jülich</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Playfair+Display:wght@700&display=swap');
        
        body {
          font-family: 'Montserrat', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 650px;
          margin: 0 auto;
          padding: 0;
          background-color: #f8f5f2;
        }
        .email-wrapper {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }
        .letterhead {
          background: linear-gradient(135deg, #1a3e72 0%, #0d2340 100%);
          color: white;
          padding: 30px 40px;
          text-align: left;
          border-bottom: 4px solid #d4af37;
        }
        .letterhead h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          margin: 0 0 10px 0;
          font-weight: 700;
        }
        .content-area {
          padding: 40px;
        }
        .customer-info {
          margin-bottom: 30px;
        }
        .customer-info p {
          margin: 5px 0;
        }
        .label {
          font-weight: 600;
          color: #1a3e72;
          display: inline-block;
          width: 100px;
        }
        .message-box {
          background-color: #f9f9f9;
          border-left: 4px solid #d4af37;
          padding: 25px;
          margin: 25px 0;
          position: relative;
        }
        .car-details {
          background-color: #f0f7ff;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 12px;
          color: #777;
          background-color: #f5f5f5;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="letterhead">
          <h1>Autogalerie Jülich</h1>
          <p>Neue Kontaktanfrage erhalten</p>
        </div>
        
        <div class="content-area">
          <div class="customer-info">
            <p><span class="label">Name:</span> ${name || "Nicht angegeben"}</p>
            <p><span class="label">E-Mail:</span> <a href="mailto:${email}">${email}</a></p>
            ${
              phone
                ? `<p><span class="label">Telefon:</span> <a href="tel:${phone}">${phone}</a></p>`
                : ""
            }
            <p><span class="label">Betreff:</span> ${
              subject || "Kein Betreff angegeben"
            }</p>
          ${
            date
              ? `<p><span class="label">Wunschdatum:</span> ${formatDateTime(
                  date
                )}</p>`
              : ""
          }

          </div>
          
          <div class="message-box">
            <p><strong>Nachricht:</strong></p>
            <p>${message.replace(/\n/g, "<br/>")}</p>
          </div>
          
          ${
            carName
              ? `
          <div class="car-details">
            <h3>Fahrzeuginformationen</h3>
            <p><span class="label">Modell:</span> ${carName}</p>
            ${
              carLink
                ? `<p><span class="label">Link:</span> <a href="${carLink}">Fahrzeug ansehen</a></p>`
                : ""
            }
            ${
              carId
                ? `<p><span class="label">Fahrzeug-ID:</span> ${carId}</p>`
                : ""
            }
          </div>
          `
              : ""
          }
        </div>
        
        <div class="footer">
          <p>Autogalerie Jülich GmbH • ${new Date().toLocaleDateString(
            "de-DE"
          )}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const textTemplate = `
Neue Kontaktanfrage - Autogalerie Jülich

Kundeninformation:
Name: ${name || "Nicht angegeben"}
E-Mail: ${email}
${phone ? `Telefon: ${phone}\n` : ""}
Betreff: ${subject || "Kein Betreff angegeben"}
${date ? `Wunschdatum: ${formatDateTime(date)}\n` : ""}

Nachricht:
${message}

${
  carName
    ? `
Fahrzeuginformation:
Modell: ${carName}
${carLink ? `Link: ${carLink}\n` : ""}
${carId ? `Fahrzeug-ID: ${carId}\n` : ""}
`
    : ""
}

---
Autogalerie Jülich GmbH • ${new Date().toLocaleDateString("de-DE")}
`;

    const mailOptions = {
      from: `"Autogalerie Jülich" <${process.env.SMTP_USER}>`,
      to: process.env.COMPANY_EMAIL || "autogalerie.jülich@web.de",
      subject: emailSubject,
      text: textTemplate,
      html: htmlTemplate,
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
