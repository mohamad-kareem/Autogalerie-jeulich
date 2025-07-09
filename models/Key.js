import mongoose from "mongoose";

const KeySchema = new mongoose.Schema({
  carName: {
    type: String,
    required: true,
  },
  keyNumber: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  numberOfKeys: { type: Number, default: 2 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Key || mongoose.model("Key", KeySchema);
