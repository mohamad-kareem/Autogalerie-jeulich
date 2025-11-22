"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ContactForm from "@/app/(components)/helpers/ContactForm";
import {
  FaGasPump,
  FaCar,
  FaTachometerAlt,
  FaChair,
  FaShieldAlt,
  FaMusic,
  FaSun,
  FaLightbulb,
  FaParking,
} from "react-icons/fa";
import {
  GiGearStick,
  GiCarDoor,
  GiSteeringWheel,
  GiCarWheel,
} from "react-icons/gi";
import { MdAir } from "react-icons/md";
import { IoMdColorPalette } from "react-icons/io";
import { RiTempColdLine } from "react-icons/ri";
import { BsSpeedometer2, BsCheck2 } from "react-icons/bs";
import { FiArrowLeft } from "react-icons/fi";
import FinanceCalculatorAdvanced from "@/app/(components)/helpers/FinanceCalculatorAdvanced";

// ----------------- HELPERS -----------------

const prettifyValue = (category, value) => {
  const maps = {
    climatisation: {
      AUTOMATIC_CLIMATISATION: "Automatisch",
      AUTOMATIC_CLIMATISATION_2_ZONES: "2-Zonen-Klimaautomatik",
      AUTOMATIC_CLIMATISATION_3_ZONES: "3-Zonen-Klimaautomatik",
      MANUAL_CLIMATISATION: "Manuell",
    },
    fuel: {
      DIESEL: "Diesel",
      PETROL: "Benzin",
      ELECTRIC: "Elektrisch",
      HYBRID: "Hybrid",
      LPG: "Autogas (LPG)",
      CNG: "Erdgas (CNG)",
      HYDROGEN: "Wasserstoff",
      OTHER: "Andere",
    },
    category: {
      CAR: "PKW",
      OffRoad: "SUV / Geländewagen",
      VAN: "Van / Kleinbus",
      CONVERTIBLE: "Cabrio",
      COUPE: "Coupé",
      WAGON: "Kombi",
      Limousine: "Limousine",
      SmallCar: "Kleinwagen",
      SPORTS_CAR: "Sportwagen",
      PICKUP: "Pickup",
      OTHER: "Andere",
    },
    color: {
      BLACK: "Schwarz",
      WHITE: "Weiß",
      SILVER: "Silber",
      GREY: "Grau",
      RED: "Rot",
      BLUE: "Blau",
      GREEN: "Grün",
      YELLOW: "Gelb",
      BROWN: "Braun",
      ORANGE: "Orange",
      PURPLE: "Lila",
      BEIGE: "Beige",
      GOLD: "Gold",
      PINK: "Rosa",
      MULTICOLOUR: "Mehrfarbig",
      OTHER: "Andere",
    },
    airbag: {
      FRONT_AIRBAGS: "Front",
      SIDE_AIRBAGS: "Seiten",
      FRONT_AND_SIDE_AIRBAGS: "Front & Seite",
      FRONT_AND_SIDE_AND_MORE_AIRBAGS: "Vollausstattung (Front & Seite)",
    },
    bendingLightsType: {
      ADAPTIVE_BENDING_LIGHTS: "Adaptives Kurvenlicht",
      STATIC_BENDING_LIGHTS: "Statisches Kurvenlicht",
    },
    parkingAssistants: {
      FRONT_SENSORS: "Frontsensoren",
      REAR_SENSORS: "Hecksensoren",
      CAM_360_DEGREES: "360° Kamera",
      REAR_CAMERA: "Rückfahrkamera",
      PARKING_ASSISTANT: "Parkassistent",
    },
    doors: {
      TWO: "2 Türen",
      THREE: "3 Türen",
      FOUR: "4 Türen",
      FIVE: "5 Türen",
      FOUR_OR_FIVE: "4/5 Türen",
      TWO_OR_THREE: "2/3 Türen",
      "four or five": "4/5 Türen",
    },
    gearbox: {
      MANUAL_GEAR: "Schaltgetriebe",
      AUTOMATIC_GEAR: "Automatik",
      SEMI_AUTOMATIC_GEAR: "Halbautomatik",
      NO_GEARS: "Ohne Getriebe",
    },
    driveType: {
      FRONT: "Vorderradantrieb",
      REAR: "Hinterradantrieb",
      ALL_WHEEL: "Allradantrieb",
      FOUR_WHEEL: "Vierradantrieb",
    },
  };

  if (Array.isArray(value)) {
    return value
      .map((v) => maps[category]?.[v] || v.replace(/_/g, " ").toLowerCase())
      .join(", ");
  }

  return (
    maps[category]?.[value] ||
    value
      ?.replace(/_/g, " ")
      .toLowerCase()
      ?.replace(/^\w/, (c) => c.toUpperCase()) ||
    "-"
  );
};

