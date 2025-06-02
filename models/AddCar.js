import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    // Basic Information
    name: { type: String, required: true },
    make: { type: String, required: true },
    vin: { type: String },
    model: { type: String, required: true },
    price: { type: Number, required: true },
    registration: { type: String },
    kilometers: { type: Number },
    power: { type: Number },
    hp: { type: Number },
    fuel: { type: String },
    condition: { type: String },
    status: { type: String },
    accidentFree: { type: Boolean, default: false },
    operational: { type: Boolean, default: true },
    category: { type: String },
    active: { type: Boolean, default: true },

    // Technical Specifications
    modelSeries: { type: String },
    equipmentLine: { type: String },
    displacement: { type: String },
    seats: { type: Number },
    doors: { type: String },
    emissionClass: { type: String },
    environmentalBadge: { type: String },
    previousOwners: { type: Number },
    inspectionDate: { type: String },
    cylinders: { type: Number },
    tankCapacity: { type: String },
    driveType: { type: String },
    energyConsumption: { type: String },
    co2Emission: { type: String },
    fuelConsumption: { type: String },
    weight: { type: String },
    towCapacityBraked: { type: String },
    towCapacityUnbraked: { type: String },
    transmission: { type: String },

    // Features & Equipment
    features: { type: [String], default: [] },
    specialFeatures: { type: [String], default: [] },
    airConditioning: { type: String },
    parkingAssistance: { type: String },
    airbags: { type: String },

    // Appearance
    exteriorColor: { type: String },
    exteriorColorSimple: { type: String },
    interiorColor: { type: String },
    interiorMaterial: { type: String },
    interiorColorSimple: { type: String },

    // Description & Images
    description: { type: String },
    hasEngineDamage: { type: Boolean, default: false },
    images: { type: [String], default: [] },

    contact: {
      fullName: { type: String, required: true },
      email: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, "Ungültige E-Mail-Adresse"],
      },
      phone: { type: String, required: true },
    },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Slug generation middleware
carSchema.pre("save", function (next) {
  if (!this.isModified("name") && !this.isModified("model")) return next();

  const baseSlug = `${this.name} ${this.model}`
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-");

  this.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
  next();
});

export default mongoose.models.ManualCar ??
  mongoose.model("ManualCar", carSchema);
