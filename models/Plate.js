import mongoose from "mongoose";

const PlateSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["Karim", "Alawie"],
    default: "Alawie",
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Plate || mongoose.model("Plate", PlateSchema);
