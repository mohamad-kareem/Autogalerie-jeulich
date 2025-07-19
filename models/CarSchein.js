import mongoose from "mongoose";

const CarScheinSchema = new mongoose.Schema(
  {
    carName: { type: String },
    finNumber: { type: String, unique: true },
    imageUrl: { type: String },
    publicId: { type: String },
    assignedTo: { type: String, default: "" },
    notes: { type: [String], default: [] },
    owner: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
