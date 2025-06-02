import { connectDB } from "@/lib/mongodb";
import ManualCar from "@/models/AddCar";

export async function GET() {
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
