import ManualCar from "@/models/AddCar";
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
    await connectDB();

    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());

    // Extract contact fields
    const { fullName, email, phone, ...restRawData } = rawData;

    // Extract and filter features
    const features = [];
    const specialFeatures = [];

    const filteredRawData = {};
    for (const [key, value] of Object.entries(restRawData)) {
      if (key.startsWith("features_")) {
        features.push(value);
      } else if (key.startsWith("specialFeatures_")) {
        specialFeatures.push(value);
      } else {
        filteredRawData[key] = value;
      }
    }

    // Upload images to Cloudinary
    const imageFiles = formData.getAll("images");
    const imageUrls = [];

    for (const file of imageFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());

        const uploaded = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "auto-deals" }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            })
            .end(buffer);
        });

        imageUrls.push(uploaded.secure_url);
      }
    }

    // Assemble final car data
    const carData = {
      ...filteredRawData,
      features,
      specialFeatures,
      images: imageUrls,

      name: `${rawData.make?.trim() || ""} ${
        rawData.model?.trim() || ""
      }`.trim(),
      make: rawData.make?.trim() || "",
      model: rawData.model?.trim() || "",

      contact: {
        fullName: fullName?.trim() || "",
        email: email?.trim() || "",
        phone: phone?.trim() || "",
      },

      // Convert number and boolean fields
      price: parseFloat(rawData.price || 0),
      kilometers: parseInt(rawData.kilometers || 0),
      power: parseInt(rawData.power || 0),
      hp: parseInt(rawData.hp || 0),
      seats: parseInt(rawData.seats || 0),
      previousOwners: parseInt(rawData.previousOwners || 0),
      cylinders: parseInt(rawData.cylinders || 0),

      accidentFree: rawData.accidentFree === "true",
      operational: rawData.operational !== "false",
      hasEngineDamage: rawData.hasEngineDamage === "true",
    };

    // Validate contact info
    if (
      !carData.name ||
      !carData.model ||
      !carData.contact.fullName ||
      !carData.contact.email ||
      !carData.contact.phone
    ) {
      throw new Error("Pflichtfelder fehlen: Name, Modell oder Kontaktdaten.");
    }

    // Save to database
    const newCar = await ManualCar.create(carData);

    return new Response(JSON.stringify({ success: true, car: newCar }), {
      status: 201,
    });
  } catch (error) {
    console.error("❌ Fehler beim Speichern:", error);
    return new Response(
      JSON.stringify({
        error: "Fehler beim Speichern",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
