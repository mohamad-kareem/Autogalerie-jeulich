import mongoose from "mongoose";

const CarLocationSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      default: "DN-06919",
      index: true,
    },

    startDateTime: { type: Date, default: null },
    endDateTime: { type: Date, default: null },
    vehicleType: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    vehicleId: { type: String, default: "" },
    routeSummary: { type: String, default: "" },
    driverInfo: { type: String, default: "" },

    // Rotbuch-Nr. the trip was entered with. Kept with the trip so that
    // resetting a book (new numbers for the cars) does not change old trips.
    rotbuchNumber: { type: Number, default: null },

    marked: {
      type: Boolean,
      default: false,
    },

    markNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.models.CarLocation ||
  mongoose.model("CarLocation", CarLocationSchema);
