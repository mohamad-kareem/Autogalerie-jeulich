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

const WRAPPER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

const ComparePage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("specs");

  const baseBtn =
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition active:scale-[0.98]";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const carIds = params.getAll("id");

    const storedComparison = JSON.parse(
      localStorage.getItem("carComparison") || "[]",
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
        }),
      );

      setCars(responses.filter(Boolean));
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
      JSON.stringify(updatedCars.map((car) => car._id)),
    );
  };

  const formatPrice = (price) => {
    if (!price) return "Auf Anfrage";

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

    const firstValue = JSON.stringify(cars[0][key]);

    return cars.every((car) => JSON.stringify(car[key]) === firstValue);
  };

  const renderComparisonRow = (title, icon, key, formatter = (val) => val) => {
    return (
      <div className="grid grid-cols-12 border-b border-black/[0.06] transition hover:bg-[#f7faf6]">
        <div className="col-span-12 flex items-center gap-2 px-4 py-3 text-[13px] font-semibold text-[#5f695f] md:col-span-3">
          {icon &&
            React.cloneElement(icon, {
              className: "h-4 w-4 text-[#146c2e]",
            })}
          <span>{title}</span>
        </div>

        {cars.map((car) => (
          <div
            key={`${car._id}-${key}`}
            className={`col-span-6 px-4 py-3 text-center text-[13px] md:col-span-3 ${
              allValuesEqual(key)
                ? "text-[#5f695f]"
                : "font-semibold text-[#101510]"
            }`}
          >
            {car[key] ? formatter(car[key], car) : "-"}
          </div>
        ))}
      </div>
    );
  };

  const renderFeatureRow = (title, icon, key) => {
    return (
      <div className="grid grid-cols-12 border-b border-black/[0.06] transition hover:bg-[#f7faf6]">
        <div className="col-span-12 flex items-center gap-2 px-4 py-3 text-[13px] font-semibold text-[#5f695f] md:col-span-3">
          {icon &&
            React.cloneElement(icon, {
              className: "h-4 w-4 text-[#146c2e]",
            })}
          <span>{title}</span>
        </div>

        {cars.map((car) => (
          <div
            key={`${car._id}-${key}`}
            className="col-span-6 flex justify-center px-4 py-3 md:col-span-3"
          >
            {car[key] ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f1e9]">
                <Check className="h-4 w-4 text-[#146c2e]" />
              </span>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                <X className="h-4 w-4 text-red-500" />
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-2 border-[#146c2e]/20 border-t-[#146c2e]"
        />
      </main>
    );
  }

  if (cars.length < 2) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f3] px-4">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white p-7 text-center shadow-[0_18px_60px_-30px_rgba(7,17,31,0.22)]"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
            <Scale className="h-8 w-8" />
          </div>

          <h1 className="text-[24px] font-semibold tracking-[-0.04em] text-[#07111f]">
            Vergleich nicht möglich
          </h1>

          <p className="mt-2 text-[14px] leading-6 text-[#5f695f]">
            {cars.length === 0
              ? "Sie haben keine Fahrzeuge zum Vergleich ausgewählt."
              : "Sie müssen mindestens 2 Fahrzeuge zum Vergleich auswählen."}
          </p>

          <Link
            href="/gebrauchtwagen"
            className={`${baseBtn} mt-6 bg-[#146c2e] text-white hover:bg-[#0f5724]`}
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück zur Fahrzeugliste
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f3] py-6 sm:py-10">
      <div className={WRAPPER}>
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 border-b border-black/[0.08] pb-5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/gebrauchtwagen"
            className="inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-[#5f695f] transition hover:text-[#146c2e]"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück
          </Link>

          <div className="text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
              <Scale className="h-5 w-5" />
            </div>

            <h1 className="text-[28px] font-semibold tracking-[-0.05em] text-[#07111f] sm:text-4xl">
              Fahrzeugvergleich
            </h1>

            <p className="mt-1 text-[13px] text-[#5f695f]">
              {cars.length} von 3 Fahrzeugen ausgewählt
            </p>
          </div>

          <div className="hidden w-[70px] sm:block" />
        </div>

        {/* MOBILE CARDS */}
        <div className="mb-6 space-y-3 md:hidden">
          {cars.map((car) => (
            <motion.div
              key={car._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm"
            >
              <div className="relative aspect-[16/9] bg-[#eef0ec]">
                {car.images?.[0]?.ref ? (
                  <img
                    src={car.images[0].ref}
                    alt={`${car.make} ${car.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#9aa39a]">
                    <CarFront className="h-12 w-12" />
                  </div>
                )}

                <button
                  onClick={() => removeCar(car._id)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#101510] shadow-md transition hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[17px] font-semibold tracking-[-0.03em] text-[#07111f]">
                      {car.make} {car.model}
                    </h3>

                    {car.modelDescription && (
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-[#5f695f]">
                        {car.modelDescription}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-[16px] font-semibold text-[#146c2e]">
                    {formatPrice(car.price?.consumerPriceGross)}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 text-[12px] text-[#263126]">
                  <MiniSpec
                    icon={<Gauge />}
                    text={`${car.mileage?.toLocaleString("de-DE") || "-"} km`}
                  />
                  <MiniSpec
                    icon={<Calendar />}
                    text={formatDate(car.firstRegistration)}
                  />
                  <MiniSpec icon={<Zap />} text={`${car.power || "-"} PS`} />
                  <MiniSpec icon={<Fuel />} text={car.fuel || "-"} />
                </div>

                <Link
                  href={`/gebrauchtwagen/${car._id}`}
                  className={`${baseBtn} w-full bg-[#146c2e] text-white hover:bg-[#0f5724]`}
                >
                  Details anzeigen
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_18px_60px_-35px_rgba(7,17,31,0.22)] md:block">
          <div className="grid grid-cols-12 border-b border-black/[0.06]">
            <div className="col-span-3 bg-[#fafbf9] p-5">
              <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#07111f]">
                Spezifikationen
              </h2>
            </div>

            {cars.map((car) => (
              <div
                key={car._id}
                className="relative col-span-3 border-l border-black/[0.06] p-5"
              >
                <button
                  onClick={() => removeCar(car._id)}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col items-center">
                  <div className="mb-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#eef0ec]">
                    {car.images?.[0]?.ref ? (
                      <img
                        src={car.images[0].ref}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#9aa39a]">
                        <CarFront className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-center text-[17px] font-semibold tracking-[-0.03em] text-[#07111f]">
                    {car.make} {car.model}
                  </h3>

                  {car.modelDescription && (
                    <p className="mt-1 line-clamp-1 text-center text-[12px] text-[#5f695f]">
                      {car.modelDescription}
                    </p>
                  )}

                  <div className="mt-2 text-[18px] font-semibold text-[#146c2e]">
                    {formatPrice(car.price?.consumerPriceGross)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div className="border-b border-black/[0.06] bg-[#fafbf9]">
            <nav className="flex overflow-x-auto px-4">
              <TabButton
                active={activeTab === "specs"}
                onClick={() => setActiveTab("specs")}
                icon={<Settings />}
                label="Technische Daten"
              />

              <TabButton
                active={activeTab === "features"}
                onClick={() => setActiveTab("features")}
                icon={<Star />}
                label="Ausstattung"
              />

              <TabButton
                active={activeTab === "safety"}
                onClick={() => setActiveTab("safety")}
                icon={<ShieldCheck />}
                label="Sicherheit"
              />
            </nav>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "specs" && (
                <div>
                  {renderComparisonRow(
                    "Marke & Modell",
                    <CarFront className="h-4 w-4" />,
                    "make",
                    (val, car) => `${val} ${car.model}`,
                  )}

                  {renderComparisonRow(
                    "Erstzulassung",
                    <Calendar className="h-4 w-4" />,
                    "firstRegistration",
                    formatDate,
                  )}

                  {renderComparisonRow(
                    "Kilometerstand",
                    <Gauge className="h-4 w-4" />,
                    "mileage",
                    (val) => `${val?.toLocaleString("de-DE")} km`,
                  )}

                  {renderComparisonRow("Preis", null, "price", (val) =>
                    formatPrice(val?.consumerPriceGross),
                  )}

                  {renderComparisonRow(
                    "Kraftstoff",
                    <Fuel className="h-4 w-4" />,
                    "fuel",
                  )}

                  {renderComparisonRow(
                    "Leistung",
                    <Zap className="h-4 w-4" />,
                    "power",
                    (val) => `${val} PS`,
                  )}

                  {renderComparisonRow(
                    "Getriebe",
                    <Settings className="h-4 w-4" />,
                    "gearbox",
                  )}

                  {renderComparisonRow(
                    "Türen / Sitze",
                    <Car className="h-4 w-4" />,
                    "doors",
                    (val, car) =>
                      `${String(val).replace(/_/g, " ").toLowerCase()} / ${
                        car.seats || "-"
                      }`,
                  )}
                </div>
              )}

              {activeTab === "features" && (
                <div>
                  {renderFeatureRow(
                    "Zertifiziert",
                    <BadgeCheck className="h-4 w-4" />,
                    "certified",
                  )}
                  {renderFeatureRow("Garantie", null, "warranty")}
                  {renderFeatureRow(
                    "Klimaanlage",
                    <Snowflake className="h-4 w-4" />,
                    "climatisation",
                  )}
                  {renderFeatureRow(
                    "Sitzheizung",
                    <Sun className="h-4 w-4" />,
                    "electricHeatedSeats",
                  )}
                  {renderFeatureRow(
                    "Ledersitze",
                    <Armchair className="h-4 w-4" />,
                    "leatherSeats",
                  )}
                  {renderFeatureRow(
                    "Navigation",
                    <MapPin className="h-4 w-4" />,
                    "navigationSystem",
                  )}
                  {renderFeatureRow(
                    "Bluetooth",
                    <Wifi className="h-4 w-4" />,
                    "bluetooth",
                  )}
                </div>
              )}

              {activeTab === "safety" && (
                <div>
                  {renderFeatureRow(
                    "Einparkhilfe",
                    <ParkingMeter className="h-4 w-4" />,
                    "parkingAssist",
                  )}
                  {renderFeatureRow(
                    "LED-Scheinwerfer",
                    <Lightbulb className="h-4 w-4" />,
                    "ledHeadlights",
                  )}
                  {renderFeatureRow(
                    "Keyless Go",
                    <Key className="h-4 w-4" />,
                    "keylessEntry",
                  )}
                  {renderFeatureRow(
                    "Totwinkelwarner",
                    null,
                    "blindSpotMonitor",
                  )}
                  {renderFeatureRow(
                    "Notbremsassistent",
                    null,
                    "emergencyBrakeAssist",
                  )}
                  {renderFeatureRow(
                    "Spurhalteassistent",
                    null,
                    "laneKeepAssist",
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SUMMARY */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_18px_60px_-35px_rgba(7,17,31,0.22)]">
          <div className="border-b border-black/[0.06] bg-[#fafbf9] px-5 py-4">
            <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[#07111f]">
              Zusammenfassung
            </h3>
          </div>

          <div className="grid grid-cols-1 divide-y divide-black/[0.06] md:grid-cols-3 md:divide-x md:divide-y-0">
            {cars.map((car) => (
              <div
                key={`summary-${car._id}`}
                className="flex h-full flex-col justify-between p-5"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-[17px] font-semibold tracking-[-0.03em] text-[#07111f]">
                        {car.make} {car.model}
                      </h4>

                      {car.modelDescription && (
                        <p className="mt-0.5 line-clamp-1 text-[12px] text-[#5f695f]">
                          {car.modelDescription}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-[16px] font-semibold text-[#146c2e]">
                      {formatPrice(car.price?.consumerPriceGross)}
                    </div>
                  </div>

                  <div className="mb-5 space-y-2.5 text-[13px]">
                    <SummaryRow
                      label="Kilometerstand"
                      value={`${car.mileage?.toLocaleString("de-DE") || "-"} km`}
                    />
                    <SummaryRow
                      label="Erstzulassung"
                      value={formatDate(car.firstRegistration)}
                    />
                    <SummaryRow
                      label="Leistung"
                      value={`${car.power || "-"} PS`}
                    />
                    <SummaryRow label="Kraftstoff" value={car.fuel || "-"} />
                  </div>
                </div>

                <Link
                  href={`/gebrauchtwagen/${car._id}`}
                  className={`${baseBtn} w-full bg-[#146c2e] text-white hover:bg-[#0f5724]`}
                >
                  Fahrzeugdetails
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

function MiniSpec({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#f5f7f3] px-3 py-2">
      {React.cloneElement(icon, {
        className: "h-3.5 w-3.5 text-[#146c2e]",
      })}
      <span className="truncate">{text}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition ${
        active
          ? "border-[#146c2e] text-[#146c2e]"
          : "border-transparent text-[#5f695f] hover:text-[#101510]"
      }`}
    >
      {React.cloneElement(icon, {
        className: "h-4 w-4",
      })}
      {label}
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#6b756b]">{label}:</span>
      <span className="font-semibold text-[#101510]">{value}</span>
    </div>
  );
}

export default ComparePage;
