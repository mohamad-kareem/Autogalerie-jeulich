// File: models/Schlussel.js
import mongoose from "mongoose";

const schlusselSchema = new mongoose.Schema({
  car: { type: String, required: true, index: true },
  schlusselNumber: { type: String, required: true, unique: true },
  vinNumber: { type: String, default: "" }, // ✅ optional VIN
  doorNumber: { type: String, default: "" }, // ✅ optional door number
  transmission: { type: String, enum: ["Automatik", "Manuell"], default: "" }, // ✅ transmission
  color: { type: String, default: "" }, // ✅ car color
  notes: { type: String, default: "" },
  needsBenzine: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

schlusselSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Schlussel ||
  mongoose.model("Schlussel", schlusselSchema);
