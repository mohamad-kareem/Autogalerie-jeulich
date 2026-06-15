import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb";
import AIConversation from "@/models/AIConversation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  if (
    session.user.role &&
    !["admin", "superadmin"].includes(session.user.role)
  ) {
    return null;
  }

  return session;
}

function sanitizeText(value, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export async function GET(request, { params }) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Nicht autorisiert.",
        },
        {
          status: 401,
        },
      );
    }

    await connectDB();

    const resolvedParams = await params;

    const conversationId = sanitizeText(resolvedParams?.conversationId, 150);

    const conversation = await AIConversation.findOne({
      conversationId,
    }).lean();

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Unterhaltung nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    await AIConversation.updateOne(
      {
        conversationId,
      },
      {
        $set: {
          unreadByAdmin: false,
        },
      },
    );

    conversation.unreadByAdmin = false;

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Read AI conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unterhaltung konnte nicht geladen werden.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Nicht autorisiert.",
        },
        {
          status: 401,
        },
      );
    }

    await connectDB();

    const resolvedParams = await params;

    const conversationId = sanitizeText(resolvedParams?.conversationId, 150);

    const body = await request.json();

    const update = {};

    if (body?.status === "open" || body?.status === "archived") {
      update.status = body.status;
    }

    if (typeof body?.unreadByAdmin === "boolean") {
      update.unreadByAdmin = body.unreadByAdmin;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Keine gültigen Änderungen angegeben.",
        },
        {
          status: 400,
        },
      );
    }

    const conversation = await AIConversation.findOneAndUpdate(
      {
        conversationId,
      },
      {
        $set: update,
      },
      {
        new: true,
      },
    ).lean();

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Unterhaltung nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Update AI conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unterhaltung konnte nicht aktualisiert werden.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Nicht autorisiert.",
        },
        {
          status: 401,
        },
      );
    }

    await connectDB();

    const resolvedParams = await params;

    const conversationId = sanitizeText(resolvedParams?.conversationId, 150);

    const deletedConversation = await AIConversation.findOneAndDelete({
      conversationId,
    });

    if (!deletedConversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Unterhaltung nicht gefunden.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Unterhaltung wurde gelöscht.",
    });
  } catch (error) {
    console.error("Delete AI conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unterhaltung konnte nicht gelöscht werden.",
      },
      {
        status: 500,
      },
    );
  }
}
