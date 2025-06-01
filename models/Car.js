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
  vin: { type: String, required: true, unique: true },
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
  newHuAu: { type: String }, // ✅ now accepts "Juli 2026", etc.
  fullServiceHistory: { type: Boolean }, // ✅ extracted from description

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

  summerTires: { type: Boolean }, // ✅ now supported
  winterTires: { type: Boolean }, // ✅ now supported
  alloyWheels: { type: Boolean },
  sportPackage: { type: Boolean },
  sportSeats: { type: Boolean },

  description: { type: String }, // ✅ cleaned plain text description
});

export default mongoose.models.Car || mongoose.model("Car", carSchema);
