// pages/api/board.js   (or app/api/board/route.js in Next 13+)
// handles both GET and POST

import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    let board = await Board.findOne().sort({ createdAt: -1 });

    if (!board) {
      // create default if none exists
      board = new Board({
        name: "Auto Task Board",
        columns: [
          { name: "Reklamation", tasks: [] },
          { name: "Erledigen", tasks: [] },
          { name: "Hasuna", tasks: [] },
          { name: "Fotos+Inserieren", tasks: [] },
          { name: "VERKAUFT", tasks: [] },
        ],
      });
      await board.save();
    }

    // stringify ObjectIds
    const boardData = board.toObject();
    boardData.columns = boardData.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((task) => ({
        ...task,
        _id: task._id.toString(),
      })),
    }));

    return NextResponse.json(boardData);
  } catch (error) {
    console.error("GET /api/board error:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { action, payload } = await request.json();

    let board = await Board.findOne().sort({ createdAt: -1 });
    if (!board) board = new Board();

    switch (action) {
      case "UPDATE_COLUMNS":
        board.columns = payload.columns;
        break;

      case "ADD_COLUMN":
        board.columns.push({ name: payload.name, tasks: [] });
        break;

      case "DELETE_COLUMN":
        board.columns = board.columns.filter(
          (col) => col.name !== payload.columnName
        );
        break;

      case "ADD_TASK": {
        const col = board.columns.find((c) => c.name === payload.columnName);
        if (col) {
          col.tasks.push({
            title: payload.title,
            description: payload.description || "",
            completed: false,
            position: col.tasks.length,
            color: payload.color || "gray", // ← include color
          });
        }
        break;
      }

      case "UPDATE_TASK": {
        const col = board.columns.find((c) => c.name === payload.columnName);
        if (col) {
          const task = col.tasks.find(
            (t) => t._id.toString() === payload.taskId
          );
          if (task) {
            Object.assign(task, payload.updates);
          }
        }
        break;
      }

      case "REMOVE_TASK": {
        const col = board.columns.find((c) => c.name === payload.columnName);
        if (col) {
          col.tasks = col.tasks.filter(
            (t) => t._id.toString() !== payload.taskId
          );
        }
        break;
      }

      case "UPDATE_BOARD_NAME":
        board.name = payload.name;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await board.save();

    // respond with fresh data
    const updated = board.toObject();
    updated.columns = updated.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((task) => ({
        ...task,
        _id: task._id.toString(),
      })),
    }));

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/board error:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
}
