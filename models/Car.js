// models/Car.js

import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  ref: { type: String, required: true },
  hash: { type: String, required: true },
});

const priceSchema = new mongoose.Schema({
  consumerPriceGross: { type: String, required: true },
  type: { type: String, required: true },
  currency: { type: String, required: true },
});

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  modelDescription: { type: String },
  firstRegistration: { type: String },
  mileage: { type: Number },
  vin: { type: String },
  power: { type: Number },
  gearbox: { type: String },
  fuel: { type: String },
  images: { type: [imageSchema], default: [] },
  price: priceSchema,
});

export default mongoose.models.Car || mongoose.model("Car", carSchema);
