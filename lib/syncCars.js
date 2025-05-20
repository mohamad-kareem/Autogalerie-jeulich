import slugify from "slugify";
import { connectDB } from "./mongodb";
import Car from "@/models/Car";
import { fetchMobileCars } from "./mobile";

export const syncCars = async () => {
  await connectDB();
  const ads = await fetchMobileCars();

  const ops = ads
    .map((ad) => {
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
        power,
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
        equipment,
        images,
      } = ad;

      // Skip if no mobileAdId
      if (!mobileAdId) {
        console.warn("⚠️ Skipped ad with missing mobileAdId");
        return null;
      }

      // Parse power safely
      let powerKW = null;
      let powerPS = null;
      if (typeof power === "string") {
        const match = power.match(/(\d+)\s*kW.*?(\d+)\s*PS/);
        if (match) {
          powerKW = Number(match[1]);
          powerPS = Number(match[2]);
        }
      }

      // Create slug
      const slug = slugify(`${make}-${model}-${mobileAdId}`, {
        lower: true,
        strict: true,
      });

      return {
        updateOne: {
          filter: { mobileAdId },
          update: {
            $set: {
              mobileSellerId: mobileSellerId || null,
              make: make || null,
              model: model || null,
              modelDescription: modelDescription || null,
              slug,

              firstRegistration: firstRegistration
                ? new Date(firstRegistration)
                : null,
              mileage: mileage ?? null,
              previousOwners: previousOwners ?? null,
              category: category || null,
              series: series || null,
              equipmentLine: equipmentLine || null,

              engineDisplacement: engineDisplacement ?? null,
              powerKW,
              powerPS,
              cylinders: cylinders ?? null,
              drivetrain: drivetrain || null,
              gearbox: gearbox || null,

              fuel: fuel || null,
              consumptionCombined: consumptionCombined ?? null,
              co2Emissions: co2Emissions ?? null,
              emissionClass: emissionClass || null,
              environmentBadge: environmentBadge || null,

              priceGross: price?.consumerPriceGross ?? null,
              currency: price?.currency ?? null,
              vatRate: price?.vatRate ?? null,

              nextInspection: nextInspection ? new Date(nextInspection) : null,
              serviceHistory: serviceHistory || null,

              seats: seats ?? null,
              doors: doors ?? null,
              airConditioning: airConditioning || null,
              airbags: Array.isArray(airbags) ? airbags : [],

              abs: Boolean(abs),
              esp: Boolean(esp),
              tractionControl: Boolean(tractionControl),
              centralLocking: Boolean(centralLocking),
              alarm: Boolean(alarm),
              cruiseControl: Boolean(cruiseControl),

              radio: radio || null,
              cdPlayer: Boolean(cdPlayer),
              fogLights: Boolean(fogLights),
              multifunctionSteering: Boolean(multifunctionSteering),

              colorExterior: colorExterior || null,
              colorInterior: colorInterior || null,
              tankCapacity: tankCapacity ?? null,

              equipmentList: Array.isArray(equipment) ? equipment : [],
              images: Array.isArray(images)
                ? images.map((i) => ({ ref: i.ref }))
                : [],
            },
          },
          upsert: true,
        },
      };
    })
    .filter(Boolean); // Remove null operations

  if (ops.length > 0) {
    await Car.bulkWrite(ops);
    console.log(`✅ Synced ${ops.length} cars from mobile.de`);
  } else {
    console.warn("⚠️ No valid ads to sync.");
  }
};
