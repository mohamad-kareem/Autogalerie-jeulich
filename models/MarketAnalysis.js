import mongoose from "mongoose";

/**
 * A saved purchase evaluation.
 *
 * The full analysis is stored verbatim in `result` so a saved entry can be
 * reopened exactly as it was computed — prices move, portals delete ads, and a
 * re-run weeks later would not reproduce the decision that was actually made.
 * The fields beside it are duplicated only so the list can be rendered and
 * searched without loading every result.
 */
const MarketAnalysisSchema = new mongoose.Schema(
  {
    // One saved entry per ad; saving the same link again updates it.
    listingUrl: { type: String, required: true, index: true },
    marketplace: { type: String, default: "" },

    // Shown in the list.
    title: { type: String, default: "", trim: true, maxlength: 240 },
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    firstRegistration: { type: String, default: "" },
    mileageKm: { type: Number, default: null },

    listPrice: { type: Number, default: null },
    negotiatedPrice: { type: Number, default: null },
    askingPrice: { type: Number, default: null },
    marketValue: { type: Number, default: null },
    maximumPurchasePrice: { type: Number, default: null },
    expectedProfit: { type: Number, default: null },
    verdict: { type: String, default: "" },
    confidence: { type: Number, default: null },

    // The buyer's own notes on this car.
    note: { type: String, default: "", trim: true, maxlength: 2000 },

    // The complete analysis payload, as returned by /api/market-analysis.
    result: { type: mongoose.Schema.Types.Mixed, default: null },

    // The inputs, so reopening can restore the form as it stood.
    inputs: { type: mongoose.Schema.Types.Mixed, default: null },

    savedBy: { type: String, default: "" },
    analyzedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

MarketAnalysisSchema.index({ updatedAt: -1 });

export default mongoose.models.MarketAnalysis ||
  mongoose.model("MarketAnalysis", MarketAnalysisSchema);
