import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const updates = await req.json();
    if (updates.lastProduced)
      updates.lastProduced = new Date(updates.lastProduced);

    // If a new image was supplied with a different public_id, remove the old one
    const existing = await Medicine.findById(params.id).lean();
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isReplacingImage =
      updates.image &&
      updates.imagePublicId &&
      updates.imagePublicId !== existing.imagePublicId &&
      existing.imagePublicId;

    const doc = await Medicine.findByIdAndUpdate(params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (isReplacingImage) {
      try {
        await cloudinary.uploader.destroy(existing.imagePublicId);
      } catch (e) {
        console.warn("Cloudinary destroy (old image) failed:", e?.message);
      }
    }

    return NextResponse.json(doc);
  } catch (err) {
    console.error("PUT /api/medicines/:id error:", err);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectDB();
    const doc = await Medicine.findById(params.id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const publicId = doc.imagePublicId;

    await doc.deleteOne();

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (e) {
        console.warn("Cloudinary destroy failed:", e?.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/medicines/:id error:", err);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
