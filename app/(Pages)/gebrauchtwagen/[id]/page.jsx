"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/app/(components)/CarsDetails/LoadingSpinner";
import ContactForm from "@/app/(components)/CarsDetails/ContactForm";
import SpecItem from "@/app/(components)/CarsDetails/SpecItem";
import { FiArrowLeft, FiShare2, FiHeart, FiPrinter } from "react-icons/fi";
import {
  FaGasPump,
  FaTachometerAlt,
  FaCar,
  FaCalendarAlt,
  FaCarSide,
  FaCarCrash,
  FaTools,
} from "react-icons/fa";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { TbEngine, TbManualGearbox } from "react-icons/tb";

const CarDetailsPage = () => {
  // <-- this is now "id" instead of "slug"
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await fetch(`/api/cars/${id}`); // <-- fetch by id now!
        if (!res.ok) throw new Error("Failed to fetch car details");
        const data = await res.json();
        setCar(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const printPage = () => {
    window.print();
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/gebrauchtwagen"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <FiArrowLeft className="mr-2" />
            Zurück zur Fahrzeugliste
          </Link>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Fahrzeug nicht gefunden
          </h2>
          <p className="text-gray-600 mb-6">
            Das angeforderte Fahrzeug konnte nicht gefunden werden.
          </p>
          <Link
            href="/gebrauchtwagen"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <FiArrowLeft className="mr-2" />
            Zurück zur Fahrzeugliste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen mt-15">
      {/* Sticky header */}
      <header className="sticky top-0 z-20  border-b border-gray-200">
        <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/gebrauchtwagen"
              className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors group"
            >
              <FiArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Zurück zur Fahrzeugliste</span>
            </Link>

            <div className="flex gap-2">
              <button
                onClick={printPage}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Drucken"
              >
                <FiPrinter className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link wurde in die Zwischenablage kopiert!");
                }}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Teilen"
              >
                <FiShare2 className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFavorite}
                className={`p-2 transition-colors rounded-lg hover:bg-gray-100 ${
                  isFavorite
                    ? "text-red-500"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                aria-label="Favorit"
              >
                <FiHeart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Vehicle header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  {car.condition}
                </span>
                {car.hasEngineDamage && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    Motorschaden
                  </span>
                )}
                {car.accidentFree && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Unfallfrei
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {car.name} <span className="text-gray-700">{car.model}</span>
              </h1>
              <p className="text-lg text-gray-600 mt-1">{car.subtitle}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <span className="block text-sm font-medium text-gray-500">
                Preis ab
              </span>
              <span className="block text-2xl md:text-3xl font-bold text-gray-900">
                {formatPrice(car.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Modern Image Gallery */}
            <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300">
              <button
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg shadow-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
                onClick={() => setFullscreenImage(activeImage)}
                aria-label="Vollbild"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>

              <div className="relative h-96 w-full transition-opacity duration-300">
                <Image
                  src={car.images?.[activeImage] || "/default-car.jpg"}
                  alt={`${car.name} ${car.model}`}
                  fill
                  className="object-contain p-4 transition-transform duration-500 ease-in-out group-hover:scale-[1.02]"
                  priority
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                />
              </div>

              {car.images?.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImage((prev) =>
                        prev === 0 ? car.images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-red-500 text-gray-800 p-3 rounded-full shadow-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 hover:scale-110"
                    aria-label="Vorheriges Bild"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() =>
                      setActiveImage((prev) =>
                        prev === car.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-red-500 text-gray-800 p-3 rounded-full shadow-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 hover:scale-110"
                    aria-label="Nächstes Bild"
                  >
                    <FiArrowLeft className="w-5 h-5 transform rotate-180" />
                  </button>
                </>
              )}

              {car.images?.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm backdrop-blur-sm">
                  {activeImage + 1}{" "}
                  <span className="text-gray-500">/ {car.images.length}</span>
                </div>
              )}

              {car.images?.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-red-200 transition-all duration-300"
                    style={{
                      width: `${
                        ((activeImage + 1) / car.images.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              )}
            </div>

            {car.images?.length > 1 && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

                <div className="flex space-x-3 overflow-x-auto py-2 px-1 scrollbar-hide -mx-1">
                  {car.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`relative flex-shrink-0 w-20 h-20 bg-white rounded-lg border overflow-hidden transition-all duration-200 ease-in-out ${
                        activeImage === index
                          ? "ring-2 ring-red-500 border-transparent scale-105"
                          : "border-gray-200 hover:border-gray-300 hover:scale-105"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${car.name} - Bild ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      {activeImage === index && (
                        <div className="absolute inset-0 bg-black/20"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === "overview"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Übersicht
                  </button>
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === "specs"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Technische Daten
                  </button>
                  <button
                    onClick={() => setActiveTab("equipment")}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === "equipment"
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Ausstattung
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Beschreibung
                    </h2>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                      {car.description}
                    </div>

                    {car.hasEngineDamage && (
                      <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                          <FaCarCrash className="text-red-600" />
                          Motorschaden
                        </h3>
                        <p className="text-red-700 mt-1">
                          Dieses Fahrzeug hat einen Motorschaden. Bitte
                          kontaktieren Sie uns für weitere Informationen.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "specs" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-3 text-gray-800">
                        <FaCarSide className="text-red-500" />
                        Fahrzeugdaten
                      </h3>
                      <ul className="space-y-3">
                        <SpecItem
                          label="Fahrzeugzustand"
                          value={car.condition}
                        />
                        <SpecItem
                          label="Kilometerstand"
                          value={`${car.kilometers.toLocaleString("de-DE")} km`}
                        />
                        <SpecItem
                          label="Erstzulassung"
                          value={car.registration || "N/A"}
                        />
                        <SpecItem label="Kraftstoff" value={car.fuel} />
                        <SpecItem
                          label="Leistung"
                          value={`${car.power} kW (${car.hp} PS)`}
                        />
                        <SpecItem label="Getriebe" value={car.transmission} />
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-3 text-gray-800">
                        <FaTools className="text-red-500" />
                        Motor & Getriebe
                      </h3>
                      <ul className="space-y-3">
                        <SpecItem
                          label="Hubraum"
                          value={`${car.displacement} l`}
                        />
                        <SpecItem label="Zylinder" value={car.cylinders} />
                        <SpecItem label="Antriebsart" value={car.driveType} />
                        <SpecItem
                          label="Kraftstoffverbrauch"
                          value={`${car.fuelConsumption} l/100km`}
                        />
                        <SpecItem
                          label="CO₂-Emissionen"
                          value={`${car.co2Emission} g/km`}
                        />
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "equipment" && car.features?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Ausstattung
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {car.features.map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <svg
                            className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Details and contact */}
          <div className="space-y-6">
            {/* Action buttons */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                  Probefahrt vereinbaren
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  Erleben Sie dieses Fahrzeug live!
                </p>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-800 py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Termin anfragen
                </button>
              </div>
            </div>

            {/* Quick specs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Kurzübersicht
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaTachometerAlt className="text-gray-400 mr-3 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-500">Kilometerstand</p>
                    <p className="font-medium text-gray-900">
                      {car.kilometers.toLocaleString("de-DE")} km
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="text-gray-400 mr-3 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-500">Erstzulassung</p>
                    <p className="font-medium text-gray-900">
                      {car.registration || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaGasPump className="text-gray-400 mr-3 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-500">Kraftstoff</p>
                    <p className="font-medium text-gray-900">{car.fuel}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <TbEngine className="text-gray-400 mr-3 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-500">Leistung</p>
                    <p className="font-medium text-gray-900">
                      {car.power} kW ({car.hp} PS)
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <TbManualGearbox className="text-gray-400 mr-3 w-5 h-5" />
                  <div>
                    <p className="text-sm text-gray-500">Getriebe</p>
                    <p className="font-medium text-gray-900">
                      {car.transmission}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
              <div className="mb-4">
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Autogalerie Jülich
                </h3>
                <p className="text-xs text-gray-600 uppercase tracking-wider mt-1">
                  Premium Automobilhandel
                </p>
              </div>

              <div className="space-y-5">
                {/* Address */}
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-gray-900 font-medium">
                      Alte Dürenerstraße 4
                    </p>
                    <p className="text-gray-900 font-medium">52428 Jülich</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="w-5 h-5 text-gray-500" />
                  <p className="text-gray-900 font-medium">
                    +49 (0)2461 9163780
                  </p>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                  <a
                    href="mailto:anfrage@juelicherautozentrum.de"
                    className="text-gray-900 font-medium hover:text-blue-500"
                  >
                    anfrage@juelicherautozentrum.de
                  </a>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  Mo–Fr 9:00–18:00 • Sa 10:00–14:00
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-20">
        <button
          onClick={() => setShowContactForm(true)}
          className="bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center"
        >
          <span className="sr-only">Anfrage</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
              aria-label="Schließen"
            >
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {car.images?.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setFullscreenImage((prev) =>
                      prev === 0 ? car.images.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
                  aria-label="Vorheriges Bild"
                >
                  <FiArrowLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={() =>
                    setFullscreenImage((prev) =>
                      prev === car.images.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all"
                  aria-label="Nächstes Bild"
                >
                  <FiArrowLeft className="w-8 h-8 transform rotate-180" />
                </button>
              </>
            )}

            <div className="relative w-full h-full max-w-6xl">
              <Image
                src={car.images?.[fullscreenImage] || "/default-car.jpg"}
                alt={`${car.name} ${car.model} (Vollbild)`}
                fill
                className="object-contain"
                quality={100}
              />
            </div>

            {car.images?.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
                {fullscreenImage + 1} / {car.images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Probefahrt anfragen
                  </h3>
                  <p className="text-red-100 mt-1">
                    {car.name} {car.model}
                  </p>
                </div>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Schließen"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Vehicle info */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={car.images?.[0] || "/default-car.jpg"}
                    alt={`${car.name} ${car.model}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    {car.name} {car.model}
                  </h4>
                  <p className="text-lg font-semibold text-red-600">
                    {formatPrice(car.price)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {car.kilometers.toLocaleString("de-DE")} km •{" "}
                    {car.registration}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="p-6">
              <ContactForm car={car} />
            </div>

            {/* Footer with trust signals */}
            <div className="px-6 pb-6">
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>Datenschutz garantiert</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>Sicherer Kontakt</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  Ihre Anfrage wird direkt an unseren Verkaufsteam
                  weitergeleitet
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetailsPage;
