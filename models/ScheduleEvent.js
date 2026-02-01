import mongoose from "mongoose";

const ScheduleEventSchema = new mongoose.Schema(
  {
    createdBy: { type: String, default: "" }, // optional (admin email/id)
    day: {
      type: String,
      enum: ["mon", "tue", "wed", "thu", "fri", "sat"],
      required: true,
    },
    startMin: { type: Number, required: true }, // minutes in day
    endMin: { type: Number, required: true }, // minutes in day
    title: { type: String, required: true, trim: true, maxlength: 500 },
    variant: {
      type: String,
      enum: ["red", "yellow", "green"],
      default: "green",
    },
  },
  { timestamps: true },
);

export default mongoose.models.ScheduleEvent ||
  mongoose.model("ScheduleEvent", ScheduleEventSchema);
