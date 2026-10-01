// models/CarSchein.js
import mongoose from "mongoose";

const ReclamationSchema = new mongoose.Schema(
  {
    date: { type: Date, default: null },
    where: { type: String, default: "" },
    what: { type: String, default: "" },
    cost: { type: Number, default: null },
  },
  { _id: false },
);

const StageMetaSchema = new mongoose.Schema(
  {
    werkstatt: {
      where: { type: String, default: "" },
      what: { type: String, default: "" },
    },
    platz: {
      note: { type: String, default: "" },
      // TÜV while the car stands in Boora: has it one, and until when ("2027-05").
      hasTuev: { type: Boolean, default: false },
      tuevUntil: { type: String, default: "" },
    },
    tuev: {
      passed: { type: Boolean, default: false },

      issues: {
        type: [String],
        default: [],
      },
    },
  },
  { _id: false },
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
    boughtAt: { type: Date, default: null },
    // number of previous owners (Vorbesitzer); null = not entered
    vorbesitzer: { type: Number, default: null, min: 0, max: 99 },
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
    rotPlateNumber: {
      type: String,
      enum: ["", "DN-06919", "DN-06921", "BEIDE"],
      default: "",
    },

    // ✅ NEW: permanent Rotbuch numbers (1-20), tracked separately per plate
    // so a car assigned to "BEIDE" can hold a different number in each book.
    rotbuchNumber19: {
      type: Number,
      default: null,
      min: 1,
      max: 20,
    },
    rotbuchNumber21: {
      type: Number,
      default: null,
      min: 1,
      max: 20,
    },

    dashboardHidden: { type: Boolean, default: false },

    soldAt: { type: Date, default: null },
    tuvTasks: {
      type: [String],
      default: [],
    },
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
  { timestamps: true },
);

// In development a model loaded before this change stays in memory and
// would drop the new TÜV fields; replace it.
if (
  mongoose.models.CarSchein &&
  (!mongoose.models.CarSchein.schema.path("stageMeta")?.schema?.path("platz.tuevUntil") ||
    !mongoose.models.CarSchein.schema.path("vorbesitzer"))
) {
  mongoose.deleteModel("CarSchein");
}

export default mongoose.models.CarSchein ||
  mongoose.model("CarSchein", CarScheinSchema);
