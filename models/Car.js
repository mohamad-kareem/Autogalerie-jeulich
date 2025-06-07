import mongoose from "mongoose";

// ⬛ Image Subschema
const imageSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true },
    hash: { type: String, required: true },
  },
  { _id: false }
);

// ⬛ Price Subschema
const priceSchema = new mongoose.Schema(
  {
    consumerPriceGross: { type: String, required: true },
    type: { type: String, required: true },
    currency: { type: String, required: true },
  },
  { _id: false }
);

// ⬛ Main Car Schema
const carSchema = new mongoose.Schema(
  {
    vin: {
      type: String,
      default: null,
    },

    make: { type: String, required: true },
    model: { type: String, required: true },
    modelDescription: { type: String },

    firstRegistration: { type: String },
    mileage: { type: Number },
    power: { type: Number },
    cubicCapacity: { type: Number },
    gearbox: { type: String },
    fuel: { type: String },

    images: { type: [imageSchema], default: [] },
    price: priceSchema,

    category: { type: String },
    climatisation: { type: String },
    airbag: { type: String },
    ambientLighting: { type: Boolean },
    onBoardComputer: { type: Boolean },
    paddleShifters: { type: Boolean },
    usb: { type: Boolean },
    driveType: { type: String },

    consumptions: { type: Object },
    emissions: { type: Object },
    seats: { type: Number },
    doors: { type: String },
    emissionClass: { type: String },
    newHuAu: { type: String },
    fullServiceHistory: { type: Boolean },

    parkingAssistants: { type: [String], default: [] },
    manufacturerColorName: { type: String },
    exteriorColor: { type: String },
    interiorType: { type: String },
    interiorColor: { type: String },

    tintedWindows: { type: Boolean },
    armRest: { type: Boolean },
    heatedWindshield: { type: Boolean },
    electricWindows: { type: Boolean },
    electricTailgate: { type: Boolean },
    electricExteriorMirrors: { type: Boolean },
    foldingExteriorMirrors: { type: Boolean },
    electricAdjustableSeats: { type: Boolean },
    memorySeats: { type: Boolean },
    leatherSteeringWheel: { type: Boolean },
    panoramicGlassRoof: { type: Boolean },
    sunroof: { type: Boolean },
    keylessEntry: { type: Boolean },
    electricHeatedSeats: { type: Boolean },
    centralLocking: { type: Boolean },
    headUpDisplay: { type: Boolean },
    multifunctionalWheel: { type: Boolean },
    powerAssistedSteering: { type: Boolean },

    bluetooth: { type: Boolean },
    cdPlayer: { type: Boolean },
    handsFreePhoneSystem: { type: Boolean },
    wirelessCharging: { type: Boolean },
    navigationSystem: { type: Boolean },
    voiceControl: { type: Boolean },
    touchscreen: { type: Boolean },
    radio: { type: [String], default: [] },

    alarmSystem: { type: Boolean },
    abs: { type: Boolean },
    distanceWarningSystem: { type: Boolean },
    glareFreeHighBeam: { type: Boolean },
    immobilizer: { type: Boolean },
    esp: { type: Boolean },
    highBeamAssist: { type: Boolean },
    speedLimiter: { type: Boolean },
    isofix: { type: Boolean },
    lightSensor: { type: Boolean },
    frontFogLights: { type: Boolean },
    collisionAvoidance: { type: Boolean },
    emergencyCallSystem: { type: Boolean },
    automaticRainSensor: { type: Boolean },
    tirePressureMonitoring: { type: Boolean },
    laneDepartureWarning: { type: Boolean },
    startStopSystem: { type: Boolean },
    tractionControlSystem: { type: Boolean },
    trafficSignRecognition: { type: Boolean },

    daytimeRunningLamps: { type: String },
    headlightType: { type: String },
    bendingLightsType: { type: String },
    headlightWasherSystem: { type: Boolean },

    hasAllSeasonTires: { type: Boolean, default: false },
    summerTires: { type: Boolean },
    winterTires: { type: Boolean },
    alloyWheels: { type: Boolean },
    sportPackage: { type: Boolean },
    sportSeats: { type: Boolean },

    description: { type: String },
  },
  {
    timestamps: true,
  }
);

// ✅ Unique VINs (but allow nulls)
carSchema.index({ vin: 1 }, { unique: true, sparse: true });

// ✅ Fallback compound index for VIN-less duplicates
carSchema.index(
  {
    make: 1,
    model: 1,
    modelDescription: 1,
    mileage: 1,
    firstRegistration: 1,
  },
  { name: "fallback_no_vin_match" }
);

// ✅ Export
export default mongoose.models.Car || mongoose.model("Car", carSchema);
