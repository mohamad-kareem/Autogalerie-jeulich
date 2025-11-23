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

const ComparePage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("specs");

  // Base button style matching usedCarsPage
  const baseBtn =
    "inline-flex h-9 items-center justify-center px-3 text-[11px] sm:text-xs font-medium rounded-md cursor-pointer transition-colors";

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
      <div className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-slate-900/50 transition-colors border-b border-slate-800">
        <div className="col-span-12 md:col-span-3 flex items-center text-slate-300 gap-2">
          {icon &&
            React.cloneElement(icon, { className: "h-4 w-4 text-sky-400" })}
          <span className="text-sm">{title}</span>
        </div>
        {cars.map((car) => (
          <div
            key={`${car._id}-${key}`}
            className={`col-span-6 md:col-span-3 text-center ${
              allValuesEqual(key) ? "text-slate-300" : "text-white font-medium"
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
      <div className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-slate-900/50 transition-colors border-b border-slate-800">
        <div className="col-span-12 md:col-span-3 flex items-center text-slate-300 gap-2">
          {icon &&
            React.cloneElement(icon, { className: "h-4 w-4 text-sky-400" })}
          <span className="text-sm">{title}</span>
        </div>
        {cars.map((car) => (
          <div
            key={`${car._id}-${key}`}
            className="col-span-6 md:col-span-3 flex justify-center"
          >
            {car[key] ? (
              <Check className="h-5 w-5 text-emerald-400" />
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
      <div className="relative min-h-screen bg-slate-950">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"
          ></motion.div>
        </div>
      </div>
    );
  }

  if (cars.length < 2) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-900/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-800"
          >
            <div className="flex justify-center mb-4">
              <Scale className="h-12 w-12 text-sky-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Vergleich nicht möglich
            </h1>
            <p className="text-slate-300 mb-6">
              {cars.length === 0
                ? "Sie haben keine Fahrzeuge zum Vergleich ausgewählt."
                : "Sie müssen mindestens 2 Fahrzeuge zum Vergleich ausgewählt haben."}
            </p>
            <Link
              href="/gebrauchtwagen"
              className={`${baseBtn} bg-sky-600 text-white hover:bg-sky-500`}
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück zur Fahrzeugliste
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 pt-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md py-4">
        <div className="mx-auto w-full max-w-[1500px] px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/gebrauchtwagen"
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>

            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-sky-400" />
              <h1 className="text-xl font-semibold text-white">
                Fahrzeugvergleich
              </h1>
            </div>

            <div className="text-sm text-slate-400">
              {cars.length} von 3 Fahrzeugen
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-8">
        <div className="mx-auto w-full max-w-[1500px]">
          {/* Mobile Cards */}
          <div className="md:hidden mb-6 space-y-4">
            {cars.map((car) => (
              <motion.div
                key={car._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-slate-800"
              >
                <div className="relative">
                  <div className="aspect-video bg-slate-800/50">
                    {car.images?.[0]?.ref ? (
                      <img
                        src={car.images[0].ref}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-full object-cover p-4"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <CarFront className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeCar(car._id)}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 p-2 rounded-full border border-slate-700"
                  >
                    <X className="h-4 w-4 text-slate-300 hover:text-red-400" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {car.make} {car.model}
                      </h3>
                      {car.modelDescription && (
                        <p className="text-sm text-slate-300">
                          {car.modelDescription}
                        </p>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-sky-400">
                      {formatPrice(car.price?.consumerPriceGross)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 mb-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-slate-400" />
                      <span>{car.mileage?.toLocaleString("de-DE")} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatDate(car.firstRegistration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-400" />
                      <span>{car.power} PS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-slate-400" />
                      <span>{car.fuel}</span>
                    </div>
                  </div>
                  <Link
                    href={`/gebrauchtwagen/${car._id}`}
                    className={`${baseBtn} w-full bg-sky-600 text-white hover:bg-sky-500`}
                  >
                    Details anzeigen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Comparison Table */}
          <div className="hidden md:block bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden mb-8 border border-slate-800">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-0 border-b border-slate-800">
              <div className="col-span-3 p-6 bg-slate-900/50">
                <h2 className="font-semibold text-slate-300 text-lg">
                  Spezifikationen
                </h2>
              </div>
              {cars.map((car) => (
                <div
                  key={car._id}
                  className="col-span-3 p-6 relative group border-l border-slate-800"
                >
                  <button
                    onClick={() => removeCar(car._id)}
                    className="absolute top-4 right-4 bg-slate-800 hover:bg-red-600 p-1.5 rounded-full transition-colors border border-slate-700"
                  >
                    <X className="h-4 w-4 text-slate-300" />
                  </button>

                  <div className="flex flex-col items-center">
                    <div className="w-full aspect-[4/3] bg-slate-800/50 rounded-xl overflow-hidden mb-4">
                      {car.images?.[0]?.ref ? (
                        <img
                          src={car.images[0].ref}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover p-4 hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <CarFront className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white text-center mb-1">
                      {car.make} {car.model}
                    </h3>
                    {car.modelDescription && (
                      <p className="text-sm text-slate-300 text-center line-clamp-1 mb-2">
                        {car.modelDescription}
                      </p>
                    )}
                    <div className="text-lg font-semibold text-sky-400">
                      {formatPrice(car.price?.consumerPriceGross)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-800">
              <nav className="flex overflow-x-auto px-4">
                <button
                  onClick={() => setActiveTab("specs")}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "specs"
                      ? "text-sky-400 border-sky-400"
                      : "text-slate-400 border-transparent hover:text-slate-300"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Technische Daten
                </button>
                <button
                  onClick={() => setActiveTab("features")}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "features"
                      ? "text-sky-400 border-sky-400"
                      : "text-slate-400 border-transparent hover:text-slate-300"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  Ausstattung
                </button>
                <button
                  onClick={() => setActiveTab("safety")}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === "safety"
                      ? "text-sky-400 border-sky-400"
                      : "text-slate-400 border-transparent hover:text-slate-300"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Sicherheit
                </button>
              </nav>
            </div>

            {/* Tab Content */}
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

          {/* Summary Section */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                Zusammenfassung
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {cars.map((car) => (
                <div
                  key={`summary-${car._id}`}
                  className="p-6 h-full flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg text-white">
                          {car.make} {car.model}
                        </h4>
                        {car.modelDescription && (
                          <p className="text-sm text-slate-300">
                            {car.modelDescription}
                          </p>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-sky-400">
                        {formatPrice(car.price?.consumerPriceGross)}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kilometerstand:</span>
                        <span className="font-medium">
                          {car.mileage?.toLocaleString("de-DE")} km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Erstzulassung:</span>
                        <span className="font-medium">
                          {formatDate(car.firstRegistration)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Leistung:</span>
                        <span className="font-medium">{car.power} PS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Kraftstoff:</span>
                        <span className="font-medium">{car.fuel}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/gebrauchtwagen/${car._id}`}>
                    <button
                      className={`${baseBtn} w-full bg-sky-600 text-white hover:bg-sky-500`}
                    >
                      Fahrzeugdetails <ArrowRight className="h-4 w-4" />
                    </button>
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
