import mongoose from "mongoose";

const TaskBoardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },

    board: {
      columns: {
        type: Object,
        default: {}, // empty
      },
      columnOrder: {
        type: [String],
        default: [], // empty
      },
      tasks: {
        type: Object,
        default: {}, // empty
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.TaskBoard ||
  mongoose.model("TaskBoard", TaskBoardSchema);
