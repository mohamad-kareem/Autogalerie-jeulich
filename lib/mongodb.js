import mongoose from "mongoose";

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return { db: mongoose.connection.db };
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    await mongoose.connection.db
      .collection("passwordResetTokens")
      .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });

    return { db: mongoose.connection.db }; // Ensure db is returned
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};
