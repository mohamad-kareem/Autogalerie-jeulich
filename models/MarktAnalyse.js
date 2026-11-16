import mongoose from "mongoose";

/** Eine gespeicherte Marktanalyse (Fahrzeug, Bericht und – wenn gekauft – der Kaufpreis). */
const MarktAnalyseSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    source: { type: String, default: "" },
    listingId: { type: String, default: "", index: true },
    title: { type: String, default: "" },
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    image: { type: String, default: "" },
    ask: { type: Number, default: null },
    verdict: { type: String, default: "" },
    headline: { type: String, default: "" },
    marketValue: { type: Number, default: null },
    limit: { type: Number, default: null },
    subject: { type: mongoose.Schema.Types.Mixed, default: null },
    report: { type: mongoose.Schema.Types.Mixed, default: null },
    aiSummary: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    // Vom Händler im Bericht eingetragen: "Gekauft" mit Kaufpreis.
    feedback: {
      boughtAt: { type: Date, default: null },
      boughtPrice: { type: Number, default: null },
      boughtBy: { type: String, default: "" },
    },
  },
  { timestamps: true },
);
MarktAnalyseSchema.index({ createdAt: -1 });

export default mongoose.models.MarktAnalyse || mongoose.model("MarktAnalyse", MarktAnalyseSchema);
