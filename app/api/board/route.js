import { connectDB } from "@/lib/mongodb";
import Board from "@/models/Board";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    let board = await Board.findOne().sort({ createdAt: -1 });

    if (!board) {
      const defaultBoard = new Board({
        name: "Auto Task Board",
        columns: [
          { name: "Reklamation", tasks: [] },
          { name: "Erledigen", tasks: [] },
          { name: "Hasuna", tasks: [] },
          { name: "Fotos+Inserieren", tasks: [] },
          { name: "VERKAUFT", tasks: [] },
        ],
      });
      await defaultBoard.save();
      return NextResponse.json(defaultBoard);
    }

    // Convert _id to string for all tasks
    const boardData = board.toObject();
    boardData.columns = boardData.columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => ({
        ...task,
        _id: task._id.toString(),
      })),
    }));

    return NextResponse.json(boardData);
  } catch (error) {
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
    if (!board) {
      board = new Board();
    }

    switch (action) {
      case "UPDATE_COLUMNS":
        board.columns = payload.columns;
        break;
      case "ADD_COLUMN":
        board.columns.push({
          name: payload.name,
          tasks: [],
        });
        break;
      case "DELETE_COLUMN":
        board.columns = board.columns.filter(
          (col) => col.name !== payload.columnName
        );
        break;
      case "ADD_TASK": {
        const columnToAdd = board.columns.find(
          (col) => col.name === payload.columnName
        );
        if (columnToAdd) {
          columnToAdd.tasks.push({
            title: payload.title,
            description: payload.description || "",
            completed: false,
            position: columnToAdd.tasks.length,
          });
        }
        break;
      }
      case "UPDATE_TASK": {
        const columnToUpdate = board.columns.find(
          (col) => col.name === payload.columnName
        );
        if (columnToUpdate) {
          const taskToUpdate = columnToUpdate.tasks.find(
            (t) => t._id.toString() === payload.taskId
          );
          if (taskToUpdate) {
            Object.assign(taskToUpdate, payload.updates);
          }
        }
        break;
      }
      case "REMOVE_TASK": {
        const columnToRemoveFrom = board.columns.find(
          (col) => col.name === payload.columnName
        );
        if (columnToRemoveFrom) {
          columnToRemoveFrom.tasks = columnToRemoveFrom.tasks.filter(
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

    // Convert _id to string for all tasks in the response
    const updatedBoard = board.toObject();
    updatedBoard.columns = updatedBoard.columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => ({
        ...task,
        _id: task._id.toString(),
      })),
    }));

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 }
    );
  }
}
