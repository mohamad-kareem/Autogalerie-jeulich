import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout-all
 * Logs the signed-in account out on every device: raising sessionVersion
 * makes every login token issued before invalid (checked in the jwt callback).
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  await connectDB();
  const result = await Admin.updateOne({ _id: session.user.id }, { $inc: { sessionVersion: 1 } });
  if (!result.matchedCount) {
    return Response.json({ error: "Konto nicht gefunden." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
