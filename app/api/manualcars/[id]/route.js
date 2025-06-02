import { connectDB } from "@/lib/mongodb";
import ManualCar from "@/models/AddCar";

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const deleted = await ManualCar.findByIdAndDelete(id);
    if (!deleted) {
      return new Response(
        JSON.stringify({ error: "Fahrzeug nicht gefunden" }),
        {
          status: 404,
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Fehler beim Löschen", details: error.message }),
      { status: 500 }
    );
  }
}
