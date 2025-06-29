import { connectDB } from "@/lib/mongodb";
import PlateUsage from "@/models/PlateUsage";

export async function GET() {
  try {
    await connectDB();
    const usage = await PlateUsage.find({}).sort({ startTime: -1 });
    return new Response(JSON.stringify(usage), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}

// POST handler for /api/plates/usage
export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();
    console.log("Submitted Data:", data); // This should include 'car'

    const newUsage = new PlateUsage(data);
    await newUsage.save();
    console.log("Saved usage:", newUsage);

    return new Response(JSON.stringify(newUsage), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
