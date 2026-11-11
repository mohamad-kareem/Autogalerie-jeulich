import mongoose from "mongoose";

const { Schema } = mongoose;

/** Privater Kaufvertrag (TÜV-SÜD-Formular) – the form data plus a few fields for the list */
const PrivateContractSchema = new Schema(
  {
    data: { type: Schema.Types.Mixed, default: {} },
    /** YYYY-MM-DD (date of the seller's signature) */
    date: { type: String, default: "" },
    year: { type: Number, default: null },
    sellerName: { type: String, default: "" },
    buyerName: { type: String, default: "" },
    vehicleName: { type: String, default: "" },
    vin: { type: String, default: "" },
    price: { type: Number, default: 0 },
    /** entry in the Fahrzeugverwaltung (CarSchein) and the website car it was started from */
    scheinId: { type: Schema.Types.ObjectId, ref: "CarSchein", default: null },
    carId: { type: String, default: "" },
    paid: { type: Boolean, default: false },
    /** YYYY-MM-DD */
    paidAt: { type: String, default: "" },
    starred: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    /** last address the contract was e-mailed to */
    mailTo: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

PrivateContractSchema.index({ year: 1, date: -1 });
PrivateContractSchema.index({ vin: 1 });

// A running dev server keeps the old model after a change – recompile when a new field is missing
if (mongoose.models.PrivateContract && !mongoose.models.PrivateContract.schema.path("scheinId")) mongoose.deleteModel("PrivateContract");

export default mongoose.models.PrivateContract || mongoose.model("PrivateContract", PrivateContractSchema);
