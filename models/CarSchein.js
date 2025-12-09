// models/CarSchein.js
import mongoose from "mongoose";

const CarScheinSchema = new mongoose.Schema(
  {
    carName: { type: String },
    finNumber: { type: String, unique: true },
    imageUrl: { type: String },
    publicId: { type: String },

    // Aufgaben
    notes: { type: [String], default: [] },
    completedTasks: { type: [String], default: [] },

    owner: { type: String, default: "" },

    // Schlüssel-Felder
    keyNumber: { type: String, default: "" },
    keyCount: { type: Number, default: 2 },
    keyColor: { type: String, default: "#000000" },
    keySold: { type: Boolean, default: false },
    keyNote: { type: String, default: "" },

    // Tankstatus
    fuelNeeded: { type: Boolean, default: false },

    // Rotkennzeichen (rotes Kennzeichen)
    rotKennzeichen: { type: Boolean, default: false },

    // Nur für Dashboard (ob Karte ausgeblendet ist)
    dashboardHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
