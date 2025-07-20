import { connectDB } from "@/lib/mongodb";
import ContactSubmission from "@/models/ContactSubmission";
import { NextResponse } from "next/server";

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
      isRead: s.readBy?.some((id) => id.toString() === userId) ?? false,
    }));

    const unreadCount = enrichedSubmissions.filter((s) => !s.isRead).length;

    return NextResponse.json(
      { submissions: enrichedSubmissions, unreadCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch contact submissions" },
      { status: 500 }
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
        { success: false, message: "Submission ID is required" },
        { status: 400 }
      );
    }

    const deletedSubmission = await ContactSubmission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return NextResponse.json(
        { success: false, message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Submission deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete contact submission" },
      { status: 500 }
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
        { success: false, message: "ID or userId missing" },
        { status: 400 }
      );
    }

    const updated = await ContactSubmission.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: userId } }, // prevents duplicate entries
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
