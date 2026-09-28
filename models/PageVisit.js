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

// Visits are kept for 3 days only: MongoDB deletes older ones by itself
// (TTL index, checked about once a minute).
export const VISIT_RETENTION_DAYS = 3;
pageVisitSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: VISIT_RETENTION_DAYS * 24 * 60 * 60 },
);

export default mongoose.models.PageVisit ||
  mongoose.model("PageVisit", pageVisitSchema);
