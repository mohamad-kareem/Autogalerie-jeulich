import mongoose from "mongoose";

const { Schema } = mongoose;

const VehicleSchema = new Schema(
  {
    brandId: {
      type: String,
      required: true,
      trim: true,
    },

    brandLabel: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, "Die Fahrzeugbezeichnung ist zu lang."],
    },

    fin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, "Die FIN ist zu lang."],
      default: "",
    },
  },
  { _id: false },
);

const BodyworkMarkSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    local: {
      type: [Number],
      required: true,
      default: [0, 0, 0],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 3,
        message: "Die lokale 3D-Position muss aus drei Werten bestehen.",
      },
    },

    normal: {
      type: [Number],
      required: true,
      default: [0, 0, 1],
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 3,
        message: "Die 3D-Normale muss aus drei Werten bestehen.",
      },
    },

    type: {
      type: String,
      enum: [
        "scratch",
        "dent",
        "paint",
        "rust",
        "crack",
        "repair",
        "adjust",
        "polish",
        "other",
      ],
      default: "other",
    },

    action: {
      type: String,
      trim: true,
      default: "",
    },

    panel: {
      type: String,
      trim: true,
      default: "",
    },

    note: {
      type: String,
      trim: true,
      maxlength: [1000, "Die Notiz ist zu lang."],
      default: "",
    },

    price: {
      type: Schema.Types.Mixed,
      default: "",
    },

    size: {
      type: Number,
      min: 0,
      default: 0.06,
    },

    length: {
      type: Number,
      min: 0,
      default: 0.06,
    },

    rotation: {
      type: Number,
      default: 0,
    },

    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const MechanicalTaskSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      trim: true,
      default: "",
    },

    job: {
      type: String,
      required: [true, "Die mechanische Arbeit ist erforderlich."],
      trim: true,
      maxlength: [250, "Die Arbeitsbeschreibung ist zu lang."],
    },

    note: {
      type: String,
      trim: true,
      maxlength: [1000, "Die Notiz ist zu lang."],
      default: "",
    },

    price: {
      type: Schema.Types.Mixed,
      default: "",
    },

    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const WorkshopPhotoSchema = new Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },

    width: {
      type: Number,
      min: 0,
      default: 0,
    },

    height: {
      type: Number,
      min: 0,
      default: 0,
    },

    format: {
      type: String,
      trim: true,
      default: "",
    },

    bytes: {
      type: Number,
      min: 0,
      default: 0,
    },

    originalFilename: {
      type: String,
      trim: true,
      default: "",
    },

    takenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const TotalsSchema = new Schema(
  {
    bodywork: {
      type: Number,
      min: 0,
      default: 0,
    },

    mechanical: {
      type: Number,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const WorkshopInspectionSchema = new Schema(
  {
    vehicle: {
      type: VehicleSchema,
      required: true,
    },

    bodywork: {
      type: [BodyworkMarkSchema],
      default: [],
    },

    mechanicalTasks: {
      type: [MechanicalTaskSchema],
      default: [],
    },

    beforeRepairPhotos: {
      type: [WorkshopPhotoSchema],
      default: [],
    },

    totals: {
      type: TotalsSchema,
      default: () => ({
        bodywork: 0,
        mechanical: 0,
        total: 0,
      }),
    },

    status: {
      type: String,
      enum: ["draft", "in_progress", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

WorkshopInspectionSchema.index(
  {
    "vehicle.fin": 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      "vehicle.fin": {
        $type: "string",
        $ne: "",
      },
    },
  },
);

WorkshopInspectionSchema.index({
  createdAt: -1,
});

WorkshopInspectionSchema.index({
  "vehicle.name": 1,
});

const WorkshopInspection =
  mongoose.models.WorkshopInspection ||
  mongoose.model("WorkshopInspection", WorkshopInspectionSchema);

export default WorkshopInspection;
