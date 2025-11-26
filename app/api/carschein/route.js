// app/api/carschein/route.js
import { connectDB } from "@/lib/mongodb";
import CarSchein from "@/models/CarSchein";
import cloudinary from "@/app/utils/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// -----------------------
// POST  /api/carschein
// -----------------------
export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const {
      carName,
      finNumber,
      owner,
      notes,
      imageUrl,
      publicId,

      // optionale Schlüssel-Felder
      keyNumber,
      keyCount,
      keyColor,
      keySold,
      keyNote,

      // Tankstatus
      fuelNeeded,

      // optional: Dashboard-Status
      dashboardHidden,
    } = await req.json();

    // FIN muss nicht vorhanden sein, aber wenn sie gesetzt ist, prüfen wir auf Duplikate
    if (finNumber) {
      const existing = await CarSchein.findOne({ finNumber });
      if (existing) {
        return new Response(
          JSON.stringify({ error: "Diese FIN-Nummer existiert bereits" }),
          { status: 409 }
        );
      }
    }

    // Notes normalisieren (Array oder Zeilenstring)
    const notesArr = Array.isArray(notes)
      ? notes
      : (notes || "")
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean);

    const doc = await CarSchein.create({
      carName,
      finNumber: finNumber || "",
      owner,
      notes: notesArr,
      imageUrl: imageUrl || null,
      publicId: publicId || null,

      keyNumber: keyNumber ?? "",
      keyCount:
        typeof keyCount === "number" && !Number.isNaN(keyCount) ? keyCount : 2,
      keyColor: keyColor || "#000000",
      keySold: !!keySold,
      keyNote: keyNote || "",

      fuelNeeded: !!fuelNeeded,

      dashboardHidden: !!dashboardHidden,
    });

    return new Response(JSON.stringify(doc), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// -----------------------
// GET  /api/carschein
// (optional pagination)
// -----------------------
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      CarSchein.countDocuments(),
      CarSchein.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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

// -----------------------
// DELETE  /api/carschein?id=...
// -----------------------
export async function DELETE(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
      });
    }

    const doc = await CarSchein.findById(id);
    if (!doc) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    // Bild wird im Frontend via /api/delete-image entfernt – hier nur DB
    await CarSchein.findByIdAndDelete(id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// -----------------------
// PUT  /api/carschein
// -----------------------
export async function PUT(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await req.json();
    const {
      id,
      carName,
      finNumber,
      owner,
      notes,
      imageUrl,
      publicId,
      oldPublicId,

      // Key fields
      keyNumber,
      keyCount,
      keyColor,
      keySold,
      keyNote,

      // Tankstatus
      fuelNeeded,

      // Dashboard-Status
      dashboardHidden,
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400,
      });
    }

    // Optional: altes Bild löschen, wenn sich publicId ändert
    if (oldPublicId && oldPublicId !== publicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (err) {
        console.warn("Cloudinary delete failed:", err.message);
      }
    }

    const updateFields = {};

    if (typeof carName !== "undefined") updateFields.carName = carName;
    if (typeof finNumber !== "undefined")
      updateFields.finNumber = finNumber || "";
    if (typeof owner !== "undefined") updateFields.owner = owner;
    if (typeof notes !== "undefined") updateFields.notes = notes;

    // Bild optional & auch löschbar
    if (typeof imageUrl !== "undefined") {
      updateFields.imageUrl = imageUrl || null;
    }
    if (typeof publicId !== "undefined") {
      updateFields.publicId = publicId || null;
    }

    // Key-Felder
    if (typeof keyNumber !== "undefined") updateFields.keyNumber = keyNumber;
    if (typeof keyCount !== "undefined") updateFields.keyCount = keyCount;
    if (typeof keyColor !== "undefined") updateFields.keyColor = keyColor;
    if (typeof keySold !== "undefined") updateFields.keySold = !!keySold;
    if (typeof keyNote !== "undefined") updateFields.keyNote = keyNote;

    // Tankstatus
    if (typeof fuelNeeded !== "undefined") {
      updateFields.fuelNeeded = !!fuelNeeded;
    }

    // Dashboard-Status
    if (typeof dashboardHidden !== "undefined") {
      updateFields.dashboardHidden = !!dashboardHidden;
    }

    const updated = await CarSchein.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).lean();

    if (!updated) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
