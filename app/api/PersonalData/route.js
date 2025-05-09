import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const contacts = await Contact.find({ user: session.user.id }).sort({
      createdAt: -1,
    });
    return Response.json(contacts);
  } catch (error) {
    console.error("GET /api/PersonalData failed:", error);
    return Response.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const data = await request.json();
    const contact = await Contact.create({ ...data, user: session.user.id });
    return Response.json(contact);
  } catch (error) {
    console.error("POST /api/PersonalData failed:", error);
    return Response.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id, ...data } = await request.json();

    if (!id) {
      return Response.json({ error: "Missing contact ID" }, { status: 400 });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: id, user: session.user.id },
      data,
      { new: true }
    );

    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    return Response.json(contact);
  } catch (error) {
    console.error("PUT /api/PersonalData failed:", error);
    return Response.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: "Missing contact ID" }, { status: 400 });
    }

    const contact = await Contact.findOneAndDelete({
      _id: id,
      user: session.user.id,
    });

    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/PersonalData failed:", error);
    return Response.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
