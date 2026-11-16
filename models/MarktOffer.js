import mongoose from "mongoose";

/**
 * Marktgedächtnis: jedes Angebot, das eine Analyse gesehen hat – nur Fahrzeugdaten
 * und Preise, keine Kontaktdaten. Daraus lernt die Marktanalyse Wertverlust,
 * Standzeit und Preissenkungen je Modell.
 */
const MarktOfferSchema = new mongoose.Schema(
  {
    _id: { type: String }, // "MOBILE_DE:458598805"
    source: { type: String, default: "" },
    scope: { type: String, default: "", index: true }, // marke|modell|kraftstoff|getriebe
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    sellerType: { type: String, default: "UNKNOWN" },
    price: { type: Number, default: null },
    firstPrice: { type: Number, default: null },
    mileageKm: { type: Number, default: null },
    regMonths: { type: Number, default: null },
    powerPs: { type: Number, default: null },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    goneAt: { type: Date, default: null },
    priceDrops: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export default mongoose.models.MarktOffer || mongoose.model("MarktOffer", MarktOfferSchema);
