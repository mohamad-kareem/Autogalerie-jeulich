import mongoose from "mongoose";

const CarScheinSchema = new mongoose.Schema(
  {
    carName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    assignedTo: { type: String, default: "" },
    notes: { type: [String], default: [] },
    owner: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
