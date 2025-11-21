// models/CarSchein.js
import mongoose from "mongoose";

const CarScheinSchema = new mongoose.Schema(
  {
    carName: { type: String },
    finNumber: { type: String, unique: true },
    imageUrl: { type: String },
    publicId: { type: String },
    notes: { type: [String], default: [] },
    owner: { type: String, default: "" },

    // Schlüssel-Felder
    keyNumber: { type: String, default: "" }, // z.B. "99"
    keyCount: { type: Number, default: 2 }, // 1 oder 2
    keyColor: { type: String, default: "#000000" }, // Farbcodierung
    keySold: { type: Boolean, default: false }, // Fahrzeug verkauft?
    keyNote: { type: String, default: "" }, // Notiz zum Schlüssel

    // Tankstatus
    fuelNeeded: { type: Boolean, default: false }, // Tank leer / muss aufgefüllt werden?

    // 🔹 Nur für Dashboard (ob Karte ausgeblendet ist)
    dashboardHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
