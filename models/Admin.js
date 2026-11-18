// ✅ Optimized Admin Model (models/Admin.js)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"], // ✅ Allow both roles
      default: "user", // ✅ Default can stay as "user"
    },
    image: {
      type: String,
      default: "",
    },
    lastLogin: Date,
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentStatus: {
      type: String,
      enum: ["in", "out"],
      default: "out",
      index: true,
    },
    deviceId: {
      type: String,
      unique: true,
      sparse: true, // only some admins will have this
    },
    lastPunch: Date,
    // Raised by "Auf allen Geräten abmelden" (api/auth/logout-all). Login and the
    // session check both compare it – without this field the login read 0 while the
    // database had e.g. 1, so every login was thrown out right away.
    sessionVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// In development a model loaded before this change stays in memory without
// sessionVersion; replace it.
if (mongoose.models.Admin && !mongoose.models.Admin.schema.path("sessionVersion")) {
  mongoose.deleteModel("Admin");
}

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);
