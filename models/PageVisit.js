// models/PageVisit.js
import mongoose from "mongoose";

const pageVisitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // or "User" depending on your schema
      required: false,
    },
    role: { type: String, enum: ["admin", "user", "guest"], default: "guest" },
    path: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PageVisit ||
  mongoose.model("PageVisit", pageVisitSchema);
