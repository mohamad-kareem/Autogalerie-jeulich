import { connectDB } from "@/lib/mongodb";
import Key from "@/models/Key";

// GET all keys
export async function GET(request) {
  try {
    const { db } = await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";
    const soldParam = searchParams.get("sold");

    let query = {};

    if (search) {
      query.$or = [
        { carName: { $regex: search, $options: "i" } },
        { keyNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (soldParam === "true") {
      query.sold = true;
    }

    const keys = await Key.find(query).sort({ createdAt: -1 }).lean();
    return Response.json(keys);
  } catch (error) {
    return Response.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

function isDuplicateKey(err) {
  return err?.code === 11000;
}

// POST a new key
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    console.log("Received on backend:", body);
    const newKey = new Key(body);
    await newKey.save();
    return Response.json(newKey, { status: 201 });
  } catch (err) {
    if (isDuplicateKey(err)) {
      return Response.json(
        { error: "Schlüsselnummer existiert bereits" },
        { status: 400 }
      );
    }
    return Response.json({ error: "Failed to create key" }, { status: 500 });
  }
}

// PUT (update) a key
export async function PUT(request) {
  try {
    await connectDB();
    const { id, ...updateData } = await request.json();
    if (!id) {
      return Response.json({ error: "Missing ID" }, { status: 400 });
    }

    const updatedKey = await Key.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true, // ⬅️ ensures the unique check runs on update
      context: "query",
    });

    if (!updatedKey) {
      return Response.json({ error: "Key not found" }, { status: 404 });
    }
    return Response.json(updatedKey);
  } catch (err) {
    if (isDuplicateKey(err)) {
      return Response.json(
        { error: "Schlüsselnummer existiert bereits" },
        { status: 400 }
      );
    }
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
