// app/api/log-visit/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import PageVisit from "@/models/PageVisit";

// app/api/log-visit/route.js
export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { path } = await req.json();

    console.log("📍 Logging Visit:", {
      userId: session?.user?.id,
      role: session?.user?.role,
      path,
    });

    await PageVisit.create({
      userId: session?.user?.id || null,
      role: session?.user?.role || "guest",
      path,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
