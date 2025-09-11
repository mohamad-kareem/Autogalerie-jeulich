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
    agreements: String,
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
  },
  { timestamps: true }
);

export default mongoose.models.Kaufvertrag ||
  mongoose.model("Kaufvertrag", KaufvertragSchema);
