import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import cloudinary from "@/app/utils/cloudinary";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  try {
    // ✅ Parse form data first
    const formData = await req.formData();

    const name = formData.get("name");
    const email = formData.get("email")?.toLowerCase();
    const password = formData.get("password");
    const role = formData.get("role") || "user"; // default to user
    const file = formData.get("image");

    // ✅ Validate role
    if (!["admin", "user"].includes(role)) {
      return NextResponse.json({ message: "Invalid role." }, { status: 400 });
    }

    // ✅ Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    // ✅ Check for existing user
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { message: "Email already registered." },
        { status: 409 }
      );
    }

    // ✅ Handle image upload
    let imageUrl = "";
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "admins" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      imageUrl = result.secure_url;
    }

    // ✅ Create new admin/user
    const newAdmin = new Admin({
      name,
      email,
      password,
      role,
      image: imageUrl,
    });

    await newAdmin.save();

    return NextResponse.json(
      { message: "Registration successful." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
