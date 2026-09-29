import mongoose from "mongoose";

const InventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    condition: { type: String, trim: true, maxlength: 60, default: "" },
    purchasePrice: { type: Number, min: 0, default: null },
    supplier: { type: String, trim: true, maxlength: 120, default: "" },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true },
);

export default mongoose.models.InventoryItem || mongoose.model("InventoryItem", InventoryItemSchema);
