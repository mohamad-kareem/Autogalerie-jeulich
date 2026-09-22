import mongoose from "mongoose";

/**
 * One sighting of an ad's price.
 *
 * Every analysis records what the ad asked at that moment. Checked again a
 * week later, the ad's price history is there: "10.300 € am 12.09., heute
 * 9.800 €" — a seller who has already come down once usually comes down again.
 *
 * Small on purpose: an ad, a price, a date. Repeated checks at an unchanged
 * price on the same day are not stored twice.
 */
const PriceObservationSchema = new mongoose.Schema(
  {
    listingUrl: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    source: { type: String, default: "" },
    observedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

PriceObservationSchema.index({ listingUrl: 1, observedAt: 1 });

export default mongoose.models.PriceObservation ||
  mongoose.model("PriceObservation", PriceObservationSchema);
