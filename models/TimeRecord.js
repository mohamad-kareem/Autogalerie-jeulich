// ✅ Optimized TimeRecord Model (models/TimeRecord.js)
import mongoose from "mongoose";

const timeRecordSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
      index: true,
    },
    time: {
      type: Date,
      default: Date.now,
      index: true,
    },
    location: {
      lat: Number,
      lng: Number,
      verified: Boolean,
      distance: Number,
    },
    method: { type: String, enum: ["qr", "manual"], default: "manual" },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

timeRecordSchema.index({ admin: 1, time: -1 });
timeRecordSchema.index({ time: -1 });
timeRecordSchema.index({ type: 1, time: -1 });

export default mongoose.models.TimeRecord ||
  mongoose.model("TimeRecord", timeRecordSchema);
