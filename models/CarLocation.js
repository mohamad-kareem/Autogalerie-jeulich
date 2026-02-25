import mongoose from "mongoose";

const CarLocationSchema = new mongoose.Schema(
  {
    startDateTime: { type: Date, default: null },
    endDateTime: { type: Date, default: null },
    vehicleType: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    vehicleId: { type: String, default: "" },
    routeSummary: { type: String, default: "" },
    driverInfo: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.CarLocation ||
  mongoose.model("CarLocation", CarLocationSchema);
