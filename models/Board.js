import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  position: { type: Number, required: true },
});

const columnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tasks: [taskSchema],
});

const boardSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "Auto Task Board" },
  columns: [columnSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

boardSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Board || mongoose.model("Board", boardSchema);
