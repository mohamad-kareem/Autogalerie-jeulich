import mongoose from "mongoose";

const { Schema } = mongoose;

/** A bought car that still has to be picked up (or that the seller brings). */
const PickupSchema = new Schema(
  {
    vehicle: {
      name: { type: String, default: "" },
      brand: { type: String, default: "" },
      model: { type: String, default: "" },
      firstRegistration: { type: String, default: "" },
      mileage: { type: Number, default: null },
      fuel: { type: String, default: "" },
      power: { type: String, default: "" },
      gearbox: { type: String, default: "" },
      tuevUntil: { type: String, default: "" },
      owners: { type: Number, default: null },
      vin: { type: String, default: "" },
      color: { type: String, default: "" },
      details: { type: String, default: "" },
      image: { type: String, default: "" },
      url: { type: String, default: "" },
      adPrice: { type: Number, default: null },
    },
    seller: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      street: { type: String, default: "" },
      zip: { type: String, default: "" },
      city: { type: String, default: "" },
    },
    price: { type: Number, default: 0 },
    payment: { type: String, enum: ["transfer", "cash"], default: "transfer" },
    /** pickup = we collect the car · delivery = the seller brings it */
    mode: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
    date: { type: String, default: "" }, // YYYY-MM-DD
    time: { type: String, default: "" }, // HH:MM
    redPlate: { type: String, default: "" },
    registered: { type: Boolean, default: false },
    driver: { type: String, default: "" },
    note: { type: String, default: "", maxlength: 2000 },

    status: { type: String, enum: ["open", "done"], default: "open", index: true },
    doneAt: { type: Date, default: null },
    doneBy: { type: String, default: "" },
    /** the car in the Fahrzeugverwaltung once it is there */
    vehicleId: { type: Schema.Types.ObjectId, ref: "CarSchein", default: null },

    emailTo: { type: String, default: "" },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

PickupSchema.index({ status: 1, date: 1 });

export default mongoose.models.Pickup || mongoose.model("Pickup", PickupSchema);
