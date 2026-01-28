import mongoose from "mongoose";

const DashboardNoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 3000 },

    // optional helpers (safe to keep for later)
    pinned: { type: Boolean, default: false },
    createdBy: { type: String, default: "" }, // you can later store admin name/id
  },
  { timestamps: true },
);

export default mongoose.models.DashboardNote ||
  mongoose.model("DashboardNote", DashboardNoteSchema);
