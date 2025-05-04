"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  FaGasPump,
  FaTachometerAlt,
  FaCar,
  FaCalendarAlt,
  FaCarSide,
  FaShieldAlt,
} from "react-icons/fa";
import {
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiPlus,
} from "react-icons/fi";
import { GiCarWheel } from "react-icons/gi";
import { IoMdSpeedometer } from "react-icons/io";
import { MdAirlineSeatReclineNormal } from "react-icons/md";
import { useSearchParams, useRouter } from "next/navigation";

const fetchCarById = async (id) => {
  const res = await fetch(`/api/cars/${id}`);
  if (!res.ok) return null;
  return await res.json();
};
const ComparisonClient = () => {
  const [carsToCompare, setCarsToCompare] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    technical: false,
    comfort: false,
    safety: false,
    exterior: false,
  });
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load compared car IDs from URL or localStorage
  useEffect(() => {
    let ids = [];
    if (searchParams.has("ids")) {
      ids = searchParams.get("ids").split(",").filter(Boolean);
      localStorage.setItem("comparedCars", JSON.stringify(ids));
    } else if (typeof window !== "undefined") {
      const local = localStorage.getItem("comparedCars");
      if (local) ids = JSON.parse(local);
    }
    if (!ids.length) {
      setLoading(false);
      setCarsToCompare([]);
      return;
    }
    // Fetch all cars by ID from API
    (async () => {
      setLoading(true);
      const cars = await Promise.all(ids.map((id) => fetchCarById(id)));
      setCarsToCompare(
        cars.filter(Boolean).map((car) => ({
          ...car,
          id: car._id,
          price: new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
          }).format(car.price),
          registration: car.registration || "N/A",
          image: car.images?.[0] || "/default-car.jpg",
          features: car.features || [],
          // Adapt below for your schema/fields
          technicalSpecs: {
            engine: car.displacement,
            transmission: car.transmission,
            drive: car.driveType,
            consumption: car.fuelConsumption || car.energyConsumption,
            cylinders: car.cylinders,
            seats: car.seats,
            doors: car.doors,
            weight: car.weight,
            tankCapacity: car.tankCapacity,
            emissionClass: car.emissionClass,
          },
          comfortFeatures: [
            ...(car.specialFeatures || []),
            car.airConditioning,
            car.parkingAssistance,
          ].filter(Boolean),
          safetyFeatures: [
            car.airbags,
            car.accidentFree ? "Unfallfrei" : null,
          ].filter(Boolean),
          exteriorFeatures: [
            car.exteriorColor,
            car.exteriorColorSimple,
            car.interiorColor,
            car.interiorMaterial,
          ].filter(Boolean),
        }))
      );
      setLoading(false);
    })();
  }, [searchParams]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRemoveCar = (id) => {
    const newCars = carsToCompare.filter((car) => car.id !== id);
    setCarsToCompare(newCars);
    // Update localStorage
    localStorage.setItem(
      "comparedCars",
      JSON.stringify(newCars.map((car) => car.id))
    );
    // Update URL
    if (newCars.length) {
      router.replace(
        `/vergleich?ids=${newCars.map((car) => car.id).join(",")}`
      );
    } else {
      router.replace("/gebrauchtwagen");
    }
  };

  // Utility: green/red text if higher/lower
  const getComparisonColor = (value1, value2, isHigherBetter = true) => {
    if (value1 === value2) return "";
    const comparison = isHigherBetter
      ? value1 > value2
        ? "text-emerald-500"
        : "text-rose-500"
      : value1 < value2
      ? "text-emerald-500"
      : "text-rose-500";
    return comparison;
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  if (!carsToCompare.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>Keine Fahrzeuge ausgewählt.</p>
      </div>
    );

  // Get technical spec keys for rendering (so it works for any car)
  const specKeys = Object.keys(carsToCompare[0]?.technicalSpecs || {}).filter(
    Boolean
  );

  return (
    <div className="min-h-screen bg-gray-50 mt-15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Comparison Grid */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {/* Cars Header Row */}
          <div className="sticky top-16 z-10 bg-white border-b border-gray-200">
            <div
              className="grid gap-6 p-6"
              style={{
                gridTemplateColumns: `repeat(${
                  carsToCompare.length + 1
                }, minmax(0, 1fr))`,
              }}
            >
              <div className="font-medium text-gray-500 text-3xl uppercase tracking-wider mt-30">
                Modell
              </div>
              {carsToCompare.map((car) => (
                <div
                  key={car.id}
                  className="relative group flex flex-col h-full"
                >
                  <button
                    className="absolute -top-7 -right-4 p-1 bg-red-200 rounded-full shadow-md
  +              text-white hover:bg-red-600 transition-colors"
                    onClick={() => handleRemoveCar(car.id)}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <div className="h-40 relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 mb-3">
                    <Image
                      src={car.image}
                      alt={car.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div className="min-h-[3rem]">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                        {car.name}
                      </h3>
                    </div>
                    <div className="min-h-[2.5rem] mb-2">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {car.subtitle}
                      </p>
                    </div>
                    <div className="min-h-[2rem] mb-4 flex items-center">
                      <span className="text-red-600 font-bold text-xl">
                        {car.price}
                      </span>
                    </div>
                    <div className="mt-auto">
                      <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors">
                        Angebot anfordern
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Basic Specs */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-bold text-lg mb-5 text-gray-800">Übersicht</h2>
            <div className="grid gap-5">
              <div
                className="grid gap-6 items-center"
                style={{
                  gridTemplateColumns: `repeat(${
                    carsToCompare.length + 1
                  }, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-center text-gray-500 text-sm">
                  <FaCalendarAlt className="mr-3 text-red-500" />
                  Erstzulassung
                </div>
                {carsToCompare.map((car) => (
                  <div key={`reg-${car.id}`} className="text-gray-700">
                    {car.registration}
                  </div>
                ))}
              </div>
              <div
                className="grid gap-6 items-center"
                style={{
                  gridTemplateColumns: `repeat(${
                    carsToCompare.length + 1
                  }, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-center text-gray-500 text-sm">
                  <FaTachometerAlt className="mr-3 text-red-500" />
                  Kilometerstand
                </div>
                {carsToCompare.map((car) => (
                  <div key={`km-${car.id}`} className="text-gray-700">
                    {car.kilometers} km
                  </div>
                ))}
              </div>
              <div
                className="grid gap-6 items-center"
                style={{
                  gridTemplateColumns: `repeat(${
                    carsToCompare.length + 1
                  }, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-center text-gray-500 text-sm">
                  <FaGasPump className="mr-3 text-red-500" />
                  Kraftstoff
                </div>
                {carsToCompare.map((car) => (
                  <div key={`fuel-${car.id}`} className="text-gray-700">
                    {car.fuel}
                  </div>
                ))}
              </div>
              <div
                className="grid gap-6 items-center"
                style={{
                  gridTemplateColumns: `repeat(${
                    carsToCompare.length + 1
                  }, minmax(0, 1fr))`,
                }}
              >
                <div className="flex items-center text-gray-500 text-sm">
                  <IoMdSpeedometer className="mr-3 text-red-500" />
                  Leistung
                </div>
                {carsToCompare.map((car, i) => (
                  <div
                    key={`power-${car.id}`}
                    className={`text-gray-700 ${getComparisonColor(
                      car.power,
                      carsToCompare[0].power
                    )}`}
                  >
                    {car.power} kW ({car.hp} PS)
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Technical Specs */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("technical")}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-bold text-lg flex items-center text-gray-800">
                <FaCarSide className="mr-3 text-red-500" />
                Technische Daten
              </h2>
              {expandedSections.technical ? (
                <FiChevronUp className="text-gray-400" />
              ) : (
                <FiChevronDown className="text-gray-400" />
              )}
            </button>
            {expandedSections.technical && (
              <div className="px-6 pb-6 grid gap-5">
                {specKeys.map((spec) => (
                  <div
                    key={spec}
                    className="grid gap-6 items-center"
                    style={{
                      gridTemplateColumns: `repeat(${
                        carsToCompare.length + 1
                      }, minmax(0, 1fr))`,
                    }}
                  >
                    <div className="text-gray-500 text-sm capitalize">
                      {spec.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    {carsToCompare.map((car) => (
                      <div key={`${spec}-${car.id}`} className="text-gray-700">
                        {car.technicalSpecs[spec]}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Comfort Features */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("comfort")}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-bold text-lg flex items-center text-gray-800">
                <MdAirlineSeatReclineNormal className="mr-3 text-red-500" />
                Komfort & Ausstattung
              </h2>
              {expandedSections.comfort ? (
                <FiChevronUp className="text-gray-400" />
              ) : (
                <FiChevronDown className="text-gray-400" />
              )}
            </button>
            {expandedSections.comfort && (
              <div className="px-6 pb-6">
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${
                      carsToCompare.length + 1
                    }, minmax(0, 1fr))`,
                  }}
                >
                  <div className="text-sm text-gray-500 pt-2">
                    Komfortmerkmale
                  </div>
                  {carsToCompare.map((car) => (
                    <div key={`comfort-${car.id}`} className="space-y-3">
                      {car.comfortFeatures.length ? (
                        car.comfortFeatures.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-center text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FiCheck className="mr-3 text-emerald-500 flex-none" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Safety Features */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("safety")}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-bold text-lg flex items-center text-gray-800">
                <FaShieldAlt className="mr-3 text-red-500" />
                Sicherheit
              </h2>
              {expandedSections.safety ? (
                <FiChevronUp className="text-gray-400" />
              ) : (
                <FiChevronDown className="text-gray-400" />
              )}
            </button>
            {expandedSections.safety && (
              <div className="px-6 pb-6">
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${
                      carsToCompare.length + 1
                    }, minmax(0, 1fr))`,
                  }}
                >
                  <div className="text-sm text-gray-500 pt-2">
                    Sicherheitsmerkmale
                  </div>
                  {carsToCompare.map((car) => (
                    <div key={`safety-${car.id}`} className="space-y-3">
                      {car.safetyFeatures.length ? (
                        car.safetyFeatures.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-center text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FiCheck className="mr-3 text-emerald-500 flex-none" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Exterior Features */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection("exterior")}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-bold text-lg flex items-center text-gray-800">
                <GiCarWheel className="mr-3 text-red-500" />
                Exterieur
              </h2>
              {expandedSections.exterior ? (
                <FiChevronUp className="text-gray-400" />
              ) : (
                <FiChevronDown className="text-gray-400" />
              )}
            </button>
            {expandedSections.exterior && (
              <div className="px-6 pb-6">
                <div
                  className="grid gap-6"
                  style={{
                    gridTemplateColumns: `repeat(${
                      carsToCompare.length + 1
                    }, minmax(0, 1fr))`,
                  }}
                >
                  <div className="text-sm text-gray-500 pt-2">
                    Exterieurmerkmale
                  </div>
                  {carsToCompare.map((car) => (
                    <div key={`exterior-${car.id}`} className="space-y-3">
                      {car.exteriorFeatures.length ? (
                        car.exteriorFeatures.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-center text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <FiCheck className="mr-3 text-emerald-500 flex-none" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Summary Cards / Fazit */}
          <div className="p-6 bg-gray-50">
            <h2 className="font-bold text-lg mb-6 text-gray-800">Fazit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carsToCompare.map((car) => (
                <div
                  key={`summary-${car.id}`}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-900">
                      {car.name}
                    </h3>
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {car.technicalSpecs.drive}
                    </span>
                  </div>

                  <div className="mt-4 space-y-4 text-sm flex-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preis:</span>
                      <span className="font-medium text-red-500">
                        {car.price}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Leistung:</span>
                      <span className="font-medium">
                        {car.power} kW ({car.hp} PS)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verbrauch:</span>
                      <span className="font-medium">
                        {car.technicalSpecs.consumption}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ausstattung:</span>
                      <span className="font-medium">
                        {car.comfortFeatures.length +
                          car.safetyFeatures.length +
                          car.exteriorFeatures.length}{" "}
                        Features
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-3">
                    <button className="flex-1 bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors">
                      Jetzt anfragen
                    </button>
                    <button className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg font-medium text-sm transition-colors">
                      Details anzeigen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Add More Cars */}
        {carsToCompare.length < 4 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 md:hidden border-t border-gray-200">
            <button
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              onClick={() => router.push("/gebrauchtwagen")}
            >
              <FiPlus className="mr-2" />
              Fahrzeug hinzufügen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonClient;
