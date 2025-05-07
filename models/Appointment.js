// models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
  },
  carType: {
    type: String,
    required: [true, "Car type is required"],
    trim: true,
  },
  licensePlate: {
    type: String,
    trim: true,
    uppercase: true,
  },
  reason: {
    type: String,
    required: [true, "Service reason is required"],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, "Appointment date is required"],
  },
  time: {
    type: String,
    required: [true, "Appointment time is required"],
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  notes: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

export default Appointment;
