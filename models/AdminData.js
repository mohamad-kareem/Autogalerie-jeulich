import mongoose from "mongoose";

const adminDataSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["contact", "company", "location", "emergency", "password"],
  },
  name: {
    type: String,
    required: function () {
      // Only require name if not a password type
      return this.type !== "password";
    },
  },
  label: {
    type: String,
    required: function () {
      // Only require label for password type
      return this.type === "password";
    },
  },
  phone: String,
  email: String,
  username: String, // Added for password entries
  password: String, // Added for password entries
  position: String,
  address: String,
  website: String,
  notes: String,
  relation: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update text index to include new fields
adminDataSchema.index({
  name: "text",
  label: "text",
  phone: "text",
  email: "text",
  username: "text",
  position: "text",
});

// Middleware to update the updatedAt field before saving
adminDataSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.AdminData ||
  mongoose.model("AdminData", adminDataSchema);
