// app/api/admin/cars/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Car from "@/models/Car";
import { connectDB } from "@/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401,
      });
    }

    await connectDB();

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    // Extract arrays from form data
    const features = [];
    const specialFeatures = [];
    const images = formData.getAll("images");

    // Process form data to reconstruct arrays
    Object.keys(data).forEach((key) => {
      if (key.startsWith("features_")) {
        features.push(data[key]);
      } else if (key.startsWith("specialFeatures_")) {
        specialFeatures.push(data[key]);
      }
    });

    // Upload images to Cloudinary
    const imageUrls = [];
    for (const image of images) {
      if (image.size > 0) {
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "auto-deals" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(buffer);
        });

        imageUrls.push(result.secure_url);
      }
    }

    // Create new car document
    const carData = {
      ...data,
      features,
      specialFeatures,
      images: imageUrls,
      createdBy: session.user.id,
    };

    // Convert string numbers to actual numbers
    carData.price = parseFloat(carData.price);
    carData.kilometers = parseInt(carData.kilometers);
    carData.power = parseInt(carData.power);
    carData.hp = parseInt(carData.hp);
    carData.seats = parseInt(carData.seats);
    carData.previousOwners = parseInt(carData.previousOwners);
    carData.cylinders = parseInt(carData.cylinders);

    const newCar = await Car.create(carData);

    return new Response(JSON.stringify({ success: true, car: newCar }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error adding car:", error);
    return new Response(
      JSON.stringify({ error: "Failed to add car", details: error.message }),
      { status: 500 }
    );
  }
}
