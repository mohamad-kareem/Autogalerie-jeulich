// File: models/Schlussel.js
import mongoose from "mongoose";

const schlusselSchema = new mongoose.Schema({
  car: { type: String, required: true, index: true },
  schlusselNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  vinNumber: { type: String, default: "" },
  doorNumber: { type: String, default: "" },
  transmission: {
    type: String,
    enum: ["Automatik", "Manuell"],
    required: false,
    default: undefined,
  },
  color: { type: String, default: "" },
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
