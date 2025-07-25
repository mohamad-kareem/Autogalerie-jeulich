import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    type: {
      type: String,
      required: true,
      enum: ["official", "unofficial"],
      default: "official",
    },
    dateSoldIn: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v <= new Date();
        },
        message: "Date sold in cannot be in the future",
      },
    },
    reclamation: {
      type: String,
      trim: true,
    },
    needsBeforeSelling: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for better query performance
vehicleSchema.index({ createdBy: 1, type: 1 });
vehicleSchema.index({ createdBy: 1, vin: 1 }, { unique: true });

export default mongoose.models.Vehicle ||
  mongoose.model("Vehicle", vehicleSchema);
