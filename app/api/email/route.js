import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Helper function to format date for display
function formatGermanDateTime(dateString) {
  if (!dateString) return "Nicht angegeben";

  try {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Ungültiges Datum";
  }
}

export async function POST(request) {
  try {
    // Parse request data
    const requestData = await request.json();

    // Destructure required fields
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
    } = requestData;

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate email subject
    const emailSubject = `📬 ${carName ? "Fahrzeuganfrage" : "Kontaktanfrage"}${
      name ? ` von ${name}` : ""
    }`;

    // HTML email template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailSubject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #1a3e72; color: white; padding: 20px; }
        .content { padding: 20px; }
        .footer { padding: 10px; font-size: 12px; color: #777; }
        .label { font-weight: bold; color: #1a3e72; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Autogalerie Jülich</h1>
        <p>Neue Kontaktanfrage erhalten</p>
      </div>
      
      <div class="content">
        <h2>Kundeninformation</h2>
        <p><span class="label">Name:</span> ${name || "Nicht angegeben"}</p>
        <p><span class="label">E-Mail:</span> ${email || "Nicht angegeben"}</p>
        ${phone ? `<p><span class="label">Telefon:</span> ${phone}</p>` : ""}
        <p><span class="label">Betreff:</span> ${subject || "Kein Betreff"}</p>
        ${
          date
            ? `<p><span class="label">Terminwunsch:</span> ${formatGermanDateTime(
                date
              )}</p>`
            : ""
        }
        
        <h2>Nachricht</h2>
        <p>${(message || "").replace(/\n/g, "<br>")}</p>
        
        ${
          carName
            ? `
        <h2>Fahrzeugdetails</h2>
        <p><span class="label">Modell:</span> ${carName}</p>
        ${
          carLink
            ? `<p><span class="label">Link:</span> <a href="${carLink}">Zum Fahrzeug</a></p>`
            : ""
        }
        ${
          carId ? `<p><span class="label">Fahrzeug-ID:</span> ${carId}</p>` : ""
        }
        `
            : ""
        }
      </div>
      
      <div class="footer">
        <p>Autogalerie Jülich GmbH • ${new Date().toLocaleDateString(
          "de-DE"
        )}</p>
      </div>
    </body>
    </html>
    `;

    // Plain text version
    const textContent = `
Neue Kontaktanfrage - Autogalerie Jülich
----------------------------------------

Kundeninformation:
Name: ${name || "Nicht angegeben"}
E-Mail: ${email || "Nicht angegeben"}
${phone ? `Telefon: ${phone}\n` : ""}
Betreff: ${subject || "Kein Betreff"}
${date ? `Terminwunsch: ${formatGermanDateTime(date)}\n` : ""}

Nachricht:
${message || "Keine Nachricht"}

${
  carName
    ? `
Fahrzeugdetails:
Modell: ${carName}
${carLink ? `Link: ${carLink}\n` : ""}
${carId ? `Fahrzeug-ID: ${carId}\n` : ""}
`
    : ""
}

----------------------------------------
Autogalerie Jülich GmbH • ${new Date().toLocaleDateString("de-DE")}
    `;

    // Configure email options
    const mailOptions = {
      from: `"Autogalerie Jülich" <${process.env.SMTP_USER}>`,
      to: process.env.COMPANY_EMAIL || "autogalerie.jülich@web.de",
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
      replyTo: email || process.env.SMTP_USER,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error
    console.error("Email sending error:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email",
        error: process.env.NODE_ENV === "development" ? error.message : null,
      },
      { status: 500 }
    );
  }
}
