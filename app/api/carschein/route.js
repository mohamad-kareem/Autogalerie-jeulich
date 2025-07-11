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

    const formData = await req.formData();
    console.log(
      "[carschein POST] received",
      Object.fromEntries(formData.entries())
    );

    const carName = formData.get("carName");
    const assignedTo = formData.get("assignedTo");
    const owner = formData.get("owner");
    const rawNotes = formData.get("notes");
    const notes = rawNotes
      ? rawNotes
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean)
      : [];
    const file = formData.get("file");
    if (!carName || !file)
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });

    // buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // upload
    const uploadRes = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "car_scheins",
            resource_type: "image",
            format: "jpg",
            transformation: [{ quality: "auto" }], // optional compression
            chunk_size: 6000000, // optional for larger files
          },
          (err, res) => (err ? reject(err) : resolve(res))
        )
        .end(buffer);
    });

    // save
    const doc = await CarSchein.create({
      carName,
      imageUrl: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      assignedTo,
      owner,
      notes,
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
    const { id, carName, assignedTo, owner, notes } = body;

    if (!id || !carName)
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
      });

    const updated = await CarSchein.findByIdAndUpdate(
      id,
      { carName, assignedTo, owner, notes },
      { new: true }
    ).lean();

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
