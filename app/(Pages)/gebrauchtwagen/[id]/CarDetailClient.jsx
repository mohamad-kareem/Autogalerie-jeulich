"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { GiGearStick, GiCarDoor, GiSteeringWheel } from "react-icons/gi";
import { MdAir } from "react-icons/md";
import { IoMdColorPalette } from "react-icons/io";
import { RiTempColdLine } from "react-icons/ri";
import { BsSpeedometer2, BsCheck2 } from "react-icons/bs";
import { FiArrowLeft, FiShare2, FiCheck, FiX } from "react-icons/fi";

/* ================================================================== */
/*  THEME                                                              */
/* ================================================================== */

const WRAPPER = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";
const CARD =
  "rounded-2xl border border-black/[0.06] bg-white shadow-[0_10px_30px_-18px_rgba(7,17,31,0.18)]";

const DEALER_EMAIL = "info@autogalerie-juelich.de";
const DEALER_PHONE = "+4924619163780";
const DEALER_PHONE_LABEL = "02461 9163780";

/* ================================================================== */
/*  HELPERS (logic from old code, unchanged)                           */
/* ================================================================== */

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

function renderDescription(description) {
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

  return lines.map((line, index) => {
    if (
      /^Mail\s*:|^WhatsApp\s*:|^WIR BIETEN|^Finanzierung|^Inzahlungnahme|^Zulassungsservice|^Auslieferungsservice/i.test(
        line,
      )
    ) {
      return (
        <h4
          key={index}
          className="mb-1 mt-4 break-words whitespace-pre-line text-[13px] font-semibold text-[#07111f] sm:text-sm"
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
          className="mb-2 break-words whitespace-pre-line text-[13px] leading-6 text-[#3a423a] sm:text-sm"
        >
          <span className="font-semibold text-[#07111f]">{label.trim()}:</span>{" "}
          {rest.join(":").trim()}
        </p>
      );
    }

    if (line.length <= 40) {
      return (
        <li
          key={index}
          className="ml-5 list-disc break-words whitespace-pre-line text-[13px] leading-6 text-[#3a423a] sm:text-sm"
        >
          {line}
        </li>
      );
    }

    return (
      <p
        key={index}
        className="mb-2 text-[13px] leading-7 text-[#3a423a] sm:text-sm"
      >
        {line}
      </p>
    );
  });
}

/* ================================================================== */
/*  SPEC CARD                                                          */
/* ================================================================== */

