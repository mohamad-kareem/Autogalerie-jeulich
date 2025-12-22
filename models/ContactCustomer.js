import mongoose from "mongoose";

const ContactCustomerSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },

    phone: String,
    email: String,

    street: String,
    postalCode: String,
    city: String,

    carName: String,
    vin: String,
    firstRegistration: String,

    source: {
      type: String,
      enum: ["kaufvertrag", "manual"],
      default: "manual",
    },

    note: String,
  },
  { timestamps: true }
);

export default mongoose.models.ContactCustomer ||
  mongoose.model("ContactCustomer", ContactCustomerSchema);
