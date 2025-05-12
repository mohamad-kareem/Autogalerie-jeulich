import mongoose from "mongoose";

const PlateUsageSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  employeeName: { type: String, required: true },
  destination: { type: String, required: true },
  purpose: { type: String },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  notes: { type: String },
  status: { type: String, enum: ["active", "returned"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.PlateUsage ||
  mongoose.model("PlateUsage", PlateUsageSchema);
