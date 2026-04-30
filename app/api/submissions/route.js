import { connectDB } from "@/lib/mongodb";
import ContactSubmission from "@/models/ContactSubmission";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function formatGermanDateTime(dateString) {
  if (!dateString) return "Nicht angegeben";

  try {
    return new Date(dateString).toLocaleString("de-DE", {
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

async function sendEmail(submission) {
  console.log("SMTP DEBUG:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    hasPass: Boolean(process.env.SMTP_PASS),
    companyEmail: process.env.COMPANY_EMAIL,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // ✅ ADD THIS
  await transporter.verify();
  console.log("SMTP CONNECTION OK");

  const subject = `Neue Kontaktanfrage von ${submission.name}`;

  const text = `
Neue Kontaktanfrage

Name: ${submission.name}
E-Mail: ${submission.email}
Telefon: ${submission.phone || "Nicht angegeben"}
Betreff: ${submission.subject}
Terminwunsch: ${formatGermanDateTime(submission.date)}

Nachricht:
${submission.message}

Fahrzeug: ${submission.carName || "Kein Fahrzeug"}
Link: ${submission.carLink || "Kein Link"}
`;

  await transporter.sendMail({
    from: `"Autogalerie Jülich" <${process.env.SMTP_USER}>`,
    to: process.env.COMPANY_EMAIL.split(",").map((email) => email.trim()),
    subject,
    text,
    replyTo: submission.email,
  });

  console.log("EMAIL SENT SUCCESSFULLY"); // ✅ optional but useful
}

export async function POST(request) {
  await connectDB();

  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      subject,
      message,
      date,
      carId,
      carName,
      carLink,
    } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, subject and message are required",
        },
        { status: 400 },
      );
    }

    const submission = await ContactSubmission.create({
      name,
      email,
      phone: phone || "",
      subject,
      message,
      date: date || null,
      carId: carId || "",
      carName: carName || "",
      carLink: carLink || "",
      readBy: [],
    });

    let emailSent = true;

    try {
      await sendEmail(submission);
    } catch (error) {
      emailSent = false;
      console.error("Email sending failed:", error);
    }

    return NextResponse.json(
      {
        success: true,
        emailSent,
        submission,
        message: emailSent
          ? "Anfrage gespeichert und E-Mail gesendet"
          : "Anfrage gespeichert, aber E-Mail konnte nicht versendet werden",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/submissions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save contact submission",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const submissions = await ContactSubmission.find()
      .sort({ createdAt: -1 })
      .lean();

    const enrichedSubmissions = submissions.map((s) => ({
      ...s,
      isRead: userId ? s.readBy?.some((id) => id.toString() === userId) : false,
    }));

    const unreadCount = enrichedSubmissions.filter((s) => !s.isRead).length;

    return NextResponse.json(
      {
        success: true,
        submissions: enrichedSubmissions,
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching contact submissions:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch contact submissions",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "ID or userId missing",
        },
        { status: 400 },
      );
    }

    const updated = await ContactSubmission.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: userId } },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Marked as read",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark as read",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission ID is required",
        },
        { status: 400 },
      );
    }

    const deletedSubmission = await ContactSubmission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Submission deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete submission",
      },
      { status: 500 },
    );
  }
}
