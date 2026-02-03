import mongoose from "mongoose";

const ScheduleEventSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri", "sat"],
      required: true,
      index: true,
    },
    startMin: { type: Number, required: true }, // minutes in day
    endMin: { type: Number, required: true }, // minutes in day
    title: { type: String, required: true, trim: true, maxlength: 500 },
    variant: {
      type: String,
      enum: ["red", "yellow", "green"],
      default: "green",
      index: true,
    },
  },
  { timestamps: true },
);

// Helpful compound index for sorting + faster queries
ScheduleEventSchema.index({ day: 1, startMin: 1 });

export default mongoose.models.ScheduleEvent ||
  mongoose.model("ScheduleEvent", ScheduleEventSchema);
