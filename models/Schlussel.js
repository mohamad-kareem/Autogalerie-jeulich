// File: models/Schlussel.js
import mongoose from "mongoose";

const schlusselSchema = new mongoose.Schema({
  car: { type: String, required: true, index: true },
  schlusselNumber: { type: String, required: true, unique: true },
  notes: String,
  needsBenzine: { type: Boolean, default: false }, // Added this line
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Add a pre-save hook to update the updatedAt field
schlusselSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Schlussel ||
  mongoose.model("Schlussel", schlusselSchema);
