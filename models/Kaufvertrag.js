import mongoose from "mongoose";

const KaufvertragSchema = new mongoose.Schema(
  {
    issuer: String,
    buyerName: String,
    buyerStreet: String,
    buyerCity: String,
    invoiceNumber: String,
    invoiceDate: String,
    idNumber: String,
    phone: String,
    email: String,
    carType: String,
    vin: String,
    firstRegistration: String,
    mileage: String,
    warranty: String,
    agreements: {
      type: [String], // ✅ array of strings
      default: [],
    },
    kfzBrief: Boolean,
    kfzSchein: Boolean,
    tuev: String,
    keys: Number,
    total: Number,
    downPayment: Number,
    paymentNote: String,
    starred: {
      type: Boolean,
      default: false,
    },
    originalInvoiceNumber: {
      type: String,
      default: null,
    },
    ignored: {
      type: Boolean,
      default: false,
    },
    originalInvoiceNumberX: {
      type: String,
      default: null,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Kaufvertrag",
    }, // ✅ ← Add this

    /* ── Händlerportal (Autocenter workflow) – all optional, old contracts keep working ── */
    paid: { type: Boolean, default: undefined },
    paidAt: { type: String, default: "" },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, default: "" },
    cancelReason: { type: String, default: "" },
    createdBy: { type: String, default: "" },
    stamp: { type: Boolean, default: false }, // company stamp next to the seller's signature
    log: {
      type: [
        {
          at: { type: Date, default: Date.now },
          by: { type: String, default: "" },
          action: { type: String, default: "" },
          _id: false,
        },
      ],
      default: undefined,
    },
  },
  { timestamps: true }
);

// Dev hot reload: recompile the model when new fields were added.
if (mongoose.models.Kaufvertrag && !mongoose.models.Kaufvertrag.schema.path("stamp")) {
  mongoose.deleteModel("Kaufvertrag");
}

export default mongoose.models.Kaufvertrag ||
  mongoose.model("Kaufvertrag", KaufvertragSchema);
