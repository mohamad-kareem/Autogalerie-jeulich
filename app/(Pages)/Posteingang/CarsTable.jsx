"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  FiTrash2,
  FiEye,
  FiX,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiZap,
  FiUser,
  FiMail,
  FiPhone,
  FiInfo,
  FiCheck,
  FiLayers,
  FiShield,
  FiSettings,
  FiStar,
  FiNavigation,
  FiExternalLink,
  FiTag,
  FiMessageSquare,
} from "react-icons/fi";
import { FaCar, FaGasPump, FaCarCrash, FaTools } from "react-icons/fa";
import { GiCarDoor, GiCarSeat, GiGearStick, GiWeight } from "react-icons/gi";
import { MdAir, MdColorLens } from "react-icons/md";
import { motion } from "framer-motion";
import ImageSlider from "@/app/(Pages)/gebrauchtwagen/[id]/ImageSlider";

export default function CarsTable({ darkMode = false }) {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const carsPerPage = 10;
  const router = useRouter();

  // Theme helpers for consistent styling
  const cardBg = darkMode ? "bg-gray-900/80" : "bg-white";
  const cardBgSoft = darkMode ? "bg-gray-900/60" : "bg-slate-50";
  const borderColor = darkMode ? "border-gray-700" : "border-slate-200";
  const headerBg = darkMode ? "bg-gray-900" : "bg-slate-100";
  const rowHover = darkMode ? "hover:bg-gray-800/50" : "hover:bg-slate-50";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/manualcars");
      const data = await res.json();
      setCars(data);
    } catch {
      toast.error("Fahrzeuge konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!confirm("Möchten Sie dieses Fahrzeug wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/manualcars/${carId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Fahrzeug erfolgreich gelöscht");
        setCars((prev) => prev.filter((c) => c._id !== carId));
        setSelectedCar(null);
      } else {
        toast.error("Fehler beim Löschen des Fahrzeugs");
      }
    } catch {
      toast.error("Netzwerkfehler");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("de-DE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Ungültiges Datum";
    }
  };

  const formatPrice = (price) => {
    if (!price) return "— €";
    return (
      price.toLocaleString("de-DE", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }) + " €"
    );
  };

  // Professional detail card renderer - similar to your original but cleaner
  const renderDetailCard = (icon, label, value, unit = "") => {
    if (value === undefined || value === null || value === "") return null;

    return (
      <div
        className={`p-3 rounded-lg ${
          darkMode ? "bg-gray-800/30" : "bg-gray-50"
        } transition-colors hover:${
          darkMode ? "bg-gray-700/30" : "bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={darkMode ? "text-gray-400" : "text-gray-500"}>
            {icon}
          </div>
          <h4
            className={`text-xs font-semibold uppercase tracking-wider ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {label}
          </h4>
        </div>
        <p
          className={`text-sm font-medium ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {value} {unit && <span className="text-gray-400">{unit}</span>}
        </p>
      </div>
    );
  };

  // Pagination
  const indexOfLast = currentPage * carsPerPage;
  const indexOfFirst = indexOfLast - carsPerPage;
  const currentCars = cars.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(cars.length / carsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[260px]">
        <div
          className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${
            darkMode ? "border-slate-400" : "border-slate-600"
          }`}
        />
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div
        className={`rounded-xl px-6 py-8 text-center shadow-sm ${cardBg} ${borderColor} border`}
      >
        <FiInfo
          className={`mx-auto mb-4 text-4xl ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        />
        <h3
          className={`text-lg font-semibold mb-1 ${
            darkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Keine Fahrzeuge gefunden
        </h3>
        <p className={`text-sm ${textSecondary}`}>
          Es wurden bisher keine Fahrzeuge hinzugefügt.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={`rounded-xl border overflow-hidden shadow-sm ${cardBg} ${borderColor}`}
      >
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div
            className={`grid grid-cols-12 px-4 py-3 border-b text-[11px] font-medium uppercase tracking-wider ${headerBg} ${
              darkMode
                ? "border-gray-800 text-slate-300"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <div className="col-span-5">Fahrzeug</div>
            <div className="col-span-2">Preis</div>
            <div className="col-span-2">Kilometer</div>
            <div className="col-span-2">Hinzugefügt</div>
            <div className="col-span-1 text-right">Aktionen</div>
          </div>

          {currentCars.map((car) => (
            <div
              key={car._id}
              className={`grid grid-cols-12 px-4 py-3 border-b ${
                darkMode ? "border-gray-800" : "border-slate-200"
              } text-base items-center cursor-pointer transition-colors duration-200 ${rowHover}`}
              onClick={() => {
                setSelectedCar(car);
                setActiveTab("übersicht");
              }}
            >
              {/* Fahrzeug */}
              <div className="col-span-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 h-12 w-16 ${
                      darkMode ? "bg-gray-800" : "bg-slate-100"
                    } rounded-md overflow-hidden border ${
                      darkMode ? "border-gray-700" : "border-slate-200"
                    }`}
                  >
                    {car.images?.[0] && (
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`font-medium ${
                        darkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {car.make} {car.model}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          darkMode
                            ? "bg-gray-800/40 text-slate-300 border border-gray-700"
                            : "bg-slate-100 text-slate-600 border border-slate-300"
                        }`}
                      >
                        {car.registration || "Keine Angabe"}
                      </span>
                      {car.fuel && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode
                              ? "bg-gray-800/40 text-slate-300 border border-gray-700"
                              : "bg-slate-100 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {car.fuel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preis */}
              <div className="col-span-2">
                <p
                  className={`font-medium ${
                    darkMode ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  {formatPrice(car.price)}
                </p>
              </div>

              {/* Kilometer */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <FiTrendingUp
                    className={darkMode ? "text-slate-400" : "text-slate-500"}
                    size={14}
                  />
                  <span
                    className={darkMode ? "text-slate-300" : "text-slate-700"}
                  >
                    {car.kilometers?.toLocaleString("de-DE") || "—"} km
                  </span>
                </div>
              </div>

              {/* Datum */}
              <div className="col-span-2">
                <div className={`flex items-center gap-1 text-sm ${textMuted}`}>
                  <FiCalendar size={13} />
                  <span>{formatDate(car.createdAt)}</span>
                </div>
              </div>

              {/* Aktionen */}
              <div className="col-span-1 flex justify-end items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCar(car);
                    setActiveTab("übersicht");
                  }}
                  className={`p-1.5 rounded-md text-xs border transition-colors ${
                    darkMode
                      ? "border-gray-700 text-slate-300 hover:bg-gray-800 hover:border-slate-500"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400"
                  }`}
                  title="Details anzeigen"
                >
                  <FiEye size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCar(car._id);
                  }}
                  className={`p-1.5 rounded-md text-xs border transition-colors ${
                    darkMode
                      ? "border-gray-700 text-slate-300 hover:bg-gray-800 hover:border-slate-500 hover:text-red-400"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 hover:text-red-600"
                  }`}
                  title="Fahrzeug löschen"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {currentCars.map((car) => (
            <div
              key={car._id}
              className={`border-b ${
                darkMode ? "border-gray-800" : "border-slate-200"
              }`}
            >
              <div
                className={`px-4 py-3 flex items-center justify-between cursor-pointer ${rowHover}`}
                onClick={() => {
                  setSelectedCar(car);
                  setActiveTab("übersicht");
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 h-12 w-16 ${
                      darkMode ? "bg-gray-800" : "bg-slate-100"
                    } rounded-md overflow-hidden border ${
                      darkMode ? "border-gray-700" : "border-slate-200"
                    }`}
                  >
                    {car.images?.[0] && (
                      <img
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {car.make} {car.model}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-sm ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        {formatPrice(car.price)}
                      </span>
                      <span className={`text-xs ${textSecondary}`}>
                        {car.kilometers?.toLocaleString("de-DE") || "—"} km
                      </span>
                    </div>
                    <p
                      className={`mt-1 flex items-center gap-1 text-[11px] ${textMuted}`}
                    >
                      <FiCalendar size={11} />
                      {formatDate(car.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCar(car);
                      setActiveTab("übersicht");
                    }}
                    className={`p-2 rounded-md border text-xs transition-colors ${
                      darkMode
                        ? "border-gray-700 text-slate-300 hover:bg-gray-800"
                        : "border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Details anzeigen"
                  >
                    <FiEye size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCar(car._id);
                    }}
                    className={`p-2 rounded-md border text-xs transition-colors ${
                      darkMode
                        ? "border-gray-700 text-slate-300 hover:bg-gray-800 hover:text-red-400"
                        : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-red-600"
                    }`}
                    title="Fahrzeug löschen"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`px-4 py-3 flex items-center justify-between border-t ${
              darkMode
                ? "border-gray-800 bg-gray-900/60"
                : "border-slate-200 bg-slate-100"
            }`}
          >
            <p className={`text-sm ${textMuted}`}>
              Seite <span className="font-medium">{currentPage}</span> von{" "}
              <span className="font-medium">{totalPages}</span> – {cars.length}{" "}
              Einträge
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded text-sm ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                    : "bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700"
                }`}
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded text-sm ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                    : "bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700"
                }`}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === pageNum
                        ? darkMode
                          ? "bg-slate-600 text-white"
                          : "bg-slate-600 text-white"
                        : darkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded text-sm ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                    : "bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700"
                }`}
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded text-sm ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
                    : "bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-700"
                }`}
              >
                »
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Car Detail Modal - Professional Design */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 ${
              darkMode
                ? "bg-gray-900/80 backdrop-blur-sm"
                : "bg-gray-800/60 backdrop-blur-sm"
            }`}
            onClick={() => setSelectedCar(null)}
          />

          {/* Modal Container */}
          <div
            className={`relative z-10 w-full max-w-6xl mx-auto rounded-xl shadow-xl ${
              darkMode
                ? "bg-gray-900 border border-gray-800"
                : "bg-white border border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`px-5 py-3 border-b ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg ${
                      darkMode
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <FaCar size={20} />
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {selectedCar.make} {selectedCar.model}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 flex items-center gap-1 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <FiCalendar size={12} />
                      Hinzugefügt: {formatDate(selectedCar.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCar(null)}
                  className={`p-1.5 rounded-lg ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">
              {/* Image Slider */}
              {selectedCar.images?.length > 0 && (
                <div className="mb-6">
                  <ImageSlider
                    images={selectedCar.images}
                    car={selectedCar}
                    height="h-[200px] md:h-[250px]"
                    width="w-full"
                  />
                </div>
              )}

              {/* Tabs */}
              <div className="mb-6">
                <nav className="flex space-x-1">
                  {["übersicht", "technik", "ausstattung", "kontakt"].map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          activeTab === tab
                            ? darkMode
                              ? "bg-gray-800 text-white"
                              : "bg-slate-100 text-slate-900"
                            : darkMode
                            ? "text-gray-400 hover:text-white hover:bg-gray-800/50"
                            : "text-gray-500 hover:text-gray-900 hover:bg-slate-50"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </nav>
              </div>

              {/* Content Sections */}
              <div className="space-y-6">
                {/* Overview Tab - Shows all important fields like original */}
                {activeTab === "übersicht" && (
                  <div className="space-y-6">
                    {/* Key Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {renderDetailCard(
                        <FiDollarSign />,
                        "Preis",
                        formatPrice(selectedCar.price)
                      )}
                      {renderDetailCard(
                        <FiTrendingUp />,
                        "Kilometerstand",
                        selectedCar.kilometers?.toLocaleString("de-DE"),
                        "km"
                      )}
                      {renderDetailCard(
                        <FiCalendar />,
                        "Erstzulassung",
                        selectedCar.registration
                      )}
                      {renderDetailCard(
                        <FaGasPump />,
                        "Kraftstoffart",
                        selectedCar.fuel
                      )}
                      {renderDetailCard(
                        <GiGearStick />,
                        "Getriebe",
                        selectedCar.transmission
                      )}
                      {renderDetailCard(
                        <FiZap />,
                        "Leistung",
                        selectedCar.power,
                        "kW"
                      )}
                      {renderDetailCard(<FiZap />, "PS", selectedCar.hp, "HP")}
                      {renderDetailCard(
                        <FiCheck />,
                        "Zustand",
                        selectedCar.condition
                      )}
                      {renderDetailCard(
                        <FaCarCrash />,
                        "Unfallfrei",
                        selectedCar.accidentFree ? "Ja" : "Nein"
                      )}
                      {renderDetailCard(
                        <FiUser />,
                        "Vorbesitzer",
                        selectedCar.previousOwners
                      )}
                      {renderDetailCard(
                        <GiCarDoor />,
                        "Türen",
                        selectedCar.doors
                      )}
                      {renderDetailCard(
                        <GiCarSeat />,
                        "Sitze",
                        selectedCar.seats
                      )}
                      {renderDetailCard(
                        <FiShield />,
                        "Status",
                        selectedCar.status
                      )}
                      {renderDetailCard(
                        <FiSettings />,
                        "Kategorie",
                        selectedCar.category
                      )}
                      {renderDetailCard(
                        <FiSettings />,
                        "Modellreihe",
                        selectedCar.modelSeries
                      )}
                      {renderDetailCard(
                        <FiSettings />,
                        "Ausstattungslinie",
                        selectedCar.equipmentLine
                      )}
                      {renderDetailCard(
                        <FiSettings />,
                        "Aktiv",
                        selectedCar.active ? "Ja" : "Nein"
                      )}
                      {renderDetailCard(
                        <FiSettings />,
                        "Betriebsbereit",
                        selectedCar.operational ? "Ja" : "Nein"
                      )}
                      {renderDetailCard(
                        <FiSettings />,
                        "Name",
                        selectedCar.name
                      )}
                      {renderDetailCard(<FiSettings />, "VIN", selectedCar.vin)}
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FiMessageSquare
                          className={
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }
                          size={14}
                        />
                        <h4
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Beschreibung
                        </h4>
                      </div>
                      <div
                        className={`rounded-lg p-4 ${
                          darkMode ? "bg-gray-800/30" : "bg-gray-50"
                        }`}
                      >
                        <p
                          className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            darkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {selectedCar.description ||
                            "Keine Beschreibung vorhanden."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tech Tab - Shows all technical details */}
                {activeTab === "technik" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {renderDetailCard(
                      <FiSettings />,
                      "Hubraum",
                      selectedCar.displacement,
                      "ccm"
                    )}
                    {renderDetailCard(
                      <FiSettings />,
                      "Zylinder",
                      selectedCar.cylinders
                    )}
                    {renderDetailCard(
                      <FiNavigation />,
                      "Antriebsart",
                      selectedCar.driveType
                    )}
                    {renderDetailCard(
                      <GiWeight />,
                      "Gewicht",
                      selectedCar.weight,
                      "kg"
                    )}
                    {renderDetailCard(
                      <FiNavigation />,
                      "Anhängelast gebremst",
                      selectedCar.towCapacityBraked,
                      "kg"
                    )}
                    {renderDetailCard(
                      <FiNavigation />,
                      "Anhängelast ungebremst",
                      selectedCar.towCapacityUnbraked,
                      "kg"
                    )}
                    {renderDetailCard(
                      <FaGasPump />,
                      "Tankvolumen",
                      selectedCar.tankCapacity,
                      "L"
                    )}
                    {renderDetailCard(
                      <FaGasPump />,
                      "Verbrauch kombiniert",
                      selectedCar.fuelConsumption,
                      "L/100km"
                    )}
                    {renderDetailCard(
                      <MdAir />,
                      "CO2-Emission",
                      selectedCar.co2Emission,
                      "g/km"
                    )}
                    {renderDetailCard(
                      <FiShield />,
                      "Emissionsklasse",
                      selectedCar.emissionClass
                    )}
                    {renderDetailCard(
                      <FiShield />,
                      "Umweltplakette",
                      selectedCar.environmentalBadge
                    )}
                    {renderDetailCard(
                      <FiCalendar />,
                      "TÜV bis",
                      selectedCar.inspectionDate
                    )}
                    {renderDetailCard(
                      <FaTools />,
                      "Motorschaden",
                      selectedCar.hasEngineDamage ? "Ja" : "Nein"
                    )}
                    {renderDetailCard(
                      <FiSettings />,
                      "Energieverbrauch",
                      selectedCar.energyConsumption
                    )}
                    {renderDetailCard(
                      <FiSettings />,
                      "Klimaanlage",
                      selectedCar.airConditioning
                    )}
                    {renderDetailCard(
                      <FiSettings />,
                      "Airbags",
                      selectedCar.airbags
                    )}
                    {renderDetailCard(
                      <FiSettings />,
                      "Einparkhilfe",
                      selectedCar.parkingAssistance
                    )}
                  </div>
                )}

                {/* Features Tab */}
                {activeTab === "ausstattung" && (
                  <div className="space-y-6">
                    {/* Colors & Materials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {renderDetailCard(
                        <MdColorLens />,
                        "Außenfarbe",
                        selectedCar.exteriorColor
                      )}
                      {renderDetailCard(
                        <MdColorLens />,
                        "Außenfarbe (einfach)",
                        selectedCar.exteriorColorSimple
                      )}
                      {renderDetailCard(
                        <MdColorLens />,
                        "Innenfarbe",
                        selectedCar.interiorColor
                      )}
                      {renderDetailCard(
                        <MdColorLens />,
                        "Innenfarbe (einfach)",
                        selectedCar.interiorColorSimple
                      )}
                      {renderDetailCard(
                        <FiLayers />,
                        "Innenmaterial",
                        selectedCar.interiorMaterial
                      )}
                    </div>

                    {/* Features Grids */}
                    {selectedCar.features?.length > 0 && (
                      <div>
                        <h4
                          className={`text-sm font-semibold mb-3 flex items-center ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <FiStar className="mr-2" />
                          Serienausstattung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedCar.features.map((feature, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded ${
                                darkMode ? "bg-gray-800/30" : "bg-gray-50"
                              } border ${
                                darkMode ? "border-gray-700" : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FiCheck
                                  className={`flex-shrink-0 ${
                                    darkMode
                                      ? "text-green-400"
                                      : "text-green-500"
                                  }`}
                                  size={14}
                                />
                                <span
                                  className={`text-sm ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  {feature}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCar.specialFeatures?.length > 0 && (
                      <div>
                        <h4
                          className={`text-sm font-semibold mb-3 flex items-center ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <FiStar className="mr-2" />
                          Sonderausstattung
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedCar.specialFeatures.map((feature, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded ${
                                darkMode ? "bg-blue-900/10" : "bg-blue-50"
                              } border ${
                                darkMode
                                  ? "border-blue-800/30"
                                  : "border-blue-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FiStar
                                  className={`flex-shrink-0 ${
                                    darkMode ? "text-blue-400" : "text-blue-500"
                                  }`}
                                  size={14}
                                />
                                <span
                                  className={`text-sm ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  {feature}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Tab */}
                {activeTab === "kontakt" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-gray-800/30" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <FiUser
                          className={
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }
                          size={16}
                        />
                        <h4
                          className={`text-sm font-semibold ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Kontaktinformationen
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {selectedCar.contact?.fullName && (
                          <div className="flex items-center gap-2">
                            <FiUser
                              className={`flex-shrink-0 ${
                                darkMode ? "text-blue-400" : "text-blue-500"
                              }`}
                              size={14}
                            />
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {selectedCar.contact.fullName}
                            </span>
                          </div>
                        )}
                        {selectedCar.contact?.email && (
                          <div className="flex items-center gap-2">
                            <FiMail
                              className={`flex-shrink-0 ${
                                darkMode ? "text-blue-400" : "text-blue-500"
                              }`}
                              size={14}
                            />
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {selectedCar.contact.email}
                            </span>
                          </div>
                        )}
                        {selectedCar.contact?.phone && (
                          <div className="flex items-center gap-2">
                            <FiPhone
                              className={`flex-shrink-0 ${
                                darkMode ? "text-green-400" : "text-green-500"
                              }`}
                              size={14}
                            />
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-200" : "text-gray-800"
                              }`}
                            >
                              {selectedCar.contact.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className={`px-5 py-3 border-t ${
                darkMode ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCar(null)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
                      darkMode
                        ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    Schließen
                  </button>

                  <button
                    onClick={() => handleDeleteCar(selectedCar._id)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1.5 ${
                      darkMode
                        ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300"
                        : "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                    }`}
                  >
                    <FiTrash2 size={14} />
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
