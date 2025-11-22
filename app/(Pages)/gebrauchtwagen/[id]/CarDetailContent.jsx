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
import ImageSlider from "./ImageSlider";
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

// ----------------- MAIN COMPONENT -----------------

function CarDetailContent({ car }) {
  const [showContactForm, setShowContactForm] = useState(false);
  const [activeTab, setActiveTab] = useState("übersicht");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const baseBtn = isMobile
    ? "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors"
    : "inline-flex h-9 items-center justify-center rounded-md px-3 text-[11px] sm:text-xs font-medium transition-colors";

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
              {
                label: "Beheizbare Frontscheibe",
                value: car.heatedWindshield ? "Ja" : "Nein",
              },
              {
                label: "Zentralverriegelung",
                value: car.centralLocking ? "Ja" : "Nein",
              },
              {
                label: "Multifunktionslenkrad",
                value: car.multifunctionalWheel ? "Ja" : "Nein",
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
        {
          label: isMobile ? "Sprachsteuerung" : "Sprachsteuerung",
          value: car.voiceControl ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Wireless Charging" : "Wireless Charging",
          value: car.wirelessCharging ? "Ja" : "Nein",
        },
        ...(isMobile
          ? []
          : [
              { label: "USB", value: car.usb ? "Ja" : "Nein" },
              { label: "CD-Player", value: car.cdPlayer ? "Ja" : "Nein" },
              {
                label: "Freisprecheinrichtung",
                value: car.handsFreePhoneSystem ? "Ja" : "Nein",
              },
              { label: "Radio", value: car.radio?.join(", ") || "-" },
              {
                label: "Bordcomputer",
                value: car.onBoardComputer ? "Ja" : "Nein",
              },
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
        ...(isMobile
          ? []
          : [
              { label: "Sitzkühlung", value: car.seatCooling ? "Ja" : "Nein" },
              { label: "Sitzmemory", value: car.memorySeats ? "Ja" : "Nein" },
              { label: "Armlehne", value: car.armRest ? "Ja" : "Nein" },
              {
                label: "Massagefunktion",
                value: car.seatMassage ? "Ja" : "Nein",
              },
            ]),
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
        ...(isMobile
          ? []
          : [
              {
                label: "Kollisionswarnung",
                value: car.collisionAvoidance ? "Ja" : "Nein",
              },
              { label: "Alarmanlage", value: car.alarmSystem ? "Ja" : "Nein" },
              {
                label: "Wegfahrsperre",
                value: car.immobilizer ? "Ja" : "Nein",
              },
              { label: "Isofix", value: car.isofix ? "Ja" : "Nein" },
              {
                label: "Notrufsystem",
                value: car.emergencyCallSystem ? "Ja" : "Nein",
              },
            ]),
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
          label: isMobile ? "Fernlichtassist." : "Fernlichtassistent",
          value: car.highBeamAssist ? "Ja" : "Nein",
        },
        {
          label: isMobile ? "Kurvenlicht" : "Kurvenlicht",
          value: prettifyValue("bendingLightsType", car.bendingLightsType),
        },
        ...(isMobile
          ? []
          : [
              {
                label: "Scheinwerferwaschanlage",
                value: car.headlightWasherSystem ? "Ja" : "Nein",
              },
              {
                label: "Blendfreies Fernlicht",
                value: car.glareFreeHighBeam ? "Ja" : "Nein",
              },
            ]),
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
          label: isMobile ? "360° Kamera" : "360° Kamera",
          value: car.parkingAssistants?.includes("CAM_360_DEGREES")
            ? "Ja"
            : "Nein",
        },
        ...(isMobile
          ? []
          : [
              {
                label: "Frontsensoren",
                value: car.parkingAssistants?.includes("FRONT_SENSORS")
                  ? "Ja"
                  : "Nein",
              },
              {
                label: "Hecksensoren",
                value: car.parkingAssistants?.includes("REAR_SENSORS")
                  ? "Ja"
                  : "Nein",
              },
            ]),
        {
          label: isMobile ? "Einparkhilfe" : "Einparkhilfe",
          value: car.parkingAssist ? "Ja" : "Nein",
        },
      ],
    },
  ];

  const highlightSpecs = [
    {
      icon: (
        <FaTachometerAlt
          className={isMobile ? "h-3 w-3 text-sky-100" : "h-4 w-4 text-sky-100"}
        />
      ),
      label: isMobile ? "Kilometer" : "Kilometerstand",
      value: car.mileage ? `${car.mileage.toLocaleString("de-DE")} km` : "-",
    },
    {
      icon: (
        <FaCar
          className={isMobile ? "h-3 w-3 text-sky-100" : "h-4 w-4 text-sky-100"}
        />
      ),
      label: "Erstzulassung",
      value: formatDate(car.firstRegistration),
    },
    {
      icon: (
        <FaGasPump
          className={isMobile ? "h-3 w-3 text-sky-100" : "h-4 w-4 text-sky-100"}
        />
      ),
      label: "Kraftstoff",
      value: prettifyValue("fuel", car.fuel),
    },
    {
      icon: (
        <GiGearStick
          className={isMobile ? "h-3 w-3 text-sky-100" : "h-4 w-4 text-sky-100"}
        />
      ),
      label: "Getriebe",
      value: prettifyValue("gearbox", car.gearbox),
    },
    {
      icon: (
        <GiCarDoor
          className={isMobile ? "h-3 w-3 text-sky-100" : "h-4 w-4 text-sky-100"}
        />
      ),
      label: "Türen",
      value: prettifyValue("doors", car.doors),
    },
    {
      icon: (
        <FaChair
          className={isMobile ? "h-3 w-3 text-sky-100" : "h-4 w-4 text-sky-100"}
        />
      ),
      label: "Sitze",
      value: car.seats || "-",
    },
  ];

  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-50 overflow-x-hidden">
        <main className="relative z-10 mx-auto w-full max-w-[1500px] px-3 pb-8 pt-4">
          {/* HERO */}
          <section className="mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {car.condition && (
                  <span className="rounded-full bg-sky-600/10 px-2 py-1 font-medium text-sky-300 ring-1 ring-sky-500/40">
                    {car.condition}
                  </span>
                )}
                {car.category && (
                  <span className="rounded-full bg-slate-900/80 px-2 py-1 text-slate-300 ring-1 ring-slate-700/70">
                    {prettifyValue("category", car.category)}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  {car.make} {car.model}
                </h1>
                {car.modelDescription && (
                  <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                    {car.modelDescription}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {highlightSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-xs shadow-sm"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10">
                      {spec.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-slate-400">
                        {spec.label}
                      </div>
                      <div className="truncate text-[11px] font-medium text-slate-50">
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
          </section>

          {/* PRICE & CTA MOBILE */}
          <section className="mb-4">
            <div className="rounded-xl border border-sky-700/60 bg-slate-950/95 p-3 shadow-lg">
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
                  className={`${baseBtn} bg-sky-600 text-white hover:bg-sky-500 text-xs`}
                >
                  Probefahrt anfragen
                </button>
              </div>
            </div>
          </section>

          {/* IMAGES */}
          <section className="mb-4">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/95 shadow-sm">
              {car.images?.length > 0 ? (
                <ImageSlider
                  images={car.images.map((img) => img.ref)}
                  car={{ make: car.make, model: car.model }}
                  isMobile={isMobile}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-slate-500 text-sm">
                  Keine Bilder
                </div>
              )}
            </div>
          </section>

          {/* MAIN CONTENT */}
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
                {/* TAB: ÜBERSICHT */}
                {activeTab === "übersicht" && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-white">
                      Fahrzeugübersicht
                    </h2>
                    <div className="grid gap-3">
                      <SpecCard
                        icon={<FaCar className="h-3 w-3" />}
                        title="Allgemein"
                        items={[
                          { label: "VIN", value: car.vin },
                          {
                            label: "Klasse",
                            value: prettifyValue("category", car.category),
                          },
                          { label: "Zustand", value: car.condition },
                          {
                            label: "EZ",
                            value: formatDate(car.firstRegistration),
                          },
                          {
                            label: "TÜV",
                            value:
                              typeof car.newHuAu === "string"
                                ? car.newHuAu.toLowerCase().includes("neu")
                                  ? "neu"
                                  : `bis ${car.newHuAu}`
                                : "-",
                          },
                        ]}
                        isMobile={isMobile}
                      />

                      <SpecCard
                        icon={<BsSpeedometer2 className="h-3 w-3" />}
                        title="Technik"
                        items={[
                          {
                            label: "Leistung",
                            value: car.power ? `${car.power} kW` : "-",
                          },
                          {
                            label: "Hubraum",
                            value: car.cubicCapacity
                              ? `${(car.cubicCapacity / 1000).toLocaleString(
                                  "de-DE",
                                  {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  }
                                )} l`
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
                        icon={<IoMdColorPalette className="h-3 w-3" />}
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
                )}

                {/* TAB: AUSSTATTUNG */}
                {activeTab === "ausstattung" && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-white">
                      Ausstattung
                    </h2>
                    <div className="grid gap-3">
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
                )}

                {/* TAB: FEATURES */}
                {activeTab === "features" && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-white">
                      Features & Sicherheit
                    </h2>
                    <div className="grid gap-3">
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
                )}

                {/* TAB: TECHNIK */}
                {activeTab === "technik" && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-white">
                      Technische Daten
                    </h2>
                    <div className="grid gap-3">
                      <SpecCard
                        icon={<GiSteeringWheel className="h-3 w-3" />}
                        title="Motor & Antrieb"
                        items={[
                          {
                            label: "Leistung",
                            value: car.power ? `${car.power} kW` : "-",
                          },
                          {
                            label: "Hubraum",
                            value: car.cubicCapacity
                              ? `${(car.cubicCapacity / 1000).toLocaleString(
                                  "de-DE",
                                  {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  }
                                )} l`
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
                        icon={<RiTempColdLine className="h-3 w-3" />}
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
                )}

                {/* TAB: BESCHREIBUNG */}
                {activeTab === "beschreibung" && car.description && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-white">
                      Beschreibung
                    </h2>
                    <div className="max-h-[50vh] space-y-1 overflow-y-auto pr-1 text-xs">
                      {renderDescription(car.description, isMobile)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR CONTENT - MOBILE */}
            <div className="space-y-3">
              {/* HIGHLIGHTS */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <FaSun className="h-3 w-3" />
                  </div>
                  <h3 className="text-xs font-semibold text-white">
                    Highlights
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    car.panoramicGlassRoof && "Panoramadach",
                    car.navigationSystem && "Navigation",
                    car.leatherSteeringWheel && "Lederlenkrad",
                    car.electricAdjustableSeats && "Elekt. Sitze",
                    car.keylessEntry && "Keyless Entry",
                    car.headUpDisplay && "Head-Up-Display",
                    car.summerTires && "Sommerreifen",
                    car.winterTires && "Winterreifen",
                    car.fullServiceHistory && "Scheckheft",
                  ]
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/10">
                          <BsCheck2 className="h-2 w-2 text-sky-400" />
                        </div>
                        <span className="text-slate-200">{highlight}</span>
                      </div>
                    ))}
                </div>
              </div>
              {/* CONTACT CTA */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm">
                <button
                  onClick={() => setShowContactForm(true)}
                  className={`${baseBtn} w-full bg-sky-600 text-white hover:bg-sky-500 text-xs`}
                >
                  Probefahrt vereinbaren
                </button>
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Unser Team meldet sich schnellstmöglich bei Ihnen.
                </p>
              </div>
              {/* FINANCE CALCULATOR */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm">
                <FinanceCalculatorAdvanced
                  price={car.price?.consumerPriceGross || 0}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </section>
        </main>

        {/* CONTACT FORM MODAL */}
        {showContactForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2">
            <div className="w-full max-w-full max-h-[95vh] overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-3 py-2 rounded-t-xl flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white truncate">
                    Probefahrt anfragen
                  </h3>
                  <p className="text-red-100 text-xs mt-0.5 truncate">
                    {car.make} {car.model}
                  </p>
                </div>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg
                    className="h-3 w-3"
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
              <div className="p-3">
                <div className="space-y-3">
                  {/* Form */}
                  <div className="border border-gray-200 rounded-lg p-2 bg-white">
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

  // DESKTOP VIEW (original code)
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50">
      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="mb-8 sm:mb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px]">
                {car.condition && (
                  <span className="rounded-full bg-sky-600/10 px-3 py-1 font-medium text-sky-300 ring-1 ring-sky-500/40">
                    {car.condition}
                  </span>
                )}
                {car.category && (
                  <span className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-300 ring-1 ring-slate-700/70">
                    {prettifyValue("category", car.category)}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {car.make} {car.model}
                </h1>
                {car.modelDescription && (
                  <p className="mt-1 max-w-2xl text-sm text-slate-300 sm:text-base">
                    {car.modelDescription}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:max-w-xl">
                {highlightSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-xs shadow-sm shadow-black/40"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                      {spec.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-400">
                        {spec.label}
                      </div>
                      <div className="truncate text-[12px] font-medium text-slate-50 sm:text-[13px]">
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

            {/* PRICE CARD */}
            <div className="w-full mr-6 max-w-sm rounded-2xl border border-sky-700/60 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-5 shadow-xl shadow-black/50">
              {/* Top: Price + badges */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Gesamtpreis
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
                    {formatPrice(car.price)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    Sofort verfügbar
                  </span>
                </div>
              </div>

              {/* Benefits */}
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
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                    <BsCheck2 className="h-3 w-3" />
                  </span>
                  <span>
                    Transparenter Kaufvertrag – keine versteckten Kosten
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowContactForm(true)}
                className={`${baseBtn} mt-5 w-full cursor-pointer bg-sky-600 text-white hover:bg-sky-500`}
              >
                Probefahrt anfragen
              </button>
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* IMAGES */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-sm shadow-black/40">
              {car.images?.length > 0 ? (
                <ImageSlider
                  images={car.images.map((img) => img.ref)}
                  car={{ make: car.make, model: car.model }}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-slate-500">
                  Keine Bilder verfügbar
                </div>
              )}
            </div>

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
                {/* TAB: ÜBERSICHT */}
                {activeTab === "übersicht" && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                      Fahrzeugübersicht
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <SpecCard
                        icon={<FaCar className="h-4 w-4" />}
                        title="Allgemeine Daten"
                        items={[
                          { label: "VIN", value: car.vin },
                          {
                            label: "Fahrzeugklasse",
                            value: prettifyValue("category", car.category),
                          },
                          { label: "Zustand", value: car.condition },
                          {
                            label: "Schadstoffklasse",
                            value: car.emissionClass,
                          },
                          {
                            label: "Erstzulassung",
                            value: formatDate(car.firstRegistration),
                          },
                          {
                            label: "TÜV / HU",
                            value:
                              typeof car.newHuAu === "string"
                                ? car.newHuAu.toLowerCase().includes("neu")
                                  ? "TÜV neu"
                                  : `TÜV bis ${car.newHuAu}`
                                : "-",
                          },
                          ...(car.summerTires
                            ? [{ label: "Sommerreifen", value: "Ja" }]
                            : []),
                          ...(car.winterTires
                            ? [{ label: "Winterreifen", value: "Ja" }]
                            : []),
                          ...(car.fullServiceHistory
                            ? [{ label: "Scheckheft gepflegt", value: "Ja" }]
                            : []),
                        ]}
                      />

                      <SpecCard
                        icon={<BsSpeedometer2 className="h-4 w-4" />}
                        title="Technische Daten"
                        items={[
                          {
                            label: "Leistung",
                            value: car.power ? `${car.power} kW` : "-",
                          },
                          {
                            label: "Hubraum",
                            value: car.cubicCapacity
                              ? `${(car.cubicCapacity / 1000).toLocaleString(
                                  "de-DE",
                                  {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  }
                                )} l`
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
                            label: "Antriebsart",
                            value: prettifyValue("driveType", car.driveType),
                          },
                          ...(car.hasAllSeasonTires
                            ? [{ label: "Ganzjahresreifen", value: "Ja" }]
                            : []),
                        ]}
                      />

                      <SpecCard
                        icon={<IoMdColorPalette className="h-4 w-4" />}
                        title="Außen"
                        items={[
                          {
                            label: "Farbe",
                            value: prettifyValue("color", car.exteriorColor),
                          },
                          {
                            label: "Herstellerfarbe",
                            value: car.manufacturerColorName,
                          },
                          {
                            label: "Metallic",
                            value: car.metallic ? "Ja" : "Nein",
                          },
                          {
                            label: "Alufelgen",
                            value: car.alloyWheels ? "Ja" : "Nein",
                          },
                          {
                            label: "Sommerreifen",
                            value: car.summerTires ? "Ja" : "Nein",
                          },
                        ]}
                      />

                      <SpecCard
                        icon={<FaChair className="h-4 w-4" />}
                        title="Innen"
                        items={[
                          {
                            label: "Innenausstattung",
                            value: car.interiorType,
                          },
                          {
                            label: "Innenfarbe",
                            value: prettifyValue("color", car.exteriorColor),
                          },
                          {
                            label: "Sportsitze",
                            value: car.sportSeats ? "Ja" : "Nein",
                          },
                          {
                            label: "Sportpaket",
                            value: car.sportPackage ? "Ja" : "Nein",
                          },
                          {
                            label: "Ambiente-Beleuchtung",
                            value: car.ambientLighting ? "Ja" : "Nein",
                          },
                        ]}
                      />
                    </div>
                  </div>
                )}

                {/* TAB: AUSSTATTUNG */}
                {activeTab === "ausstattung" && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                      Ausstattung
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      {ausstattungCategories.map((cat, idx) => (
                        <SpecCard
                          key={idx}
                          icon={cat.icon}
                          title={cat.title}
                          items={cat.features}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: FEATURES */}
                {activeTab === "features" && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                      Features & Sicherheit
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      {featuresCategories.map((cat, idx) => (
                        <SpecCard
                          key={idx}
                          icon={cat.icon}
                          title={cat.title}
                          items={cat.features}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB: TECHNIK */}
                {activeTab === "technik" && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                      Technische Daten
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <SpecCard
                        icon={<GiSteeringWheel className="h-4 w-4" />}
                        title="Motor & Antrieb"
                        items={[
                          {
                            label: "Leistung",
                            value: car.power ? `${car.power} kW` : "-",
                          },
                          {
                            label: "Hubraum",
                            value: car.cubicCapacity
                              ? `${(car.cubicCapacity / 1000).toLocaleString(
                                  "de-DE",
                                  {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                  }
                                )} l`
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
                            label: "Antriebsart",
                            value: prettifyValue("driveType", car.driveType),
                          },
                          {
                            label: "Start-Stopp-Automatik",
                            value: car.startStopSystem ? "Ja" : "Nein",
                          },
                          {
                            label: "Traktionskontrolle",
                            value: car.tractionControlSystem ? "Ja" : "Nein",
                          },
                          {
                            label: "Schaltwippen",
                            value: car.paddleShifters ? "Ja" : "Nein",
                          },
                        ]}
                      />

                      <SpecCard
                        icon={<RiTempColdLine className="h-4 w-4" />}
                        title="Verbrauch & Emissionen"
                        items={[
                          {
                            label: "Kombinierter Verbrauch",
                            value: car.consumptions?.fuel?.combined
                              ? `${car.consumptions.fuel.combined} L/100km`
                              : "-",
                          },
                          {
                            label: "CO₂-Emissionen",
                            value: car.emissions?.combined?.co2
                              ? `${car.emissions.combined.co2} g/km`
                              : "-",
                          },
                          {
                            label: "Schadstoffklasse",
                            value: car.emissionClass,
                          },
                          {
                            label: "E10-tauglich",
                            value: car.e10Enabled ? "Ja" : "Nein",
                          },
                        ]}
                      />

                      <SpecCard
                        icon={<GiCarWheel className="h-4 w-4" />}
                        title="Abmessungen & Sonstiges"
                        items={[
                          {
                            label: "Türen",
                            value: prettifyValue("doors", car.doors),
                          },
                          { label: "Sitzplätze", value: car.seats },
                          {
                            label: "Garantie",
                            value: car.warranty ? "Ja" : "Nein",
                          },
                          {
                            label: "Full Service Historie",
                            value: car.fullServiceHistory ? "Ja" : "Nein",
                          },
                          {
                            label: "Unfallschaden",
                            value: car.accidentDamaged ? "Ja" : "Nein",
                          },
                        ]}
                      />
                    </div>
                  </div>
                )}

                {/* TAB: BESCHREIBUNG */}
                {activeTab === "beschreibung" && car.description && (
                  <div>
                    <h2 className="mb-4 text-lg font-semibold text-white sm:mb-6 sm:text-xl">
                      Beschreibung
                    </h2>
                    <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
                      {renderDescription(car.description)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4 sm:space-y-5">
            {/* CONTACT CARD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/40 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <FaCar className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  Fahrzeug anfragen
                </h3>
              </div>
              <button
                onClick={() => setShowContactForm(true)}
                className={`${baseBtn} w-full bg-sky-600 text-white hover:bg-sky-500`}
              >
                Probefahrt vereinbaren
              </button>
              <p className="mt-3 text-[11px] text-slate-400 sm:text-xs">
                Unser Team meldet sich schnellstmöglich bei Ihnen.
              </p>
            </div>

            {/* HIGHLIGHTS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/40 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                  <FaSun className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  Highlights
                </h3>
              </div>
              <div className="space-y-2 text-xs sm:text-[13px]">
                {[
                  car.panoramicGlassRoof && "Panoramadach",
                  car.navigationSystem && "Navigationssystem",
                  car.leatherSteeringWheel && "Lederlenkrad",
                  car.electricAdjustableSeats && "Elektrische Sitze",
                  car.keylessEntry && "Keyless Entry",
                  car.headUpDisplay && "Head-Up-Display",
                  car.summerTires && "Sommerreifen",
                  car.winterTires && "Winterreifen",
                  car.fullServiceHistory && "Scheckheft gepflegt",
                  car.newHuAu &&
                    `TÜV ${
                      typeof car.newHuAu === "string" &&
                      car.newHuAu.toLowerCase().includes("neu")
                        ? "neu"
                        : "bis " + car.newHuAu
                    }`,
                  car.hasAllSeasonTires && "Ganzjahresreifen",
                ]
                  .filter(Boolean)
                  .map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10">
                        <BsCheck2 className="h-3 w-3 text-sky-400" />
                      </div>
                      <span className="text-slate-200">{highlight}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* FINANCE CALCULATOR */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-sm shadow-black/40 sm:p-5">
              <FinanceCalculatorAdvanced
                price={car.price?.consumerPriceGross || 0}
              />
            </div>
          </div>
        </section>
      </main>

      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 md:px-6 md:py-4 rounded-t-2xl flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg md:text-2xl font-bold text-white truncate">
                  Probefahrt anfragen
                </h3>
                <p className="text-red-100 text-xs md:text-sm mt-1 truncate">
                  {car.make} {car.model}
                </p>
              </div>
              <button
                onClick={() => setShowContactForm(false)}
                className="ml-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg
                  className="h-4 w-4 md:h-5 md:w-5"
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

            {/* Content: car summary + form */}
            <div className="p-4 md:p-2  ">
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr,1.5fr] gap-4 md:gap-6 items-start">
                {/* Form (right) */}
                <div className=" rounded-xl p-3 md:p-4 bg-white">
                  <ContactForm
                    car={car}
                    onSuccess={() => setShowContactForm(false)}
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
