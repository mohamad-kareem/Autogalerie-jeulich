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
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      verified: { type: Boolean, default: false },
      distance: Number,
    },
    method: {
      type: String,
      enum: ["qr", "manual", "device"],
      required: true,
      default: "manual",
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceId: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
timeRecordSchema.index({ admin: 1, time: -1 });
timeRecordSchema.index({ time: -1 });
timeRecordSchema.index({ type: 1, time: -1 });
timeRecordSchema.index({ "location.verified": 1 });

// Virtuals
timeRecordSchema.virtual("formattedTime").get(function () {
  return this.time.toLocaleString("de-DE");
});

export default mongoose.models.TimeRecord ||
  mongoose.model("TimeRecord", timeRecordSchema);
