// models/TaskBoard.js
import mongoose from "mongoose";

const TaskBoardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    board: {
      columns: {
        type: Object,
        default: {},
      },
      columnOrder: {
        type: [String],
        default: [],
      },
      tasks: {
        type: Object,
        default: {},
      },
    },
  },
  { timestamps: true }
);

// Ensure tasks have color field in the schema
TaskBoardSchema.path("board.tasks").default(() => ({}));

export default mongoose.models.TaskBoard ||
  mongoose.model("TaskBoard", TaskBoardSchema);
