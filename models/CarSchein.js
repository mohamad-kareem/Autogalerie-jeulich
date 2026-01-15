// models/CarSchein.js
import mongoose from "mongoose";

const ReclamationSchema = new mongoose.Schema(
  {
    date: { type: Date, default: null },
    where: { type: String, default: "" },
    what: { type: String, default: "" },
    cost: { type: Number, default: null },
  },
  { _id: false }
);

const StageMetaSchema = new mongoose.Schema(
  {
    werkstatt: {
      where: { type: String, default: "" },
      what: { type: String, default: "" },
    },
    platz: {
      note: { type: String, default: "" },
    },
    tuev: {
      passed: { type: Boolean, default: false },
      issue: { type: String, default: "" },
    },
  },
  { _id: false }
);

const CarScheinSchema = new mongoose.Schema(
  {
    carName: { type: String, trim: true, default: "" },

    finNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: "",
    },

    owner: { type: String, trim: true, default: "" },

    imageUrl: { type: String, default: null },
    publicId: { type: String, default: null },

    notes: { type: [String], default: [] },
    completedTasks: { type: [String], default: [] },

    keyNumber: { type: String, default: "" },
    keyCount: { type: Number, default: 2 },
    keyColor: { type: String, default: "#000000" },
    keySold: { type: Boolean, default: false },
    keyNote: { type: String, default: "" },

    fuelNeeded: { type: Boolean, default: false },
    rotKennzeichen: { type: Boolean, default: false },
    dashboardHidden: { type: Boolean, default: false },

    soldAt: { type: Date, default: null },

    // ✅ NEW: link to existing ContactCustomer (no re-save)
    soldContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactCustomer",
      default: null,
    },

    reclamations: { type: [ReclamationSchema], default: [] },

    stage: {
      type: String,
      enum: ["WERKSTATT", "AUFBEREITUNG", "PLATZ", "TUEV", "SOLD"],
      default: "WERKSTATT",
    },
    stageMeta: { type: StageMetaSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
