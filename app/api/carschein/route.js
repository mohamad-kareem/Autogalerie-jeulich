import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import cloudinary from "@/app/utils/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    // 1. Get the request body
    const {
      carName,
      finNumber, // ✅ new
      assignedTo,
      owner,
      notes,
      imageUrl,
      publicId,
    } = await req.json();

    if (finNumber) {
      const existing = await CarSchein.findOne({ finNumber });
      if (existing) {
        return new Response(
          JSON.stringify({ error: "Diese FIN-Nummer existiert bereits" }),
          { status: 409 }
        );
      }
    }

    // 4. Normalize notes
    const notesArr = Array.isArray(notes)
      ? notes
      : (notes || "")
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean);

    // 5. Save the document
    const doc = await CarSchein.create({
      carName,
      finNumber,
      assignedTo,
      owner,
      notes: notesArr,
      imageUrl,
      publicId,
    });

    return new Response(JSON.stringify(doc), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// /api/carschein/route.js (excerpt)

export async function GET(req) {
  try {
    await connectDB();

    // ── ① read query params, fallback to sane defaults
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10); // 1-based
    const limit = parseInt(searchParams.get("limit") || "10", 10); // rows / page
    const skip = (page - 1) * limit;

    // ── ② parallelise count + page query
    const [total, docs] = await Promise.all([
      CarSchein.countDocuments(),
      CarSchein.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), // returns plain objects ↯ slightly faster
    ]);

    return new Response(
      JSON.stringify({
        docs,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });

    const doc = await CarSchein.findById(id);
    if (!doc)
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });

    await CarSchein.findByIdAndDelete(id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
export async function PUT(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });

    const body = await req.json();
    const {
      id,
      carName,
      assignedTo,
      owner,
      notes,
      imageUrl,
      publicId,
      oldPublicId, // ⬅️ optional: to delete old image
    } = body;

    if (!id)
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
      });

    // Optionally delete old image
    if (publicId && oldPublicId && publicId !== oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    const updateFields = {
      carName,
      assignedTo,
      owner,
      notes,
    };

    if (imageUrl && publicId) {
      updateFields.imageUrl = imageUrl;
      updateFields.publicId = publicId;
    }

    const updated = await CarSchein.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).lean();

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
