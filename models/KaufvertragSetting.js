import mongoose from "mongoose";

/** Small key/value store for the Kaufverträge, e.g. "nextSeq:karim:2026" → 114. */
const KaufvertragSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.KaufvertragSetting ||
  mongoose.model("KaufvertragSetting", KaufvertragSettingSchema);
