import mongoose from "mongoose";

// One shared connection per server instance. Requests that arrive while it is
// still connecting wait for the same attempt instead of running into a half-open
// connection; a failed attempt is not cached, so the next request tries again.
let pending = null;

async function open() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });
  console.log("✅ MongoDB connected");

  // TTL index for password-reset tokens – must never make the request fail
  mongoose.connection.db
    .collection("passwordResetTokens")
    .createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
    .catch((error) => console.warn("passwordResetTokens index:", error?.message));
}

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return { db: mongoose.connection.db };
  }

  if (!pending) {
    pending = open()
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        throw new Error("Failed to connect to MongoDB");
      })
      .finally(() => {
        pending = null;
      });
  }
  await pending;
  return { db: mongoose.connection.db }; // Ensure db is returned
};
