import mongoose from "mongoose";

/** Sätze aus Anzeigen, die nach Mangel klingen, die das Wörterbuch aber noch nicht kennt. */
const MarktHinweisSchema = new mongoose.Schema(
  {
    _id: { type: String }, // normalisierter Satz
    quote: { type: String, default: "" },
    signal: { type: String, default: "" },
    count: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    example: { type: String, default: "" }, // Link zur ersten Anzeige
  },
  { versionKey: false },
);

export default mongoose.models.MarktHinweis || mongoose.model("MarktHinweis", MarktHinweisSchema);