const SpecCard = ({ icon, title, items }) => {
  const visibleItems =
    items?.filter(
      (item) =>
        item.value !== "Nein" &&
        item.value !== undefined &&
        item.value !== null &&
        item.value !== "" &&
        item.value !== "-",
    ) || [];

  if (visibleItems.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#fafbf9] p-5">
      <div className="mb-4 flex items-center gap-2.5 border-b border-black/[0.06] pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e]">
          {icon}
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#07111f]">
          {title}
        </h3>
      </div>

      <dl>
        {visibleItems.map((item, index) => (
          <div
            key={index}
            className="flex items-baseline justify-between gap-4 border-b border-dashed border-black/[0.09] py-2.5 last:border-0"
          >
            <dt className="text-[13px] text-[#5f695f]">{item.label}</dt>
            <dd className="flex items-center gap-1 text-right text-[13px] font-semibold text-[#101510]">
              {item.value === "Ja" ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#e6f1e9]">
                  <BsCheck2 className="h-3.5 w-3.5 text-[#146c2e]" />
                </span>
              ) : (
                item.value || "-"
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

/* ================================================================== */
/*  IMAGE GALLERY                                                      */
/* ================================================================== */

const Gallery = ({ images = [], car = {} }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const imageUrls = (images || []).map((img) =>
    typeof img === "string" ? img : img?.ref,
  );

  const hasImages = imageUrls.length > 0;
  const hasMultiple = imageUrls.length > 1;
  const altText = `${car.make || ""} ${car.model || ""}`.trim() || "Fahrzeug";

  const goPrev = (setter) =>
    setter((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  const goNext = (setter) =>
    setter((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setFullscreenImage(null);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (fullscreenImage === null) return;
      if (e.key === "Escape") setFullscreenImage(null);
      if (e.key === "ArrowLeft") goPrev(setFullscreenImage);
      if (e.key === "ArrowRight") goNext(setFullscreenImage);
    };

    if (fullscreenImage !== null) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "unset";
    };
  }, [fullscreenImage]);

  return (
    <>
      {/* Main image */}
      <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#eef0ec] sm:aspect-[16/10]">
        {hasImages && (
          <button
            type="button"
            onClick={() => setFullscreenImage(activeImage)}
            className="absolute right-3 top-3 z-20 inline-flex h-9 items-center gap-1.5 rounded-lg bg-black/45 px-2.5 text-[11px] font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
            aria-label="Vollbild"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5-5-5m5 5v-4m0 4h-4"
              />
            </svg>
            Vergrößern
          </button>
        )}

        {hasImages ? (
          <button
            type="button"
            onClick={() => setFullscreenImage(activeImage)}
            className="h-full w-full cursor-zoom-in"
          >
            <Image
              src={imageUrls[activeImage] || "/default-car.jpg"}
              alt={altText}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              priority
              quality={90}
              sizes="(max-width: 1024px) 100vw, 760px"
              unoptimized
            />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#9aa39a]">
            <FaCar className="h-16 w-16" />
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goPrev(setActiveImage)}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#101510] shadow-lg transition hover:scale-105 hover:bg-white active:scale-95"
              aria-label="Vorheriges Bild"
            >
              <FiArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => goNext(setActiveImage)}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#101510] shadow-lg transition hover:scale-105 hover:bg-white active:scale-95"
              aria-label="Nächstes Bild"
            >
              <FiArrowLeft className="h-[18px] w-[18px] rotate-180" />
            </button>

            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
              {activeImage + 1} / {imageUrls.length}
            </span>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
              <div
                className="h-full bg-[#146c2e] transition-all duration-300"
                style={{
                  width: `${((activeImage + 1) / imageUrls.length) * 100}%`,
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((img, index) => {
            const isActive = activeImage === index;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`relative h-[54px] w-[78px] shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-[60px] sm:w-[88px] ${
                  isActive
                    ? "border-[#146c2e] ring-2 ring-[#146c2e]/15"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Bild ${index + 1} anzeigen`}
              >
                <Image
                  src={img || "/default-car.jpg"}
                  alt={`${altText} Bild ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="88px"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreenImage !== null && hasImages && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-[#07110d]/95 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="flex items-center justify-between px-5 py-4">
            {hasMultiple ? (
              <span className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-medium text-white">
                {fullscreenImage + 1} / {imageUrls.length}
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Schließen"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev(setFullscreenImage);
                  }}
                  className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
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
                  className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
                  aria-label="Nächstes Bild"
                >
                  <FiArrowLeft className="h-5 w-5 rotate-180" />
                </button>
              </>
            )}

            <div
              className="relative h-full w-full cursor-zoom-out"
              onClick={() => setFullscreenImage(null)}
            >
              <Image
                src={imageUrls[fullscreenImage] || "/default-car.jpg"}
                alt={`${altText} (Vollbild)`}
                fill
                className="object-contain"
                quality={100}
                priority
                unoptimized
              />
            </div>
          </div>

          {hasMultiple && (
            <div
              className="flex gap-2 overflow-x-auto px-5 pb-5"
              onClick={(e) => e.stopPropagation()}
            >
              {imageUrls.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFullscreenImage(index)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    index === fullscreenImage
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-90"
                  }`}
                >
                  <Image
                    src={img || "/default-car.jpg"}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

/* ================================================================== */
/*  CONTACT FORM MODAL                                                 */
/* ================================================================== */

function ContactFormModal({ car, title, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-3 bg-[#146c2e] px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-white">
              Probefahrt anfragen
            </h3>
            <p className="mt-0.5 truncate text-[12px] text-white/80">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Schließen"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto p-4 sm:p-5">
          <p className="mb-4 text-[13px] leading-5 text-[#5f695f]">
            Hinterlassen Sie uns Ihre Kontaktdaten – unser Team meldet sich
            schnellstmöglich bei Ihnen.
          </p>
          <ContactForm car={car} onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function CarDetailPage() {
  const params = useParams();
  const carId = params?.id;

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState("übersicht");
  const [copied, setCopied] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  /* ----- fetch ----- */
  useEffect(() => {
    if (!carId) return;
    let cancelled = false;

    const fetchCar = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/cars/${carId}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          if (data && data._id) setCar(data);
          else setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch car:", error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCar();
    return () => {
      cancelled = true;
    };
  }, [carId]);

  /* ----- format helpers ----- */
  const formatPrice = (priceObj) => {
    if (!priceObj?.consumerPriceGross) return "Auf Anfrage";
    return `${priceObj.consumerPriceGross.toLocaleString("de-DE")} €`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    return `${month}/${year}`;
  };

  const title = car ? `${car.make || ""} ${car.model || ""}`.trim() : "";

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  /* ----- derived data ----- */
  const data = useMemo(() => {
    if (!car) return null;

    const highlightSpecs = [
      {
        icon: <FaTachometerAlt className="h-[17px] w-[17px]" />,
        label: "Kilometerstand",
        value: car.mileage ? `${car.mileage.toLocaleString("de-DE")} km` : "-",
      },
      {
        icon: <FaCar className="h-[17px] w-[17px]" />,
        label: "Erstzulassung",
        value: formatDate(car.firstRegistration),
      },
      {
        icon: <FaGasPump className="h-[17px] w-[17px]" />,
        label: "Kraftstoff",
        value: prettifyValue("fuel", car.fuel),
      },
      {
        icon: <GiGearStick className="h-[17px] w-[17px]" />,
        label: "Getriebe",
        value: prettifyValue("gearbox", car.gearbox),
      },
      {
        icon: <BsSpeedometer2 className="h-[17px] w-[17px]" />,
        label: "Leistung",
        value: car.power ? `${car.power} kW` : "-",
      },
      {
        icon: <FaChair className="h-[17px] w-[17px]" />,
        label: "Sitze",
        value: car.seats || "-",
      },
    ];

    const ausstattungCategories = [
      {
        title: "Komfort",
        icon: <MdAir className="h-[18px] w-[18px]" />,
        features: [
          {
            label: "Klimaanlage",
            value: prettifyValue("climatisation", car.climatisation),
          },
          {
            label: "Regensensor",
            value: car.automaticRainSensor ? "Ja" : "Nein",
          },
          { label: "Keyless Entry", value: car.keylessEntry ? "Ja" : "Nein" },
          {
            label: "Elektrische Fensterheber",
            value: car.electricWindows ? "Ja" : "Nein",
          },
          {
            label: "Elektrische Heckklappe",
            value: car.electricTailgate ? "Ja" : "Nein",
          },
          {
            label: "Elektrische Außenspiegel",
            value: car.electricExteriorMirrors ? "Ja" : "Nein",
          },
          {
            label: "Anklappbare Spiegel",
            value: car.foldingExteriorMirrors ? "Ja" : "Nein",
          },
        ],
      },
      {
        title: "Unterhaltung",
        icon: <FaMusic className="h-[18px] w-[18px]" />,
        features: [
          {
            label: "Navigationssystem",
            value: car.navigationSystem ? "Ja" : "Nein",
          },
          { label: "Bluetooth", value: car.redtooth ? "Ja" : "Nein" },
          { label: "Touchscreen", value: car.touchscreen ? "Ja" : "Nein" },
          { label: "USB", value: car.usb ? "Ja" : "Nein" },
          { label: "Radio", value: car.radio?.join(", ") || "-" },
        ],
      },
      {
        title: "Sitzausstattung",
        icon: <FaChair className="h-[18px] w-[18px]" />,
        features: [
          { label: "Ledersitze", value: car.leatherSeats ? "Ja" : "Nein" },
          { label: "Sportsitze", value: car.sportSeats ? "Ja" : "Nein" },
          {
            label: "Elektrische Sitzverstellung",
            value: car.electricAdjustableSeats ? "Ja" : "Nein",
          },
          {
            label: "Sitzheizung",
            value: car.electricHeatedSeats ? "Ja" : "Nein",
          },
        ],
      },
    ];

    const featuresCategories = [
      {
        title: "Sicherheit",
        icon: <FaShieldAlt className="h-[18px] w-[18px]" />,
        features: [
          { label: "Airbags", value: prettifyValue("airbag", car.airbag) },
          { label: "ABS", value: car.abs ? "Ja" : "Nein" },
          { label: "ESP", value: car.esp ? "Ja" : "Nein" },
          {
            label: "Spurhalteassistent",
            value: car.laneDepartureWarning ? "Ja" : "Nein",
          },
          {
            label: "Reifendruckkontrolle",
            value: car.tirePressureMonitoring ? "Ja" : "Nein",
          },
        ],
      },
      {
        title: "Licht",
        icon: <FaLightbulb className="h-[18px] w-[18px]" />,
        features: [
          {
            label: "Nebelscheinwerfer",
            value: car.frontFogLights ? "Ja" : "Nein",
          },
          { label: "Lichtsensor", value: car.lightSensor ? "Ja" : "Nein" },
          {
            label: "Kurvenlicht",
            value: prettifyValue("bendingLightsType", car.bendingLightsType),
          },
        ],
      },
      {
        title: "Parken",
        icon: <FaParking className="h-[18px] w-[18px]" />,
        features: [
          {
            label: "Parkassistent",
            value: prettifyValue("parkingAssistants", car.parkingAssistants),
          },
          { label: "Einparkhilfe", value: car.parkingAssist ? "Ja" : "Nein" },
        ],
      },
    ];

    const highlights = [
      car.panoramicGlassRoof && "Panoramadach",
      car.navigationSystem && "Navigation",
      car.leatherSteeringWheel && "Lederlenkrad",
      car.electricAdjustableSeats && "Elektrische Sitze",
      car.keylessEntry && "Keyless Entry",
      car.summerTires && "Sommerreifen",
      car.winterTires && "Winterreifen",
      car.fullServiceHistory && "Scheckheftgepflegt",
    ]
      .filter(Boolean)
      .slice(0, 6);

    const tabs = [
      ["übersicht", "Übersicht"],
      ["ausstattung", "Ausstattung"],
      ["features", "Features"],
      ["technik", "Technische Daten"],
      ...(car.description ? [["beschreibung", "Beschreibung"]] : []),
    ];

    return {
      highlightSpecs,
      ausstattungCategories,
      featuresCategories,
      highlights,
      tabs,
    };
  }, [car]);

  /* ----- loading / not found ----- */
  if (loading) return <DetailSkeleton />;

  if (notFound || !car) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f5f2] px-4">
        <div className={`${CARD} w-full max-w-md px-6 py-12 text-center`}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e6f1e9]">
            <FaCar className="h-7 w-7 text-[#146c2e]" />
          </div>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#07111f]">
            Fahrzeug nicht gefunden
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#5f695f]">
            Dieses Fahrzeug ist nicht mehr verfügbar oder wurde entfernt.
          </p>
          <Link
            href="/gebrauchtwagen"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#146c2e] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0f5724]"
          >
            <FiArrowLeft className="h-4 w-4" />
            Zurück zur Fahrzeugliste
          </Link>
        </div>
      </main>
    );
  }

  /* ----- tab content ----- */
  const renderTab = () => {
    switch (activeTab) {
      case "übersicht":
        return (
          <TabSection title="Fahrzeugübersicht">
            <div className="grid gap-4 sm:grid-cols-2">
              <SpecCard
                icon={<FaCar className="h-[18px] w-[18px]" />}
                title="Allgemeine Daten"
                items={[
                  { label: "VIN", value: car.vin },
                  {
                    label: "Fahrzeugklasse",
                    value: prettifyValue("category", car.category),
                  },
                  { label: "Zustand", value: car.condition },
                  {
                    label: "Erstzulassung",
                    value: formatDate(car.firstRegistration),
                  },
                  { label: "Schadstoffklasse", value: car.emissionClass },
                ]}
              />
              <SpecCard
                icon={<BsSpeedometer2 className="h-[18px] w-[18px]" />}
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
              />
              <SpecCard
                icon={<IoMdColorPalette className="h-[18px] w-[18px]" />}
                title="Außen"
                items={[
                  {
                    label: "Farbe",
                    value: prettifyValue("color", car.exteriorColor),
                  },
                  { label: "Metallic", value: car.metallic ? "Ja" : "Nein" },
                  {
                    label: "Alufelgen",
                    value: car.alloyWheels ? "Ja" : "Nein",
                  },
                ]}
              />
            </div>
          </TabSection>
        );

      case "ausstattung":
        return (
          <TabSection title="Ausstattung">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.ausstattungCategories.map((cat, idx) => (
                <SpecCard
                  key={idx}
                  icon={cat.icon}
                  title={cat.title}
                  items={cat.features}
                />
              ))}
            </div>
          </TabSection>
        );

      case "features":
        return (
          <TabSection title="Features & Sicherheit">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.featuresCategories.map((cat, idx) => (
                <SpecCard
                  key={idx}
                  icon={cat.icon}
                  title={cat.title}
                  items={cat.features}
                />
              ))}
            </div>
          </TabSection>
        );

      case "technik":
        return (
          <TabSection title="Technische Daten">
            <div className="grid gap-4 sm:grid-cols-2">
              <SpecCard
                icon={<GiSteeringWheel className="h-[18px] w-[18px]" />}
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
              />
              <SpecCard
                icon={<RiTempColdLine className="h-[18px] w-[18px]" />}
                title="Verbrauch & Emissionen"
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
                  { label: "Schadstoffklasse", value: car.emissionClass },
                ]}
              />
            </div>
          </TabSection>
        );

      case "beschreibung":
        return car.description ? (
          <TabSection title="Beschreibung">
            <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
              {renderDescription(car.description)}
            </div>
          </TabSection>
        ) : null;

      default:
        return null;
    }
  };

  /* ================================================================ */

  return (
    <main className="relative min-h-screen bg-[#f4f5f2] pb-28 pt-4 text-[#101510] sm:pt-6 lg:pb-14">
      <div className={WRAPPER}>
        {/* breadcrumb */}
        <nav className="mb-4 flex items-center justify-between gap-3">
          <ol className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-[#7b857b]">
            <li>
              <Link
                href="/gebrauchtwagen"
                className="transition hover:text-[#146c2e]"
              >
                Fahrzeuge
              </Link>
            </li>
            <FiArrowLeft className="h-3 w-3 shrink-0 rotate-180 text-[#bcc4bc]" />
            <li className="truncate text-[#101510]">{title}</li>
          </ol>

          <button
            onClick={handleShare}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 text-[12px] font-medium text-[#101510] transition hover:border-[#146c2e]/40 hover:text-[#146c2e]"
          >
            {copied ? (
              <FiCheck className="h-4 w-4 text-[#146c2e]" />
            ) : (
              <FiShare2 className="h-4 w-4" />
            )}
            {copied ? "Link kopiert" : "Teilen"}
          </button>
        </nav>

        {/* ============ MAIN TWO-COLUMN GRID ============ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_352px]">
          {/* ===== LEFT COLUMN ===== */}
          <div className="min-w-0 space-y-6">
            {/* Title (mobile/tablet) */}
            <div className={`${CARD} p-5 lg:hidden`}>
              <TitleBlock car={car} title={title} />
              <div className="mt-4 border-t border-black/[0.07] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b958b]">
                  Gesamtpreis
                </p>
                <p className="mt-0.5 text-[28px] font-semibold tracking-[-0.03em] text-[#146c2e]">
                  {formatPrice(car.price)}
                </p>
              </div>
            </div>

            {/* Gallery card */}
            <div className={`${CARD} p-3 sm:p-4`}>
              <Gallery
                images={car.images?.map((img) => img.ref) || []}
                car={{ make: car.make, model: car.model }}
              />
            </div>

            {/* Spec strip */}
            <div className={`${CARD} p-2`}>
              <div className="grid grid-cols-2 divide-y divide-black/[0.05] sm:grid-cols-3 sm:divide-y-0">
                {data.highlightSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 sm:p-3.5 ${
                      idx % 3 !== 2 ? "sm:border-r sm:border-black/[0.05]" : ""
                    } ${idx < 3 ? "sm:border-b sm:border-black/[0.05]" : ""}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e9] text-[#146c2e]">
                      {spec.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#8b958b]">
                        {spec.label}
                      </p>
                      <p className="truncate text-[13px] font-semibold text-[#101510]">
                        {(spec.value || "-")
                          .toString()
                          .replace(/_/g, " ")
                          .replace(/^\w/, (c) => c.toUpperCase())}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className={`${CARD} overflow-hidden`}>
              <div className="border-b border-black/[0.06]">
                <nav className="scrollbar-hide -mb-px flex overflow-x-auto">
                  {data.tabs.map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`whitespace-nowrap border-b-2 px-5 py-3.5 text-[13px] font-semibold transition ${
                        activeTab === key
                          ? "border-[#146c2e] text-[#146c2e]"
                          : "border-transparent text-[#7b857b] hover:text-[#101510]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-5 sm:p-6">{renderTab()}</div>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <aside className="min-w-0">
            <div className="space-y-5 lg:sticky lg:top-[88px]">
              {/* Price + contact (desktop) */}
              <div className={`${CARD} hidden overflow-hidden lg:block`}>
                <div className="p-6">
                  <TitleBlock car={car} title={title} />
                  <div className="mt-5 border-t border-black/[0.07] pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b958b]">
                      Gesamtpreis
                    </p>
                    {car.price?.consumerPriceGross ? (
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-[32px] font-semibold leading-none tracking-[-0.03em] text-[#146c2e]">
                          {formatPrice(car.price)}
                        </span>
                        <span className="text-[11px] text-[#7b857b]">
                          inkl. MwSt.
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-lg font-semibold text-[#101510]">
                        Preis auf Anfrage
                      </p>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <Bullet>Individuelle Finanzierung möglich</Bullet>
                    <Bullet>Inzahlungnahme Ihres Fahrzeugs möglich</Bullet>
                  </div>
                </div>
                <div className="space-y-2.5 border-t border-black/[0.06] bg-[#fafbf9] p-5">
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#146c2e] text-[14px] font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724]"
                  >
                    <FaEnvelope className="h-4 w-4" />
                    Fahrzeug anfragen
                  </button>

                  <p className="pt-1 text-center text-[11px] text-[#7b857b]">
                    Unser Team meldet sich schnellstmöglich bei Ihnen.
                  </p>
                </div>
              </div>

              {/* Highlights */}
              {data.highlights.length > 0 && (
                <div className={`${CARD} p-6`}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e]">
                      <FaSun className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="text-[15px] font-semibold text-[#07111f]">
                      Highlights
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {data.highlights.map((h, i) => (
                      <Bullet key={i}>{h}</Bullet>
                    ))}
                  </div>
                </div>
              )}

              {/* Dealer */}
              <div className={`${CARD} p-6`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b958b]">
                  Anbieter
                </p>
                <p className="mt-1.5 text-[16px] font-semibold tracking-[-0.02em] text-[#07111f]">
                  Autogalerie Jülich
                </p>
                <div className="mt-4 space-y-3 text-[13px]">
                  <a
                    href="https://maps.google.com/?q=Alte+Dürenerstraße+4+Jülich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 leading-5 text-[#5f695f] transition hover:text-[#146c2e]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e9] text-[#146c2e]">
                      <FaMapMarkerAlt className="h-4 w-4" />
                    </span>
                    <span className="pt-1">
                      Alte Dürenerstraße 4
                      <br />
                      52428 Jülich
                    </span>
                  </a>
                  <a
                    href={`tel:${DEALER_PHONE}`}
                    className="flex items-center gap-3 text-[#5f695f] transition hover:text-[#146c2e]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f1e9] text-[#146c2e]">
                      <FaPhoneAlt className="h-3.5 w-3.5" />
                    </span>
                    {DEALER_PHONE_LABEL}
                  </a>
                  {car.location && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f2] px-3 py-1.5 text-[12px] font-medium text-[#5f695f]">
                      <FaMapMarkerAlt className="h-3 w-3 text-[#146c2e]" />
                      Standort: {car.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* STICKY MOBILE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-12px_40px_rgba(7,17,31,0.1)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#8b958b]">
              Gesamtpreis
            </p>
            <p className="truncate text-[19px] font-semibold leading-tight tracking-[-0.02em] text-[#146c2e]">
              {formatPrice(car.price)}
            </p>
          </div>
          <a
            href={`tel:${DEALER_PHONE}`}
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#146c2e]/25 bg-white text-[#146c2e] transition active:scale-95"
            aria-label="Anrufen"
          >
            <FaPhoneAlt className="h-4 w-4" />
          </a>
          <button
            onClick={() => setShowContactForm(true)}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#146c2e] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0f5724] active:scale-95"
          >
            <FaEnvelope className="h-4 w-4" />
            Anfragen
          </button>
        </div>
      </div>

      {/* CONTACT FORM MODAL */}
      {showContactForm && (
        <ContactFormModal
          car={car}
          title={title}
          onClose={() => setShowContactForm(false)}
        />
      )}
    </main>
  );
}

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

function TitleBlock({ car, title }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e]">
          Autogalerie Jülich
        </span>
        {car.condition && (
          <span className="rounded-full bg-[#e6f1e9] px-2.5 py-1 text-[11px] font-medium text-[#146c2e]">
            {car.condition}
          </span>
        )}
        {car.category && (
          <span className="rounded-full bg-[#f1f6f2] px-2.5 py-1 text-[11px] font-medium text-[#5f695f]">
            {prettifyValue("category", car.category)}
          </span>
        )}
      </div>
      <h1 className="mt-2.5 text-[24px] font-semibold leading-[1.15] tracking-[-0.035em] text-[#07111f] sm:text-[27px]">
        {title}
      </h1>
      {car.modelDescription && (
        <p className="mt-1.5 text-[13px] leading-5 text-[#5f695f]">
          {car.modelDescription}
        </p>
      )}
    </div>
  );
}

function TabSection({ title, children }) {
  return (
    <div>
      <h2 className="mb-5 text-[18px] font-semibold tracking-[-0.02em] text-[#07111f] sm:text-xl">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Bullet({ children }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-[#1d241d]">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#e6f1e9]">
        <BsCheck2 className="h-3.5 w-3.5 text-[#146c2e]" />
      </span>
      {children}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#f4f5f2] pb-16 pt-6">
      <div className={WRAPPER}>
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-black/[0.06]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_352px]">
          <div className="space-y-6">
            <div className="aspect-[16/10] animate-pulse rounded-2xl bg-black/[0.06]" />
            <div className="h-[92px] animate-pulse rounded-2xl bg-black/[0.06]" />
            <div className="h-96 animate-pulse rounded-2xl bg-black/[0.06]" />
          </div>
          <aside className="space-y-5">
            <div className="h-80 animate-pulse rounded-2xl bg-black/[0.06]" />
            <div className="h-44 animate-pulse rounded-2xl bg-black/[0.06]" />
          </aside>
        </div>
      </div>
    </main>
  );
}
