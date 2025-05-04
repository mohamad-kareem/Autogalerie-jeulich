import { connectDB } from "@/lib/mongodb";

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  const { db } = await connectDB();
  const tokenDoc = await db.collection("passwordResetTokens").findOne({
    token,
    used: false,
    expires: { $gt: new Date() },
  });

  return Response.json({ valid: !!tokenDoc });
}
