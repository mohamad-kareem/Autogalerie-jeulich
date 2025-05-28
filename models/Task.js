import mongoose from "mongoose"; // ✅ REQUIRED

const taskSchema = new mongoose.Schema({
  car: {
    type: String,
    required: [true, "Car is required"],
  },
  needs: {
    type: String,
    enum: [
      "Reklamation",
      "Abmelden",
      "Neu Gekauft",
      "Erledigen",
      "Termin",
      "Hassuna",
      "Fotos+inserieren",
      "Kunden",
      "verkauft",
    ],
    default: "Neu Gekauft",
  },
  description: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["todo", "in_progress", "done"],
    default: "todo",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
