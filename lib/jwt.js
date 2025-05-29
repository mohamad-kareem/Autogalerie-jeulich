import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-strong-secret"; // use a strong value in .env

export function generatePunchToken(adminId) {
  return jwt.sign(
    { adminId },
    JWT_SECRET,
    { expiresIn: "60s" } // 1 minute expiry
  );
}

export function verifyPunchToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
