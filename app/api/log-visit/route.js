import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import PageVisit from "@/models/PageVisit";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { path } = await req.json();

    const userId = session?.user?.id || null;
    const role = session?.user?.role || "guest";

    await PageVisit.create({
      userId,
      role,
      path,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
