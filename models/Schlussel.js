// File: models/Schlussel.js
import mongoose from "mongoose";

// models/Schlussel.js
const schlusselSchema = new mongoose.Schema({
  car: { type: String, default: "" },
  schlusselNumber: {
    type: String,
    unique: true,
    sparse: true, // allow multiple docs without schlusselNumber
    trim: true,
  },
  vinNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  doorNumber: { type: String, default: "" },
  transmission: {
    type: String,
    enum: ["Automatik", "Manuell"],
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
