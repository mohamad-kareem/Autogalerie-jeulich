import { connectDB } from "@/lib/mongodb";
import Schlussel from "@/models/Key";

export async function GET() {
  try {
    await connectDB();
    const result = await Schlussel.updateMany(
      { schlusselNumber: "" },
      { $unset: { schlusselNumber: "" } }
    );
    return new Response(
      JSON.stringify({
        message: "Cleanup done",
        modified: result.modifiedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
