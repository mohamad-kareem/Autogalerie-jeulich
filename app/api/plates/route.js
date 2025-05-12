import { connectDB } from "@/lib/mongodb";
import Plate from "@/models/Plate";

export async function GET() {
  try {
    await connectDB();
    const plates = await Plate.find({});
    return new Response(JSON.stringify(plates), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
