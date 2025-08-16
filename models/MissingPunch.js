// /models/MissingPunch.js
import mongoose from "mongoose";

const missingPunchSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true }, // store startOfDay
    reason: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true }, // human name from header
  },
  { timestamps: true }
);

missingPunchSchema.index({ admin: 1, date: 1 }, { unique: true });

export default mongoose.models.MissingPunch ||
  mongoose.model("MissingPunch", missingPunchSchema);
