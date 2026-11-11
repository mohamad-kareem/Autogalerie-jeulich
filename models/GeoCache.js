import mongoose from "mongoose";

/**
 * Cache for addresses (geo:<address> → lat/lon) and driving times (route:<from>|<to> → minutes/km),
 * so the free map services are asked only once per address.
 */
const GeoCacheSchema = new mongoose.Schema(
  {
    _id: { type: String },
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
    minutes: { type: Number, default: null },
    km: { type: Number, default: null },
    /** true when the address could not be found */
    missing: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.GeoCache || mongoose.model("GeoCache", GeoCacheSchema);
