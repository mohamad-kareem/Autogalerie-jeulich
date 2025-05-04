// app/api/entries/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Entry from "@/models/Entry";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const entry = await Entry.findOneAndUpdate(
      { _id: id, createdBy: session.user.id },
      body,
      { new: true }
    );

    if (!entry) {
      return Response.json({ message: "Entry not found" }, { status: 404 });
    }

    return Response.json(entry);
  } catch (error) {
    return Response.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const entry = await Entry.findOneAndDelete({
      _id: id,
      createdBy: session.user.id,
    });

    if (!entry) {
      return Response.json({ message: "Entry not found" }, { status: 404 });
    }

    return Response.json({ message: "Entry deleted" });
  } catch (error) {
    return Response.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
