import mongoose from "mongoose";

const adminDataSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["contact", "company", "location", "emergency"],
  },
  name: { type: String, required: true },
  phone: String,
  email: String,
  position: String,
  address: String,
  website: String,
  notes: String,
  relation: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

adminDataSchema.index({
  name: "text",
  phone: "text",
  email: "text",
  position: "text",
});

export default mongoose.models.AdminData ||
  mongoose.model("AdminData", adminDataSchema);
