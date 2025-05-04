// models/Entry.js
import mongoose from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    income: { type: Number, default: 0 },
    expense: { type: Number, default: 0 },
    account: String,
    documentType: String,
    documentNumber: String,
    description: { type: String, required: true },
    category: String,
    tax: String,
    carName: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

entrySchema.virtual("balance").get(function () {
  return this.income - this.expense;
});

export default mongoose.models.Entry || mongoose.model("Entry", entrySchema);
