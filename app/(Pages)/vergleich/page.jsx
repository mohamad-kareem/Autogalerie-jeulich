"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  X,
  Check,
  CarFront,
  Gauge,
  Fuel,
  Calendar,
  Zap,
  Scale,
  Settings,
  ShieldCheck,
  MapPin,
  Car,
  Armchair,
  Snowflake,
  Sun,
  Wifi,
  ParkingMeter,
  Lightbulb,
  Key,
  ArrowRight,
  Star,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GridBackground from "@/app/(components)/helpers/Grid";
import Button from "@/app/(components)/helpers/Button";
const ComparePage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("specs");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const carIds = params.getAll("id");

    const storedComparison = JSON.parse(
      localStorage.getItem("carComparison") || "[]"
    );
    const idsToFetch = carIds.length > 0 ? carIds : storedComparison;

    if (idsToFetch.length > 0) {
      fetchComparisonCars(idsToFetch);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchComparisonCars = async (ids) => {
    try {
      const responses = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/cars/${id}`);
          if (!res.ok) return null;
          return await res.json();
        })
      );
      setCars(responses.filter((car) => car));
    } catch (error) {
      console.error("Failed to fetch comparison cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeCar = (id) => {
    const updatedCars = cars.filter((car) => car._id !== id);
    setCars(updatedCars);

    const params = new URLSearchParams();
    updatedCars.forEach((car) => params.append("id", car._id));
    window.history.replaceState(null, "", `?${params.toString()}`);

    localStorage.setItem(
      "carComparison",
      JSON.stringify(updatedCars.map((car) => car._id))
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    return `${month}/${year}`;
  };

  const allValuesEqual = (key) => {
    if (cars.length === 0) return true;
    const firstValue = cars[0][key];
    return cars.every((car) => car[key] === firstValue);
  };

  const renderComparisonRow = (title, icon, key, formatter = (val) => val) => {
    return (
      <div className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-white/5 transition-colors border-b border-white/10">
        <div className="col-span-12 md:col-span-3 flex items-center text-gray-300 gap-2">
          {icon &&
            React.cloneElement(icon, { className: "h-4 w-4 text-red-500" })}
          <span>{title}</span>
        </div>
        {cars.map((car) => (
          <div
            key={`${car._id}-${key}`}
            className={`col-span-6 md:col-span-3 text-center ${
              allValuesEqual(key) ? "text-gray-300" : "text-white font-medium"
            }`}
          >
            {car[key] ? formatter(car[key]) : "-"}
          </div>
        ))}
      </div>
    );
  };

  const renderFeatureRow = (title, icon, key) => {
    return (
      <div className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-white/5 transition-colors border-b border-white/10">
        <div className="col-span-12 md:col-span-3 flex items-center text-gray-300 gap-2">
          {icon &&
            React.cloneElement(icon, { className: "h-4 w-4 text-red-500" })}
          <span>{title}</span>
        </div>
        {cars.map((car) => (
          <div
            key={`${car._id}-${key}`}
            className="col-span-6 md:col-span-3 flex justify-center"
          >
            {car[key] ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <X className="h-5 w-5 text-red-400/80" />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black">
        <GridBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"
          ></motion.div>
        </div>
      </div>
    );
  }

  if (cars.length < 2) {
    return (
      <div className="relative min-h-screen bg-black">
        <GridBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-black/70 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md w-full border border-white/10"
          >
            <div className="flex justify-center mb-4">
              <Scale className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Vergleich nicht möglich
            </h1>
            <p className="text-gray-300 mb-6">
              {cars.length === 0
                ? "Sie haben keine Fahrzeuge zum Vergleich ausgewählt."
                : "Sie müssen mindestens 2 Fahrzeuge zum Vergleich auswählen."}
            </p>
            <Link
              href="/gebrauchtwagen"
              className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium gap-2 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Zurück zur Fahrzeugliste
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black pt-20  ">
      <GridBackground />

      {/* Sticky header */}
      <header
        className={`relative z-20  top-0 transition-all duration-300 ${
          isScrolled
            ? "bg-black/90 backdrop-blur-sm py-2 shadow-lg"
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link
              href="/gebrauchtwagen"
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-medium">Zurück</span>
            </Link>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-red-500" />
              <h1 className="text-xl font-bold text-white">
                Fahrzeugvergleich
              </h1>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6">
        <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
          {/* Comparison cards - mobile view */}
          <div className="md:hidden mb-6 space-y-4">
            {cars.map((car) => (
              <motion.div
                key={car._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-black/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/10"
              >
                <div className="relative">
                  <div className="aspect-video bg-gray-900/50">
                    {car.images?.[0]?.ref ? (
                      <img
                        src={car.images[0].ref}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <CarFront className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeCar(car._id)}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black p-2 rounded-full shadow-sm  border border-white/10"
                  >
                    <X className="h-4 w-4 text-gray-300 hover:text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {car.make} {car.model}
                      </h3>
                      {car.modelDescription && (
                        <p className="text-sm text-gray-300">
                          {car.modelDescription}
                        </p>
                      )}
                    </div>
                    <div className="text-lg font-bold text-red-500">
                      {formatPrice(car.price?.consumerPriceGross)}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div>
                      <p className="text-gray-400">Kilometerstand</p>
                      <p>{car.mileage?.toLocaleString("de-DE")} km</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Erstzulassung</p>
                      <p>{formatDate(car.firstRegistration)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Leistung</p>
                      <p>{car.power} PS</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Kraftstoff</p>
                      <p>{car.fuel}</p>
                    </div>
                  </div>
                  <Link
                    href={`/gebrauchtwagen/${car._id}`}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop comparison table */}
          <div className="hidden md:block bg-black/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden mb-8 border border-white/10">
            <div className="grid grid-cols-12 gap-0 border-b border-white/10">
              <div className="col-span-3 p-4 bg-black/30">
                <h2 className="font-semibold text-gray-300">Spezifikationen</h2>
              </div>
              {cars.map((car) => (
                <div
                  key={car._id}
                  className="col-span-3 p-4 relative group border-l border-white/10"
                >
                  <button
                    onClick={() => removeCar(car._id)}
                    className="absolute top-2 right-2 bg-white hover:bg-red-600 p-1 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-black" />
                  </button>

                  <div className="flex flex-col items-center">
                    <div className="w-full aspect-[4/3] bg-gray-900/50 rounded-lg overflow-hidden mb-3">
                      {car.images?.[0]?.ref ? (
                        <img
                          src={car.images[0].ref}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <CarFront className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white text-center">
                      {car.make} {car.model}
                    </h3>
                    {car.modelDescription && (
                      <p className="text-sm text-gray-300 text-center line-clamp-1">
                        {car.modelDescription}
                      </p>
                    )}
                    <div className="mt-2 text-lg font-bold text-red-500">
                      {formatPrice(car.price?.consumerPriceGross)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab navigation */}
            <div className="border-b border-white/10">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("specs")}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "specs"
                      ? "text-red-500 border-b-2 border-red-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Technische Daten
                </button>
                <button
                  onClick={() => setActiveTab("features")}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "features"
                      ? "text-red-500 border-b-2 border-red-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  Ausstattung
                </button>
                <button
                  onClick={() => setActiveTab("safety")}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 ${
                    activeTab === "safety"
                      ? "text-red-500 border-b-2 border-red-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Sicherheit
                </button>
              </nav>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "specs" && (
                  <div>
                    {renderComparisonRow(
                      "Marke & Modell",
                      null,
                      "make",
                      (val) => (
                        <>
                          {val} {cars.find((c) => c.make === val)?.model}
                        </>
                      )
                    )}
                    {renderComparisonRow(
                      "Erstzulassung",
                      <Calendar className="h-4 w-4" />,
                      "firstRegistration",
                      formatDate
                    )}
                    {renderComparisonRow(
                      "Kilometerstand",
                      <Gauge className="h-4 w-4" />,
                      "mileage",
                      (val) => `${val?.toLocaleString("de-DE")} km`
                    )}
                    {renderComparisonRow("Preis", null, "price", (val) =>
                      formatPrice(val?.consumerPriceGross)
                    )}
                    {renderComparisonRow(
                      "Kraftstoff",
                      <Fuel className="h-4 w-4" />,
                      "fuel"
                    )}
                    {renderComparisonRow(
                      "Leistung",
                      <Zap className="h-4 w-4" />,
                      "power",
                      (val) => `${val} PS`
                    )}
                    {renderComparisonRow(
                      "Getriebe",
                      <Settings className="h-4 w-4" />,
                      "gearbox"
                    )}
                    {renderComparisonRow(
                      "Türen/Plätze",
                      <Car className="h-4 w-4" />,
                      "doors",
                      (val) =>
                        `${val?.replace(/_/g, " ").toLowerCase()} / ${
                          cars.find((c) => c.doors === val)?.seats
                        }`
                    )}
                    {renderComparisonRow("Farbe", null, "exteriorColor")}
                    {renderComparisonRow(
                      "Hubraum",
                      null,
                      "cubicCapacity",
                      (val) => `${val} ccm`
                    )}
                    {renderComparisonRow("Antriebsart", null, "driveType")}
                    {renderComparisonRow(
                      "Verbrauch (komb.)",
                      <Fuel className="h-4 w-4" />,
                      "consumptions",
                      (val) =>
                        val?.fuel?.combined
                          ? `${val.fuel.combined} L/100km`
                          : "-"
                    )}
                  </div>
                )}

                {activeTab === "features" && (
                  <div>
                    {renderFeatureRow(
                      "Zertifiziert",
                      <BadgeCheck className="h-4 w-4" />,
                      "certified"
                    )}
                    {renderFeatureRow("Garantie", null, "warranty")}
                    {renderFeatureRow(
                      "Klimaanlage",
                      <Snowflake className="h-4 w-4" />,
                      "climatisation"
                    )}
                    {renderFeatureRow(
                      "Sitzheizung",
                      <Sun className="h-4 w-4" />,
                      "electricHeatedSeats"
                    )}
                    {renderFeatureRow(
                      "Ledersitze",
                      <Armchair className="h-4 w-4" />,
                      "leatherSeats"
                    )}
                    {renderFeatureRow(
                      "Navigationssystem",
                      <MapPin className="h-4 w-4" />,
                      "navigationSystem"
                    )}
                    {renderFeatureRow(
                      "Bluetooth",
                      <Wifi className="h-4 w-4" />,
                      "bluetooth"
                    )}
                  </div>
                )}

                {activeTab === "safety" && (
                  <div>
                    {renderFeatureRow(
                      "Einparkhilfe",
                      <ParkingMeter className="h-4 w-4" />,
                      "parkingAssist"
                    )}
                    {renderFeatureRow(
                      "LED-Scheinwerfer",
                      <Lightbulb className="h-4 w-4" />,
                      "ledHeadlights"
                    )}
                    {renderFeatureRow(
                      "Keyless Go",
                      <Key className="h-4 w-4" />,
                      "keylessEntry"
                    )}
                    {renderFeatureRow(
                      "Totwinkelwarner",
                      null,
                      "blindSpotMonitor"
                    )}
                    {renderFeatureRow(
                      "Notbremsassistent",
                      null,
                      "emergencyBrakeAssist"
                    )}
                    {renderFeatureRow(
                      "Spurhalteassistent",
                      null,
                      "laneKeepAssist"
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Summary section */}
          <div className="bg-black/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Zusammenfassung</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {cars.map((car) => (
                <div
                  key={`summary-${car._id}`}
                  className="p-6 h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-white">
                          {car.make} {car.model}
                        </h4>
                        {car.modelDescription && (
                          <p className="text-sm text-gray-300">
                            {car.modelDescription}
                          </p>
                        )}
                      </div>
                      <div className="text-xl font-bold text-red-500">
                        {formatPrice(car.price?.consumerPriceGross)}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kilometerstand:</span>
                        <span className="font-medium">
                          {car.mileage?.toLocaleString("de-DE")} km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Erstzulassung:</span>
                        <span className="font-medium">
                          {formatDate(car.firstRegistration)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Leistung:</span>
                        <span className="font-medium">{car.power} PS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kraftstoff:</span>
                        <span className="font-medium">{car.fuel}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/gebrauchtwagen/${car._id}`}>
                    <Button>
                      Fahrzeugdetails <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComparePage;
