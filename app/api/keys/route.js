import { connectDB } from "@/lib/mongodb";
import Key from "@/models/Key";

// GET all keys
export async function GET(request) {
  try {
    const { db } = await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";

    let query = {};
    if (search) {
      query = {
        $or: [
          { carName: { $regex: search, $options: "i" } },
          { keyNumber: { $regex: search, $options: "i" } },
        ],
      };
    }
    if (brand) {
      query.carName = { $regex: brand, $options: "i" };
    }

    const keys = await Key.find(query).sort({ createdAt: -1 });
    return Response.json(keys);
  } catch (error) {
    return Response.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

// POST a new key
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const newKey = new Key(body);
    await newKey.save();
    return Response.json(newKey, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create key" }, { status: 500 });
  }
}

// PUT (update) a key
export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...updateData } = await request.json();
    const updatedKey = await Key.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return Response.json(updatedKey);
  } catch (error) {
    return Response.json({ error: "Failed to update key" }, { status: 500 });
  }
}

// DELETE a key
export async function DELETE(request) {
  try {
    await connectDB();
    const { id } = await request.json();
    await Key.findByIdAndDelete(id);
    return Response.json({ message: "Key deleted successfully" });
  } catch (error) {
    return Response.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
