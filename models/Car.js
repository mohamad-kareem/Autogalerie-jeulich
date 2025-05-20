// models/Car.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const CarSchema = new Schema(
  {
    mobileAdId: { type: String, unique: true, index: true },
    mobileSellerId: String,
    make: String,
    model: String,
    modelDescription: String,
    slug: { type: String, unique: true, sparse: true },

    // Basic vehicle data
    firstRegistration: Date, // Erstzulassung
    mileage: Number, // Kilometerstand
    previousOwners: Number, // Anzahl der Fahrzeughalter
    category: String, // Kategorie
    series: String, // Baureihe
    equipmentLine: String, // Ausstattungslinie

    // Engine & performance
    engineDisplacement: Number, // Hubraum in cm³
    powerKW: Number, // kW
    powerPS: Number, // PS
    cylinders: Number, // Zylinder
    drivetrain: String, // Antriebsart
    gearbox: String, // Getriebe

    // Fuel & emissions
    fuel: String, // Kraftstoffart
    consumptionCombined: Number, // l/100km
    co2Emissions: Number, // g/km
    emissionClass: String, // Schadstoffklasse
    environmentBadge: String, // Umweltplakette

    // Pricing
    priceGross: Number, // consumerPriceGross
    currency: String, // EUR
    vatRate: Number, // VAT Rate %

    // Technical inspections & documents
    nextInspection: Date, // HU
    serviceHistory: String, // Scheckheftgepflegt etc.

    // Comfort & safety
    seats: Number, // Anzahl Sitzplätze
    doors: Number, // Anzahl Türen
    airConditioning: String, // Klimatisierung
    airbags: [String], // Airbags
    abs: Boolean, // ABS
    esp: Boolean, // ESP
    tractionControl: Boolean, // ASR
    centralLocking: Boolean, // Zentralverriegelung
    alarm: Boolean, // Wegfahrsperre
    cruiseControl: Boolean, // Tempomat

    // Colors & interior
    colorExterior: String, // Farbe
    colorInterior: String, // Innenausstattung

    // Capacity
    tankCapacity: Number, // Tankgröße in l

    // Media & extras
    radio: String, // Tuner/Radio
    cdPlayer: Boolean, // CD-Spieler
    fogLights: Boolean, // Nebelscheinwerfer
    multifunctionSteering: Boolean, // Multifunktionslenkrad

    // Images & raw equipment list
    images: [{ ref: String }],
    equipmentList: [String], // raw list of Ausstattung
  },
  { timestamps: true }
);

export default mongoose.models.Car || mongoose.model("Car", CarSchema);
