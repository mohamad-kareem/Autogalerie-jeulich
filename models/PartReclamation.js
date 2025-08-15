import mongoose from "mongoose";

const PartReclamationSchema = new mongoose.Schema(
  {
    // Core
    partName: { type: String, required: true },
    vehicleId: { type: String, required: true },
    finNumber: { type: String },

    // Quantity & Pricing
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, min: 0, default: 0 },
    totalCost: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "EUR" },

    // Meta
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "ordered", "received", "installed", "returned"],
      default: "pending",
    },

    // Supplier
    supplier: { type: String },

    // Returns
    returnToSupplier: { type: Boolean, default: false },
    returnDate: { type: Date },
    returnReason: { type: String },

    // Optional business dates
    orderDate: { type: Date },
    expectedDelivery: { type: Date },

    // Notes
    notes: { type: String, default: "" },

    // Owner: explicitly one of Karim or Alawie
    owner: {
      type: String,
      enum: ["Karim", "Alawie"],
      required: true,
      index: true,
    },

    // Auditing (keep if you need it for auth logs)
    assignedTo: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Keep total cost in sync
PartReclamationSchema.pre("save", function (next) {
  const qty = Number(this.quantity || 1);
  const price = Number(this.price || 0);
  this.totalCost = qty * price;
  next();
});

export default mongoose.models.PartReclamation ||
  mongoose.model("PartReclamation", PartReclamationSchema);
