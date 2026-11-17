import { connectDB } from "@/lib/mongodb";
import ManualCar from "@/models/AddCar";
import { staffUser } from "@/lib/kaufvertragServer";

export async function DELETE(req, { params }) {
  // login required (security check)
  if (!(await staffUser())) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
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
