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
      cubicCapacity,
      gearbox,
      fuel,
      images = [],
      price = {},
      category,
      climatisation,
      airbag,
      ambientLighting,
      onBoardComputer,
      paddleShifters,
      usb,
      driveType,
      consumptions,
      emissions,
      seats,
      doors,
      emissionClass,
      newHuAu,
      parkingAssistants,
      manufacturerColorName,
      exteriorColor,
      interiorType,
      interiorColor,
      tintedWindows,
      armRest,
      heatedWindshield,
      electricWindows,
      electricTailgate,
      electricExteriorMirrors,
      foldingExteriorMirrors,
      electricAdjustableSeats,
      memorySeats,
      leatherSteeringWheel,
      panoramicGlassRoof,
      sunroof,
      keylessEntry,
      electricHeatedSeats,
      centralLocking,
      headUpDisplay,
      multifunctionalWheel,
      powerAssistedSteering,
      bluetooth,
      cdPlayer,
      handsFreePhoneSystem,
      wirelessCharging,
      navigationSystem,
      voiceControl,
      touchscreen,
      radio,
      alarmSystem,
      abs,
      distanceWarningSystem,
      glareFreeHighBeam,
      immobilizer,
      esp,
      highBeamAssist,
      speedLimiter,
      isofix,
      lightSensor,
      frontFogLights,
      collisionAvoidance,
      emergencyCallSystem,
      automaticRainSensor,
      tirePressureMonitoring,
      laneDepartureWarning,
      startStopSystem,
      tractionControlSystem,
      trafficSignRecognition,
      daytimeRunningLamps,
      headlightType,
      bendingLightsType,
      headlightWasherSystem,
      summerTires,
      winterTires,
      alloyWheels,
      sportPackage,
      sportSeats,
      description = "",
    } = ad;

    // 🧼 Clean up description
    const cleanDescription = description
      .replace(/\\{1,}/g, "") // Remove all backslashes
      .replace(/\*{1,3}/g, "") // Remove markdown asterisks
      .replace(/-{2,}/g, "") // Remove excess dashes
      .replace(/\n{2,}/g, "\n") // Normalize new lines
      .trim();

    // 🧠 Extract TÜV/ AU bis ... or Neu
    // Match: "TÜV / AU bis Juli 2026" or "TÜV/ AU Neu"
    const tuevMatch = cleanDescription.match(
      /TÜV\s*\/\s*AU\s*(?:bis\s*)?([\w.]+\s*\d{4}|Neu)(?:\s*\(.*?\))?/i
    );

    const extractedHuDate = tuevMatch ? tuevMatch[1].trim() : null;

    // Match: "Scheckheft gepflegt" (case-insensitive)
    const hasFullServiceHistory = /Scheckheft\s*gepflegt/i.test(
      cleanDescription
    );
    const mentionsAllSeasonInDescription =
      /ganzjahresreifen|allwetterreifen/i.test(cleanDescription);
    const hasAllSeasonTires = !!(
      ad.allSeasonTires || mentionsAllSeasonInDescription
    );

    return {
      updateOne: {
        filter: { vin },
        update: {
          $set: {
            vin,
            make,
            model,
            modelDescription,
            firstRegistration,
            mileage,
            power,
            cubicCapacity,
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
            category,
            climatisation,
            airbag,
            ambientLighting,
            onBoardComputer,
            paddleShifters,
            usb,
            driveType,
            consumptions,
            emissions,
            seats,
            doors,
            emissionClass,
            newHuAu:
              typeof newHuAu === "string" && newHuAu.length > 3
                ? newHuAu
                : extractedHuDate,

            fullServiceHistory: ad.fullServiceHistory ?? hasFullServiceHistory,
            hasAllSeasonTires,

            parkingAssistants,
            manufacturerColorName,
            exteriorColor,
            interiorType,
            interiorColor,
            tintedWindows,
            armRest,
            heatedWindshield,
            electricWindows,
            electricTailgate,
            electricExteriorMirrors,
            foldingExteriorMirrors,
            electricAdjustableSeats,
            memorySeats,
            leatherSteeringWheel,
            panoramicGlassRoof,
            sunroof,
            keylessEntry,
            electricHeatedSeats,
            centralLocking,
            headUpDisplay,
            multifunctionalWheel,
            powerAssistedSteering,
            bluetooth,
            cdPlayer,
            handsFreePhoneSystem,
            wirelessCharging,
            navigationSystem,
            voiceControl,
            touchscreen,
            radio,
            alarmSystem,
            abs,
            distanceWarningSystem,
            glareFreeHighBeam,
            immobilizer,
            esp,
            highBeamAssist,
            speedLimiter,
            isofix,
            lightSensor,
            frontFogLights,
            collisionAvoidance,
            emergencyCallSystem,
            automaticRainSensor,
            tirePressureMonitoring,
            laneDepartureWarning,
            startStopSystem,
            tractionControlSystem,
            trafficSignRecognition,
            daytimeRunningLamps,
            headlightType,
            bendingLightsType,
            headlightWasherSystem,
            summerTires,
            winterTires,
            alloyWheels,
            sportPackage,
            sportSeats,
            description: cleanDescription,
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    const result = await Car.bulkWrite(ops);
    console.log(
      `🔄 Synced ${
        result.nUpserted + result.nModified
      } cars to match full schema`
    );
  }
};
