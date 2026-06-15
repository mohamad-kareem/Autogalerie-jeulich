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

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    const status = searchParams.get("status") || "open";

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 30, 1),
      100,
    );

    const query = {};

    if (status === "open" || status === "archived") {
      query.status = status;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.$or = [
        {
          lastMessage: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          "messages.content": {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          "customer.name": {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          "customer.email": {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          "customer.phone": {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          "page.title": {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [conversations, total, unreadCount] = await Promise.all([
      AIConversation.find(query)
        .select(
          [
            "conversationId",
            "customer",
            "page",
            "lastMessage",
            "lastMessageRole",
            "lastMessageAt",
            "unreadByAdmin",
            "status",
            "createdAt",
            "updatedAt",
          ].join(" "),
        )
        .sort({
          lastMessageAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AIConversation.countDocuments(query),

      AIConversation.countDocuments({
        status: "open",
        unreadByAdmin: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      conversations,
      unreadCount,

      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error("Load AI conversations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unterhaltungen konnten nicht geladen werden.",
      },
      {
        status: 500,
      },
    );
  }
}
