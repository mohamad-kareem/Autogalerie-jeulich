import mongoose from "mongoose";

/** Small company-wide settings, one document per key (e.g. "companyLocation"). */
const AppSettingSchema = new mongoose.Schema(
  {
    _id: { type: String },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.AppSetting || mongoose.model("AppSetting", AppSettingSchema);
