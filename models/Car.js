import mongoose from "mongoose";

const { Schema } = mongoose;

const CarSchema = new Schema(
  {
    mobileAdId: { type: String, unique: true, index: true },
    mobileSellerId: String,
    make: String,
    model: String,
    modelDescription: String,

    // store price as-is, whatever shape mobile.de gives
    price: { type: Schema.Types.Mixed },

    // simple array of { ref: string }
    images: [{ ref: String }],

    // unique slug so you can link by /slug
    slug: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.models.Car || mongoose.model("Car", CarSchema);
