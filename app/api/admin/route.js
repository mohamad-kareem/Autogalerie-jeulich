import { connectDB } from "@/lib/mongodb";
import AdminData from "@/models/AdminData";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const query = {};
    const type = searchParams.get("type");

    if (type) {
      query.type = type;
    }

    const data = await AdminData.find(query).sort({ createdAt: -1 });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { action, data } = await request.json();

    if (action === "create") {
      const newEntry = await AdminData.create(data);
      return Response.json(newEntry);
    }

    if (action === "update") {
      const updatedEntry = await AdminData.findByIdAndUpdate(data._id, data, {
        new: true,
      });
      return Response.json(updatedEntry);
    }

    if (action === "delete") {
      await AdminData.findByIdAndDelete(data._id);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
