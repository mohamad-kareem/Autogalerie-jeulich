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

      if (!mobileAdId) {
        console.warn("⚠️ Skipped ad with missing mobileAdId");
        return null;
      }

      // Parse power string safely: "80 kW (109 PS)"
      let powerKW = null;
      let powerPS = null;
      if (typeof power === "string") {
        const match = power.match(/(\d+)\s*kW.*?(\d+)\s*PS/);
        if (match) {
          powerKW = Number(match[1]);
          powerPS = Number(match[2]);
        }
      }

      // Helper: ensure numeric value or null
      const parseNumber = (val) =>
        typeof val === "number" && !isNaN(val) ? val : null;

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

              // Dates & numeric fields
              firstRegistration: firstRegistration
                ? new Date(firstRegistration)
                : null,
              mileage: parseNumber(mileage),
              previousOwners: parseNumber(previousOwners),
              category: category || null,
              series: series || null,
              equipmentLine: equipmentLine || null,

              engineDisplacement: parseNumber(engineDisplacement),
              powerKW,
              powerPS,
              cylinders: parseNumber(cylinders),
              drivetrain: drivetrain || null,
              gearbox: gearbox || null,

              fuel: fuel || null,
              consumptionCombined: parseNumber(consumptionCombined),
              co2Emissions: parseNumber(co2Emissions),
              emissionClass: emissionClass || null,
              environmentBadge: environmentBadge || null,

              priceGross: parseNumber(price?.consumerPriceGross),
              currency: price?.currency || null,
              vatRate: parseNumber(price?.vatRate),

              nextInspection: nextInspection ? new Date(nextInspection) : null,
              serviceHistory: serviceHistory || null,

              seats: parseNumber(seats),
              doors: parseNumber(doors),
              airConditioning: airConditioning || null,
              airbags: Array.isArray(airbags) ? airbags : [],

              abs: Boolean(abs),
              esp: Boolean(esp),
              tractionControl: Boolean(tractionControl),
              centralLocking: Boolean(centralLocking),
              alarm: Boolean(alarm),
              cruiseControl: Boolean(cruiseControl),

              radio: Array.isArray(radio) ? radio.join(", ") : radio || null,
              cdPlayer: Boolean(cdPlayer),
              fogLights: Boolean(fogLights),
              multifunctionSteering: Boolean(multifunctionSteering),

              colorExterior: colorExterior || null,
              colorInterior: colorInterior || null,
              tankCapacity: parseNumber(tankCapacity),

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
    .filter(Boolean);

  if (ops.length > 0) {
    await Car.bulkWrite(ops);
    console.log(`✅ Synced ${ops.length} cars from mobile.de`);
  } else {
    console.warn("⚠️ No valid ads to sync.");
  }
};
