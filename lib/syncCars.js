// lib/syncCars.js
import slugify from "slugify";
import { connectDB } from "./mongodb";
import Car from "@/models/Car";
import { fetchMobileCars } from "./mobile";

export const syncCars = async () => {
  await connectDB();
  const ads = await fetchMobileCars();

  const ops = ads.map((ad) => {
    // pull every field you care about out of the incoming `ad`
    const {
      mobileAdId,
      mobileSellerId,
      make,
      model,
      modelDescription,
      firstRegistration,
      mileage,
      previousOwners,
      category,
      series,
      equipmentLine,
      engineDisplacement,
      power, // assume “80 kW (109 PS)”
      cylinders,
      drivetrain,
      gearbox,
      fuel,
      consumptionCombined,
      co2Emissions,
      emissionClass,
      environmentBadge,
      price,
      nextInspection,
      serviceHistory,
      seats,
      doors,
      airConditioning,
      airbags, // assume array of strings
      abs,
      esp,
      tractionControl,
      centralLocking,
      alarm,
      cruiseControl,
      radio,
      cdPlayer,
      fogLights,
      multifunctionSteering,
      colorExterior,
      colorInterior,
      tankCapacity,
      equipment, // assume array of strings
      images,
    } = ad;

    // split power into kW & PS
    let powerKW = null,
      powerPS = null;
    if (power) {
      const match = power.match(/(\d+)\s*kW.*?(\d+)\s*PS/);
      if (match) {
        powerKW = Number(match[1]);
        powerPS = Number(match[2]);
      }
    }

    const slug = slugify(`${make}-${model}-${mobileAdId}`, {
      lower: true,
      strict: true,
    });

    return {
      updateOne: {
        filter: { mobileAdId },
        update: {
          $set: {
            mobileSellerId,
            make,
            model,
            modelDescription,
            slug,

            firstRegistration: firstRegistration
              ? new Date(firstRegistration)
              : null,
            mileage,
            previousOwners,
            category,
            series,
            equipmentLine,

            engineDisplacement,
            powerKW,
            powerPS,
            cylinders,
            drivetrain,
            gearbox,

            fuel,
            consumptionCombined,
            co2Emissions,
            emissionClass,
            environmentBadge,

            priceGross: price?.consumerPriceGross ?? null,
            currency: price?.currency ?? null,
            vatRate: price?.vatRate ?? null,

            nextInspection: nextInspection ? new Date(nextInspection) : null,
            serviceHistory,

            seats,
            doors,
            airConditioning,
            airbags,
            abs,
            esp,
            tractionControl,
            centralLocking,
            alarm,
            cruiseControl,

            radio,
            cdPlayer,
            fogLights,
            multifunctionSteering,

            colorExterior,
            colorInterior,
            tankCapacity,

            equipmentList: equipment || [],
            images: images?.map((i) => ({ ref: i.ref })) || [],
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    await Car.bulkWrite(ops);
    console.log(`🔄 Synced ${ops.length} cars with full specs`);
  }
};
