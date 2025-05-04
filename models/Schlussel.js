// File: models/Schlussel.js
import mongoose from "mongoose";

const schlusselSchema = new mongoose.Schema({
  car: { type: String, required: true, index: true },
  schlusselNumber: { type: String, required: true, unique: true },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Schlussel ||
  mongoose.model("Schlussel", schlusselSchema);
