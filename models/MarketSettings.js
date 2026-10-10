import mongoose from "mongoose";

/**
 * Company settings for the purchase analysis (lib/market/settings.js):
 * margin per price class, the yard's location for the pickup, pickup cost
 * rates, sale discount, default analysis depth. One document, key "default".
 */
const MarketSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    profitBands: { type: mongoose.Schema.Types.Mixed, default: [] },
    origin: { type: mongoose.Schema.Types.Mixed, default: null },
    inboundMode: { type: String, default: "TRAIN" },
    hourlyRate: { type: Number },
    onSiteMinutes: { type: Number },
    fuelLitresPer100Km: { type: Number },
    fuelPricePerLitre: { type: Number },
    saleDiscountPercent: { type: Number },
    defaultDepth: { type: String, default: "NORMAL" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.MarketSettings ||
  mongoose.model("MarketSettings", MarketSettingsSchema);
