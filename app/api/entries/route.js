// app/api/entries/route.js
import { connectDB } from "@/lib/mongodb";
import Entry from "@/models/Entry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const entries = await Entry.find({ createdBy: session.user.id })
      .sort({ date: -1 })
      .lean();

    return Response.json(entries);
  } catch (error) {
    return Response.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const entry = await Entry.create({
      ...body,
      createdBy: session.user.id,
    });

    return Response.json(entry, { status: 201 });
  } catch (error) {
    return Response.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
