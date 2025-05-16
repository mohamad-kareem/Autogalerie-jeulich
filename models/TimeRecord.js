import mongoose from "mongoose";

const timeRecordSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    time: {
      type: Date,
      default: Date.now,
    },
    location: {
      lat: Number,
      lng: Number,
      verified: Boolean,
      distance: Number,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
  },
  { timestamps: true }
);

const TimeRecord =
  mongoose.models.TimeRecord || mongoose.model("TimeRecord", timeRecordSchema);
export default TimeRecord;
