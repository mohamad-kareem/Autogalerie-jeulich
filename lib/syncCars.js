import { connectDB } from "./mongodb";
import Car from "../models/Car";
import { fetchMobileCars } from "./mobile";

export const syncCars = async () => {
  await connectDB();
  const ads = await fetchMobileCars();

  const ops = ads.map((ad) => {
    const {
      vin,
      make,
      model,
      modelDescription,
      firstRegistration,
      mileage,
      power,
      gearbox,
      fuel,
      images = [],
      price = {},
    } = ad;

    return {
      updateOne: {
        filter: { vin },
        update: {
          $set: {
            make,
            model,
            modelDescription,
            firstRegistration,
            mileage,
            vin,
            power,
            gearbox,
            fuel,
            images: images.slice(0, 20).map((img) => ({
              ref: img.ref,
              hash: img.hash || "",
            })),
            price: {
              consumerPriceGross: price.consumerPriceGross || "",
              type: price.type || "",
              currency: price.currency || "",
            },
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    const result = await Car.bulkWrite(ops);
    console.log(
      `🔄 Synced ${result.nUpserted + result.nModified} cars to match schema`
    );
  }
};
