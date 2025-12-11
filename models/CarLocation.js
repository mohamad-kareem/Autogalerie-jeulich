// models/CarLocation.js
import mongoose from "mongoose";

const CarLocationSchema = new mongoose.Schema(
  {
    // Beginn & Ende der Fahrt (Datum + Uhrzeit)
    startDateTime: { type: Date },
    endDateTime: { type: Date },

    // Fahrzeugdaten
    vehicleType: { type: String, default: "" }, // PKW, LKW, ...
    // Herst. – hier speichern wir den Namen aus Rotschein (z.B. "VW Golf 1.6")
    manufacturer: { type: String, default: "" },
    // FZ-Ident.Nr – FIN oder Kennzeichen
    vehicleId: { type: String, default: "" },

    // Fahrstrecke + Art der Fahrt in einem Feld:
    // z.B. "Jülich-Aldenhoven-Jülich + Überführungsfahrt"
    routeSummary: { type: String, default: "" },

    // Name und Anschrift des Fahrzeugführers
    driverInfo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.CarLocation ||
  mongoose.model("CarLocation", CarLocationSchema);
