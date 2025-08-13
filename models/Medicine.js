import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    productionTime: { type: String, required: true }, // "3 days"
    employeesRequired: { type: Number, default: 0, min: 0 },
    difficulty: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    ingredients: [{ type: String, trim: true }],
    description: { type: String, required: true },
    status: { type: String, default: "Active Production" },
    batchSize: { type: Number, default: 0, min: 0 },
    qualityControl: { type: String, default: "—" },
    lastProduced: { type: Date, default: Date.now },
    image: { type: String, default: "/B12.png" }, // Cloudinary secure_url
    imagePublicId: { type: String, default: "" }, // Cloudinary public_id
  },
  { timestamps: true }
);

export default mongoose.models.Medicine ||
  mongoose.model("Medicine", MedicineSchema);
