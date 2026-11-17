import { connectDB } from "@/lib/mongodb";
import ManualCar from "@/models/AddCar";
import { staffUser } from "@/lib/kaufvertragServer";

export async function GET() {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    await connectDB();
    const cars = await ManualCar.find().sort({ createdAt: -1 }).lean();
    return new Response(JSON.stringify(cars), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch cars" }), {
      status: 500,
    });
  }
}
