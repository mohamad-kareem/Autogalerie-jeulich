import slugify from "slugify"; // npm install slugify
import { connectDB } from "./mongodb";
import Car from "@/models/Car";
import { fetchMobileCars } from "./mobile";

export const syncCars = async () => {
  await connectDB();
  const ads = await fetchMobileCars();

  const ops = ads.map((ad) => {
    const { mobileAdId, make, model, modelDescription, price, images } = ad;

    // generate a unique slug per ad
    const slug = slugify(`${make}-${model}-${mobileAdId}`, {
      lower: true,
      strict: true,
    });

    return {
      updateOne: {
        filter: { mobileAdId },
        update: {
          $set: {
            make,
            model,
            modelDescription,
            price, // now allowed as Mixed
            images,
            slug,
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    await Car.bulkWrite(ops);
    console.log(`🔄 Synced ${ops.length} cars with slugs`);
  }
};