function renderDescription(description, isMobile = false) {
  if (!description) return null;

  const cleaned = description
    .replace(/∗/g, "\n")
    .replace(/([a-z])([A-Z])/g, "$1\n$2")
    .replace(/(?<=[a-z])([A-Z])/g, "\n$1")
    .replace(/(WIR BIETEN.*?AN:)/i, "\n$1\n")
    .replace(/(Mail\s*:|WhatsApp\s*:)/gi, "\n$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const textSize = isMobile ? "text-xs" : "text-xs sm:text-sm md:text-base";

  return lines.map((line, index) => {
    if (
      /^Mail\s*:|^WhatsApp\s*:|^WIR BIETEN|^Finanzierung|^Inzahlungnahme|^Zulassungsservice|^Auslieferungsservice/i.test(
        line
      )
    ) {
      return (
        <h4
          key={index}
          className={`mt-4 mb-1 font-semibold text-slate-50 break-words whitespace-pre-line ${
            isMobile ? "text-xs" : "text-xs sm:text-sm md:text-base"
          }`}
        >
          {line}
        </h4>
      );
    }

    if (/^[\wäöüÄÖÜß\s]+:/.test(line)) {
      const [label, ...rest] = line.split(":");
      return (
        <p
          key={index}
          className={`mb-2 text-slate-200 break-words whitespace-pre-line ${textSize}`}
        >
          <span className="font-semibold text-slate-50">{label.trim()}:</span>{" "}
          {rest.join(":").trim()}
        </p>
      );
    }

    if (line.length <= 40) {
      return (
        <li
          key={index}
          className={`ml-4 list-disc text-slate-200 break-words whitespace-pre-line ${textSize}`}
        >
          {line}
        </li>
      );
    }

    return (
      <p
        key={index}
        className={`mb-2 text-slate-200 leading-relaxed ${
          isMobile ? "text-xs" : "text-sm md:text-base"
        }`}
      >
        {line}
      </p>
    );
  });
}

const SpecCard = ({ icon, title, items, isMobile = false }) => {
  const visibleItems =
    items?.filter(
      (item) =>
        item.value !== "Nein" &&
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ""
    ) || [];

  if (visibleItems.length === 0) return null;

  if (isMobile) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            {icon}
          </div>
          <h3 className="text-xs font-semibold text-slate-50">{title}</h3>
        </div>
        <div className="space-y-1.5">
          {visibleItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 border-b border-slate-800/70 pb-1 text-xs last:border-0 last:pb-0"
            >
              <span className="text-slate-400 flex-shrink-0">{item.label}</span>
              <span className="flex items-center gap-1 font-medium text-slate-50 text-right flex-shrink-0">
                {item.value === "Ja" ? (
                  <BsCheck2 className="h-3 w-3 text-white" />
                ) : (
                  item.value || "-"
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 sm:p-5 shadow-sm shadow-black/40">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        {visibleItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 border-b border-slate-800/70 pb-1.5 text-xs sm:text-sm last:border-0 last:pb-0"
          >
            <span className="text-slate-400">{item.label}</span>
            <span className="flex items-center gap-1 font-medium text-slate-50">
              {item.value === "Ja" ? (
                <BsCheck2 className="h-5 w-5 text-white" />
              ) : (
                item.value || "-"
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------- IMAGE SLIDER COMPONENT -----------------

const ImageSlider = ({ images = [], car = {}, isMobile = false }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const imageUrls = (images || []).map((img) =>
    typeof img === "string" ? img : img?.ref
  );

  const hasImages = imageUrls.length > 0;
  const hasMultiple = imageUrls.length > 1;
  const altText = `${car.make || ""} ${car.model || ""}`.trim() || "Fahrzeug";

  const goPrev = (setter) => {
    setter((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const goNext = (setter) => {
    setter((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const sliderHeight = isMobile ? "h-64" : "h-80 lg:h-96";

  // Close fullscreen when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setFullscreenImage(null);
    }
  };

  // Close fullscreen with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setFullscreenImage(null);
      }
    };

    if (fullscreenImage !== null) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [fullscreenImage]);

  return (
    <>
      {/* MAIN SLIDER */}
      <div className="relative w-full">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-sm shadow-black/40 group">
          {/* Fullscreen Button */}
          {hasImages && (
            <button
              type="button"
              className="absolute right-2 top-2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-100 shadow-md transition-all hover:border-sky-500 hover:bg-slate-900 hover:text-white sm:right-3 sm:top-3"
              onClick={() => setFullscreenImage(activeImage)}
              aria-label="Vollbild"
            >
              <svg
                className="h-3 w-3 sm:h-4 sm:w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          )}

          {/* MAIN IMAGE */}
          <div className={`relative w-full ${sliderHeight} bg-slate-950`}>
            <Image
              src={imageUrls[activeImage] || "/default-car.jpg"}
              alt={altText}
              fill
              className="object-contain bg-gradient-to-b from-slate-900 via-slate-950 to-black transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              priority
              quality={90}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
              unoptimized
            />
          </div>

          {/* NAVIGATION ARROWS */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => goPrev(setActiveImage)}
                className="absolute left-1 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-100 shadow-md transition-all hover:border-sky-500 hover:bg-slate-900 hover:text-white active:scale-95 sm:left-2 sm:h-9 sm:w-9"
                aria-label="Vorheriges Bild"
              >
                <FiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>

              <button
                type="button"
                onClick={() => goNext(setActiveImage)}
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-100 shadow-md transition-all hover:border-sky-500 hover:bg-slate-900 hover:text-white active:scale-95 sm:right-2 sm:h-9 sm:w-9"
                aria-label="Nächstes Bild"
              >
                <FiArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 rotate-180" />
              </button>

              {/* COUNTER */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-sm ring-1 ring-slate-700">
                {activeImage + 1} / {imageUrls.length}
              </div>

              {/* PROGRESS BAR */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{
                    width: `${((activeImage + 1) / imageUrls.length) * 100}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* THUMBNAILS */}
      {hasMultiple && (
        <div className="relative mt-3">
          <div className="flex space-x-2 overflow-x-auto px-1 py-2 scrollbar-hide">
            {imageUrls.map((img, index) => {
              const isActive = activeImage === index;
              const thumbSize = isMobile ? "h-14 w-20" : "h-16 w-24";

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative flex-shrink-0 ${thumbSize} overflow-hidden rounded-xl border transition-all duration-200 ${
                    isActive
                      ? "border-sky-500 ring-2 ring-sky-500/70 scale-[1.03]"
                      : "border-slate-800 hover:border-sky-500/60 hover:scale-[1.02]"
                  }`}
                  aria-label={`Bild ${index + 1} anzeigen`}
                >
                  <Image
                    src={img || "/default-car.jpg"}
                    alt={`${altText} Bild ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes={isMobile ? "80px" : "96px"}
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL - FIXED */}
      {fullscreenImage !== null && hasImages && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-2 sm:p-4"
          onClick={handleBackdropClick}
        >
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
            {/* CLOSE BUTTON - IMPROVED */}
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute right-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-all hover:bg-black hover:text-white sm:right-4 sm:top-4"
              aria-label="Schließen"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* FULLSCREEN NAV ARROWS */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev(setFullscreenImage);
                  }}
                  className="absolute left-2 top-1/2 z-50 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-all hover:bg-black hover:text-white sm:left-4"
                  aria-label="Vorheriges Bild"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext(setFullscreenImage);
                  }}
                  className="absolute right-2 top-1/2 z-50 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-all hover:bg-black hover:text-white sm:right-4"
                  aria-label="Nächstes Bild"
                >
                  <FiArrowLeft className="h-5 w-5 rotate-180" />
                </button>
              </>
            )}

            {/* FULLSCREEN IMAGE - CLICK TO CLOSE */}
            <div
              className="pointer-events-auto relative h-[70vh] w-[96vw] max-w-5xl sm:h-[80vh] cursor-zoom-out"
              onClick={() => setFullscreenImage(null)}
            >
              <Image
                src={imageUrls[fullscreenImage] || "/default-car.jpg"}
                alt={`${altText} (Fullscreen)`}
                fill
                className="object-contain"
                quality={100}
                priority
              />
            </div>

            {/* COUNTER IN FS */}
            {hasMultiple && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white shadow-lg">
                {fullscreenImage + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ----------------- MAIN COMPONENT -----------------

function CarDetailContent({ car }) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [activeTab, setActiveTab] = useState("übersicht");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatPrice = (priceObj) => {
    if (!priceObj?.consumerPriceGross) return "-";
    return `${priceObj.consumerPriceGross.toLocaleString("de-DE")} €`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    return `${month}/${year}`;
  };

  // Common data structures
  const highlightSpecs = [
    {
      icon: <FaTachometerAlt className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      label: isMobile ? "Kilometer" : "Kilometerstand",
      value: car.mileage ? `${car.mileage.toLocaleString("de-DE")} km` : "-",
    },
    {
      icon: <FaCar className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      label: "Erstzulassung",
      value: formatDate(car.firstRegistration),
    },
    {
      icon: <FaGasPump className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      label: "Kraftstoff",
      value: prettifyValue("fuel", car.fuel),
    },
    {
      icon: <GiGearStick className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      label: "Getriebe",
      value: prettifyValue("gearbox", car.gearbox),
    },
    {
      icon: <GiCarDoor className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      label: "Türen",
      value: prettifyValue("doors", car.doors),
    },
    {
      icon: <FaChair className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      label: "Sitze",
      value: car.seats || "-",
    },
  ];

  const ausstattungCategories = [
    {
      title: "Komfort",
      icon: <MdAir className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      features: [
        {
          label: isMobile ? "Klimaanlage" : "Klimaanlage",
          value: prettifyValue("climatisation", car.climatisation),
        },
        {
          label: isMobile ? "Regensensor" : "Regensensor",
          value: car.automaticRainSensor ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Keyless" : "Keyless Entry",
          value: car.keylessEntry ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Elekt. Fenster" : "Elektrische Fensterheber",
          value: car.electricWindows ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Elekt. Heckklappe" : "Elektrische Heckklappe",
          value: car.electricTailgate ? "Ja" : "Nein",
        },
        ...(isMobile
          ? []
          : [
              {
                label: "Elektrische Außenspiegel",
                value: car.electricExteriorMirrors ? "Ja" : "Nein",
              },
              {
                label: "Anklappbare Spiegel",
                value: car.foldingExteriorMirrors ? "Ja" : "Nein",
              },
            ]),
      ],
    },
    {
      title: "Unterhaltung",
      icon: <FaMusic className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      features: [
        {
          label: isMobile ? "Navigation" : "Navigationssystem",
          value: car.navigationSystem ? "Ja" : "Nein",
        },
        { label: "Bluetooth", value: car.redtooth ? "Ja" : "Nein" },
        { label: "Touchscreen", value: car.touchscreen ? "Ja" : "Nein" },
        ...(isMobile
          ? []
          : [
              { label: "USB", value: car.usb ? "Ja" : "Nein" },
              { label: "Radio", value: car.radio?.join(", ") || "-" },
            ]),
      ],
    },
    {
      title: isMobile ? "Sitze" : "Sitzausstattung",
      icon: <FaChair className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      features: [
        {
          label: isMobile ? "Leder" : "Ledersitze",
          value: car.leatherSeats ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Sportsitze" : "Sportsitze",
          value: car.sportSeats ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Elekt. Sitze" : "Elektrische Sitzverstellung",
          value: car.electricAdjustableSeats ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Sitzheizung" : "Sitzheizung",
          value: car.electricHeatedSeats ? "Ja" : "Nein",
        },
      ],
    },
  ];

  const featuresCategories = [
    {
      title: "Sicherheit",
      icon: <FaShieldAlt className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      features: [
        { label: "Airbags", value: prettifyValue("airbag", car.airbag) },
        { label: "ABS", value: car.abs ? "Ja" : "Nein" },
        { label: "ESP", value: car.esp ? "Ja" : "Nein" },
        {
          label: isMobile ? "Spurhalteassist." : "Spurhalteassistent",
          value: car.laneDepartureWarning ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Reifendruck" : "Reifendruckkontrolle",
          value: car.tirePressureMonitoring ? "Ja" : "Nein",
        },
      ],
    },
    {
      title: "Licht",
      icon: <FaLightbulb className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      features: [
        {
          label: isMobile ? "Nebelscheinwerfer" : "Nebelscheinwerfer",
          value: car.frontFogLights ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Lichtsensor" : "Lichtsensor",
          value: car.lightSensor ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Kurvenlicht" : "Kurvenlicht",
          value: prettifyValue("bendingLightsType", car.bendingLightsType),
        },
      ],
    },
    {
      title: "Parken",
      icon: <FaParking className={isMobile ? "h-3 w-3" : "h-4 w-4"} />,
      features: [
        {
          label: isMobile ? "Parkassistent" : "Parkassistent",
          value: prettifyValue("parkingAssistants", car.parkingAssistants),
        },
        {
          label: isMobile ? "Einparkhilfe" : "Einparkhilfe",
          value: car.parkingAssist ? "Ja" : "Nein",
        },
      ],
    },
  ];

  // Button base styles
  const baseBtn = isMobile
    ? "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors"
    : "inline-flex h-9 items-center justify-center rounded-md px-3 text-[11px] sm:text-xs font-medium transition-colors";

  // Common layout components
  const PriceCard = () => (
    <div
      className={`${
        isMobile
          ? "rounded-xl border border-sky-700/60 bg-slate-950/95 p-3 shadow-lg"
          : "w-full max-w-sm rounded-2xl border border-sky-700/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-5 shadow-xl shadow-black/50"
      }`}
    >
      {!isMobile && (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-400">
              Gesamtpreis
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
              {formatPrice(car.price)}
            </p>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Sofort verfügbar
          </span>
        </div>
      )}

      {isMobile ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              Gesamtpreis
            </div>
            <div className="text-lg font-semibold text-white">
              {formatPrice(car.price)}
            </div>
          </div>
          <button
            onClick={() => setShowContactForm(true)}
            className={`${baseBtn} bg-sky-600 text-white hover:bg-sky-500`}
          >
            Probefahrt anfragen
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-1.5 text-[11px] sm:text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                <BsCheck2 className="h-3 w-3" />
              </span>
              <span>Individuelle Finanzierung möglich</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                <BsCheck2 className="h-3 w-3" />
              </span>
              <span>Inzahlungnahme Ihres Fahrzeugs möglich</span>
            </div>
          </div>
          <button
            onClick={() => setShowContactForm(true)}
            className={`${baseBtn} mt-5 w-full cursor-pointer bg-sky-600 text-white hover:bg-sky-500`}
          >
            Probefahrt anfragen
          </button>
        </>
      )}
    </div>
  );

  const HighlightsCard = () => (
    <div
      className={`${
        isMobile
          ? "rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm"
          : "rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/40 sm:p-5"
      }`}
    >
      <div className={`flex items-center gap-2 ${isMobile ? "mb-2" : "mb-3"}`}>
        <div
          className={`flex items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ${
            isMobile ? "h-6 w-6" : "h-8 w-8 rounded-xl"
          }`}
        >
          <FaSun className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
        </div>
        <h3
          className={`font-semibold text-white ${
            isMobile ? "text-xs" : "text-sm sm:text-base"
          }`}
        >
          Highlights
        </h3>
      </div>
      <div
        className={`space-y-1.5 ${
          isMobile ? "text-xs" : "text-xs sm:text-[13px]"
        }`}
      >
        {[
          car.panoramicGlassRoof && "Panoramadach",
          car.navigationSystem && "Navigation",
          car.leatherSteeringWheel && "Lederlenkrad",
          car.electricAdjustableSeats && "Elekt. Sitze",
          car.keylessEntry && "Keyless Entry",
          car.summerTires && "Sommerreifen",
          car.winterTires && "Winterreifen",
          car.fullServiceHistory && "Scheckheft",
        ]
          .filter(Boolean)
          .slice(0, 6)
          .map((highlight, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center rounded-full bg-sky-500/10 ${
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                }`}
              >
                <BsCheck2
                  className={
                    isMobile ? "h-2 w-2 text-sky-400" : "h-3 w-3 text-sky-400"
                  }
                />
              </div>
              <span className="text-slate-200">{highlight}</span>
            </div>
          ))}
      </div>
    </div>
  );

  const ContactCard = () => (
    <div
      className={`${
        isMobile
          ? "rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm"
          : "rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/40 sm:p-5"
      }`}
    >
      {!isMobile && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
            <FaCar className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-white sm:text-base">
            Fahrzeug anfragen
          </h3>
        </div>
      )}
      <button
        onClick={() => setShowContactForm(true)}
        className={`${baseBtn} w-full bg-sky-600 text-white hover:bg-sky-500`}
      >
        Probefahrt vereinbaren
      </button>
      <p
        className={`mt-2 text-slate-400 text-center ${
          isMobile ? "text-[10px]" : "text-[11px] sm:text-xs"
        }`}
      >
        Unser Team meldet sich schnellstmöglich bei Ihnen.
      </p>
    </div>
  );

  const TabContent = () => {
    switch (activeTab) {
      case "übersicht":
        return (
          <div>
            <h2
              className={`font-semibold text-white ${
                isMobile ? "mb-3 text-sm" : "mb-4 text-lg sm:mb-6 sm:text-xl"
              }`}
            >
              Fahrzeugübersicht
            </h2>
            <div
              className={`grid gap-3 ${!isMobile && "sm:grid-cols-2 sm:gap-5"}`}
            >
              <SpecCard
                icon={<FaCar className={isMobile ? "h-3 w-3" : "h-4 w-4"} />}
                title={isMobile ? "Allgemein" : "Allgemeine Daten"}
                items={[
                  { label: "VIN", value: car.vin },
                  {
                    label: isMobile ? "Klasse" : "Fahrzeugklasse",
                    value: prettifyValue("category", car.category),
                  },
                  { label: "Zustand", value: car.condition },
                  {
                    label: "EZ",
                    value: formatDate(car.firstRegistration),
                  },
                  ...(isMobile
                    ? []
                    : [
                        {
                          label: "Schadstoffklasse",
                          value: car.emissionClass,
                        },
                      ]),
                ]}
                isMobile={isMobile}
              />

              <SpecCard
                icon={
                  <BsSpeedometer2
                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                  />
                }
                title="Technik"
                items={[
                  {
                    label: "Leistung",
                    value: car.power ? `${car.power} kW` : "-",
                  },
                  {
                    label: "Hubraum",
                    value: car.cubicCapacity
                      ? `${(car.cubicCapacity / 1000).toLocaleString("de-DE", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })} l`
                      : "-",
                  },
                  {
                    label: "Kraftstoff",
                    value: prettifyValue("fuel", car.fuel),
                  },
                  {
                    label: "Getriebe",
                    value: prettifyValue("gearbox", car.gearbox),
                  },
                ]}
                isMobile={isMobile}
              />

              <SpecCard
                icon={
                  <IoMdColorPalette
                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                  />
                }
                title="Außen"
                items={[
                  {
                    label: "Farbe",
                    value: prettifyValue("color", car.exteriorColor),
                  },
                  {
                    label: "Metallic",
                    value: car.metallic ? "Ja" : "Nein",
                  },
                  {
                    label: "Alufelgen",
                    value: car.alloyWheels ? "Ja" : "Nein",
                  },
                ]}
                isMobile={isMobile}
              />
            </div>
          </div>
        );

      case "ausstattung":
        return (
          <div>
            <h2
              className={`font-semibold text-white ${
                isMobile ? "mb-3 text-sm" : "mb-4 text-lg sm:mb-6 sm:text-xl"
              }`}
            >
              Ausstattung
            </h2>
            <div
              className={`grid gap-3 ${!isMobile && "sm:grid-cols-2 sm:gap-5"}`}
            >
              {ausstattungCategories.map((cat, idx) => (
                <SpecCard
                  key={idx}
                  icon={cat.icon}
                  title={cat.title}
                  items={cat.features}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        );

      case "features":
        return (
          <div>
            <h2
              className={`font-semibold text-white ${
                isMobile ? "mb-3 text-sm" : "mb-4 text-lg sm:mb-6 sm:text-xl"
              }`}
            >
              Features & Sicherheit
            </h2>
            <div
              className={`grid gap-3 ${!isMobile && "sm:grid-cols-2 sm:gap-5"}`}
            >
              {featuresCategories.map((cat, idx) => (
                <SpecCard
                  key={idx}
                  icon={cat.icon}
                  title={cat.title}
                  items={cat.features}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        );

      case "technik":
        return (
          <div>
            <h2
              className={`font-semibold text-white ${
                isMobile ? "mb-3 text-sm" : "mb-4 text-lg sm:mb-6 sm:text-xl"
              }`}
            >
              Technische Daten
            </h2>
            <div
              className={`grid gap-3 ${!isMobile && "sm:grid-cols-2 sm:gap-5"}`}
            >
              <SpecCard
                icon={
                  <GiSteeringWheel
                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                  />
                }
                title="Motor & Antrieb"
                items={[
                  {
                    label: "Leistung",
                    value: car.power ? `${car.power} kW` : "-",
                  },
                  {
                    label: "Hubraum",
                    value: car.cubicCapacity
                      ? `${(car.cubicCapacity / 1000).toLocaleString("de-DE", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })} l`
                      : "-",
                  },
                  {
                    label: "Kraftstoff",
                    value: prettifyValue("fuel", car.fuel),
                  },
                  {
                    label: "Getriebe",
                    value: prettifyValue("gearbox", car.gearbox),
                  },
                  {
                    label: "Antrieb",
                    value: prettifyValue("driveType", car.driveType),
                  },
                ]}
                isMobile={isMobile}
              />

              <SpecCard
                icon={
                  <RiTempColdLine
                    className={isMobile ? "h-3 w-3" : "h-4 w-4"}
                  />
                }
                title="Verbrauch"
                items={[
                  {
                    label: "Verbrauch",
                    value: car.consumptions?.fuel?.combined
                      ? `${car.consumptions.fuel.combined} L/100km`
                      : "-",
                  },
                  {
                    label: "CO₂",
                    value: car.emissions?.combined?.co2
                      ? `${car.emissions.combined.co2} g/km`
                      : "-",
                  },
                  {
                    label: "Schadstoffkl.",
                    value: car.emissionClass,
                  },
                ]}
                isMobile={isMobile}
              />
            </div>
          </div>
        );

      case "beschreibung":
        return car.description ? (
          <div>
            <h2
              className={`font-semibold text-white ${
                isMobile ? "mb-3 text-sm" : "mb-4 text-lg sm:mb-6 sm:text-xl"
              }`}
            >
              Beschreibung
            </h2>
            <div
              className={`space-y-1 overflow-y-auto pr-1 ${
                isMobile
                  ? "max-h-[50vh] text-xs"
                  : "max-h-[70vh] space-y-2 pr-2"
              }`}
            >
              {renderDescription(car.description, isMobile)}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  // Main render
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
      <main
        className={`relative z-10 mx-auto w-full max-w-full ${
          isMobile
            ? "px-3 pb-8 pt-4"
            : "max-w-[1500px] px-4 pb-16 pt-24 sm:px-6 lg:px-8"
        }`}
      >
        {/* HERO SECTION */}
        <section className={isMobile ? "mb-4" : "mb-8 sm:mb-10"}>
          <div
            className={
              isMobile
                ? "flex flex-col gap-4"
                : "flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
            }
          >
            {/* Vehicle Info */}
            <div className={isMobile ? "space-y-4" : "space-y-4"}>
              {/* Badges */}
              <div
                className={`flex flex-wrap items-center gap-1 ${
                  isMobile ? "text-xs" : "text-xs sm:text-[13px] gap-2"
                }`}
              >
                {car.condition && (
                  <span
                    className={`rounded-full bg-sky-600/10 px-2 py-1 font-medium text-sky-300 ring-1 ring-sky-500/40 ${
                      !isMobile && "px-3"
                    }`}
                  >
                    {car.condition}
                  </span>
                )}
                {car.category && (
                  <span
                    className={`rounded-full bg-slate-900/80 px-2 py-1 text-slate-300 ring-1 ring-slate-700/70 ${
                      !isMobile && "px-3"
                    }`}
                  >
                    {prettifyValue("category", car.category)}
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h1
                  className={`font-semibold tracking-tight text-white ${
                    isMobile ? "text-xl" : "text-2xl sm:text-3xl lg:text-4xl"
                  }`}
                >
                  {car.make} {car.model}
                </h1>
                {car.modelDescription && (
                  <p
                    className={`mt-1 text-slate-300 ${
                      isMobile
                        ? "text-xs line-clamp-2"
                        : "max-w-2xl text-sm sm:text-base"
                    }`}
                  >
                    {car.modelDescription}
                  </p>
                )}
              </div>

              {/* Specs Grid */}
              <div
                className={`grid gap-2 ${
                  isMobile
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3 sm:gap-3 md:max-w-xl"
                }`}
              >
                {highlightSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs shadow-sm ${
                      !isMobile && "rounded-xl p-2.5 gap-3 shadow-black/40"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center rounded-md bg-sky-500/10 ${
                        isMobile ? "h-6 w-6" : "h-8 w-8 rounded-lg"
                      }`}
                    >
                      {spec.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-slate-400 ${
                          isMobile ? "text-[10px]" : "text-[11px]"
                        }`}
                      >
                        {spec.label}
                      </div>
                      <div
                        className={`truncate font-medium text-slate-50 ${
                          isMobile
                            ? "text-[11px]"
                            : "text-[12px] sm:text-[13px]"
                        }`}
                      >
                        {(spec.value || "-")
                          .toString()
                          .replace(/_/g, " ")
                          .toLowerCase()
                          .replace(/^\w/, (c) => c.toUpperCase())}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Card - Desktop */}
            {!isMobile && <PriceCard />}
          </div>

          {/* Price Card - Mobile */}
          {isMobile && (
            <section className="mb-4">
              <PriceCard />
            </section>
          )}
        </section>

        {/* IMAGE SLIDER */}
        <section className={isMobile ? "mb-4" : "mb-6"}>
          <ImageSlider
            images={car.images?.map((img) => img.ref) || []}
            car={{ make: car.make, model: car.model }}
            isMobile={isMobile}
          />
        </section>

        {/* MAIN CONTENT GRID */}
        {isMobile ? (
          // MOBILE LAYOUT
          <section className="space-y-4">
            {/* TABS */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/95 shadow-sm">
              <div className="border-b border-slate-800">
                <nav className="flex -mb-px overflow-x-auto text-xs scrollbar-hide">
                  {[
                    ["übersicht", "Übersicht"],
                    ["ausstattung", "Ausstattung"],
                    ["features", "Features"],
                    ["technik", "Technik"],
                    ...(car.description
                      ? [["beschreibung", "Beschreibung"]]
                      : []),
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`whitespace-nowrap border-b-2 px-3 py-2 font-medium transition-colors ${
                        activeTab === key
                          ? "border-sky-500 text-sky-300"
                          : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-3">
                <TabContent />
              </div>
            </div>

            {/* SIDEBAR CONTENT - MOBILE */}
            <div className="space-y-3">
              <HighlightsCard />
              <ContactCard />
              <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm">
                <FinanceCalculatorAdvanced
                  price={car.price?.consumerPriceGross || 0}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </section>
        ) : (
          // DESKTOP LAYOUT
          <section className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* TABS */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/95 shadow-sm shadow-black/40">
                <div className="border-b border-slate-800">
                  <nav className="flex -mb-px overflow-x-auto text-xs sm:text-[13px] scrollbar-hide">
                    {[
                      ["übersicht", "Übersicht"],
                      ["ausstattung", "Ausstattung"],
                      ["features", "Features"],
                      ["technik", "Technische Daten"],
                      ...(car.description
                        ? [["beschreibung", "Beschreibung"]]
                        : []),
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`whitespace-nowrap border-b-2 px-4 py-3 font-medium transition-colors sm:px-6 ${
                          activeTab === key
                            ? "border-sky-500 text-sky-300"
                            : "border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-4 sm:p-6">
                  <TabContent />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-4 sm:space-y-5">
              <ContactCard />
              <HighlightsCard />
              <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/40 sm:p-5">
                <FinanceCalculatorAdvanced
                  price={car.price?.consumerPriceGross || 0}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* CONTACT FORM MODAL */}
      {showContactForm && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${
            isMobile ? "p-2" : "p-3 sm:p-4"
          }`}
        >
          <div
            className={`w-full max-w-full bg-white shadow-2xl border border-gray-200 ${
              isMobile
                ? "max-h-[95vh] overflow-y-auto rounded-xl"
                : "max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
            }`}
          >
            {/* Header */}
            <div
              className={`bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-xl flex items-center justify-between ${
                isMobile
                  ? "px-3 py-2"
                  : "px-4 py-3 md:px-6 md:py-4 rounded-t-2xl"
              }`}
            >
              <div className="min-w-0 flex-1">
                <h3
                  className={`font-bold text-white truncate ${
                    isMobile ? "text-base" : "text-lg md:text-2xl"
                  }`}
                >
                  Probefahrt anfragen
                </h3>
                <p
                  className={`text-red-100 mt-0.5 truncate ${
                    isMobile ? "text-xs" : "text-xs md:text-sm mt-1"
                  }`}
                >
                  {car.make} {car.model}
                </p>
              </div>
              <button
                onClick={() => setShowContactForm(false)}
                className={`ml-2 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0 ${
                  isMobile ? "h-6 w-6" : "ml-3 h-8 w-8"
                }`}
                aria-label="Close"
              >
                <svg
                  className={isMobile ? "h-3 w-3" : "h-4 w-4 md:h-5 md:w-5"}
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

            {/* Content */}
            <div className={isMobile ? "p-3" : "p-4 md:p-2"}>
              <div
                className={
                  isMobile
                    ? "space-y-3"
                    : "grid grid-cols-1 md:grid-cols-[1.1fr,1.5fr] gap-4 md:gap-6 items-start"
                }
              >
                <div
                  className={`border border-gray-200 rounded-lg bg-white ${
                    isMobile ? "p-2" : "rounded-xl p-3 md:p-4"
                  }`}
                >
                  <ContactForm
                    car={car}
                    onSuccess={() => setShowContactForm(false)}
                    isMobile={isMobile}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetailContent;
