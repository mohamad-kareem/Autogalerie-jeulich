import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ContactSubmission from "@/models/ContactSubmission";

export async function POST(request) {
  // Connect to MongoDB
  await connectDB();

  try {
    // Parse the incoming JSON data
    const requestData = await request.json();

    // Destructure the required fields
    const {
      name,
      email,
      phone,
      subject,
      message,

      carName,
      carLink,
      date,
    } = requestData;

    // Get client IP address from headers
    const ip = request.headers.get("x-forwarded-for") || request.ip;

    // Get user agent from headers
    const userAgent = request.headers.get("user-agent");

    // Create new submission document
    const newSubmission = new ContactSubmission({
      name: name || "",
      email: email || "",
      phone: phone || "",
      subject: subject || "",
      message: message || "",
      date: date ? new Date(date) : null,
      isRead: false,
      carName: carName || "",
      carLink: carLink || "",
    });

    // Save to database
    await newSubmission.save();

    // Return success response with submission ID
    return NextResponse.json(
      {
        success: true,
        message: "Submission saved successfully",
        submissionId: newSubmission._id.toString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // Log detailed error in development
    console.error("Database submission error:", error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save submission",
        error: process.env.NODE_ENV === "development" ? error.message : null,
      },
      { status: 500 }
    );
  }
}
