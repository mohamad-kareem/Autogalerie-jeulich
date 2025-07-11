import mongoose from "mongoose";

const CarScheinSchema = new mongoose.Schema(
  {
    carName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    assignedTo: { type: String }, // e.g., Ali the mechanic
    notes: { type: [String] }, // bullet points
    owner: { type: String }, // e.g., Mr. Karim
  },
  { timestamps: true }
);

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
