import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import mongoose from "mongoose"; // ✅ Use this instead of 'mongodb'

export async function POST(req) {
  const { token, password } = await req.json();
  if (!token || !password)
    return Response.json({ error: "Missing fields" }, { status: 400 });

  const { db } = await connectDB();
  const tokenDoc = await db.collection("passwordResetTokens").findOne({
    token,
    used: false,
    expires: { $gt: new Date() },
  });

  if (!tokenDoc) {
    return Response.json(
      { error: "Invalid or expired token" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await db.collection("admins").updateOne(
    { _id: new mongoose.Types.ObjectId(tokenDoc.userId) }, // ✅ fix here
    { $set: { password: hashed } }
  );

  await db
    .collection("passwordResetTokens")
    .updateOne({ _id: tokenDoc._id }, { $set: { used: true } });

  return Response.json({ ok: true });
}
