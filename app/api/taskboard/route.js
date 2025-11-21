// app/api/taskboard/route.js
import { connectDB } from "@/lib/mongodb";
import TaskBoard from "@/models/TaskBoard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// EMPTY BOARD TEMPLATE
const EMPTY_BOARD = {
  columns: {},
  columnOrder: [],
  tasks: {},
};

export async function GET() {
  try {
    await connectDB();

    let boardDoc = await TaskBoard.findOne({ name: "default" }).lean();

    // If first time → create empty board
    if (!boardDoc) {
      const created = await TaskBoard.create({
        name: "default",
        board: EMPTY_BOARD,
      });
      boardDoc = created.toObject();
    }

    return new Response(JSON.stringify({ board: boardDoc.board }), {
      status: 200,
    });
  } catch (err) {
    console.error("GET /api/taskboard error:", err);
    return new Response(JSON.stringify({ error: "Failed to load board" }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { board } = await req.json();
    if (!board) {
      return new Response(JSON.stringify({ error: "Missing board data" }), {
        status: 400,
      });
    }

    const updated = await TaskBoard.findOneAndUpdate(
      { name: "default" },
      { board },
      { new: true, upsert: true }
    ).lean();

    return new Response(JSON.stringify({ board: updated.board }), {
      status: 200,
    });
  } catch (err) {
    console.error("PUT /api/taskboard error:", err);
    return new Response(JSON.stringify({ error: "Failed to save board" }), {
      status: 500,
    });
  }
}
