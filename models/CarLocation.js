// models/CarLocation.js
import mongoose from "mongoose";

const CarLocationSchema = new mongoose.Schema(
  {
    // Date of the entry (e.g. when car was parked / moved)
    date: { type: Date },

    // Just store plain strings for now
    carName: { type: String, default: "" },
    finNumber: { type: String, default: "" },

    // Free text for location: e.g. "Halle links", "Parkplatz A3", etc.
    location: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CarLocation ||
  mongoose.model("CarLocation", CarLocationSchema);
