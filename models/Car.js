import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String },
    subtitle: { type: String, default: "" },
    price: { type: Number },
    registration: { type: String, required: false },
    kilometers: { type: Number },
    power: { type: Number },
    hp: { type: Number },
    fuel: { type: String },
    condition: { type: String },
    status: { type: String },
    accidentFree: { type: Boolean, default: false },
    operational: { type: Boolean, default: true },
    category: { type: String },

    // **Active flag** – only active cars are shown to the public
    active: { type: Boolean, default: true },

    // Technical Specifications
    modelSeries: String,
    model: String,
    equipmentLine: String,
    displacement: String,
    seats: Number,
    doors: String,
    emissionClass: String,
    environmentalBadge: String,
    previousOwners: Number,
    inspectionDate: String,
    cylinders: Number,
    tankCapacity: String,
    driveType: String,
    energyConsumption: String,
    co2Emission: String,
    fuelConsumption: String,
    weight: String,
    towCapacityBraked: String,
    towCapacityUnbraked: String,
    transmission: String,

    // Features & Equipment
    features: [String],
    specialFeatures: [String],
    airConditioning: String,
    parkingAssistance: String,
    airbags: String,

    // Appearance
    exteriorColor: String,
    exteriorColorSimple: String,
    interiorColor: String,
    interiorMaterial: String,
    interiorColorSimple: String,

    // Description & Images
    description: String,
    hasEngineDamage: { type: Boolean, default: false },
    images: [String],

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Slug middleware (unchanged)
carSchema.pre("save", function (next) {
  if (!this.isModified("name")) return next();
  const baseSlug = `${this.name} ${this.model}`
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");
  this.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
  next();
});

export default mongoose.models.Car || mongoose.model("Car", carSchema);
