"use client";

import { useState } from "react";
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
        line
      )
    ) {
      return (
        <h4
          key={index}
          className="mt-4 mb-1 font-semibold text-xs sm:text-sm md:text-base text-slate-50 break-words whitespace-pre-line"
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
          className="mb-2 text-xs sm:text-sm md:text-base text-slate-200 break-words whitespace-pre-line"
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
          className="ml-4 list-disc text-xs sm:text-sm md:text-base text-slate-200 break-words whitespace-pre-line"
        >
          {line}
        </li>
      );
    }

    return (
      <p
        key={index}
        className="mb-2 text-sm md:text-base text-slate-200 leading-relaxed"
      >
        {line}
      </p>
    );
  });
}

const SpecCard = ({ icon, title, items }) => {
  const visibleItems =
    items?.filter(
      (item) =>
        item.value !== "Nein" &&
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ""
    ) || [];

  if (visibleItems.length === 0) return null;

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

  const baseBtn =
    "inline-flex h-9 items-center justify-center rounded-md px-3 text-[11px] sm:text-xs font-medium transition-colors";

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
      icon: <MdAir className="h-4 w-4" />,
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
      ],
    },
    {
      title: "Unterhaltung",
      icon: <FaMusic className="h-4 w-4" />,
      features: [
        {
          label: "Navigationssystem",
          value: car.navigationSystem ? "Ja" : "Nein",
        },
        { label: "Bluetooth", value: car.redtooth ? "Ja" : "Nein" },
        { label: "Touchscreen", value: car.touchscreen ? "Ja" : "Nein" },
        { label: "Sprachsteuerung", value: car.voiceControl ? "Ja" : "Nein" },
        {
          label: "Wireless Charging",
          value: car.wirelessCharging ? "Ja" : "Nein",
        },
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
      ],
    },
    {
      title: "Sitzausstattung",
      icon: <FaChair className="h-4 w-4" />,
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
        { label: "Sitzkühlung", value: car.seatCooling ? "Ja" : "Nein" },
        { label: "Sitzmemory", value: car.memorySeats ? "Ja" : "Nein" },
        { label: "Armlehne", value: car.armRest ? "Ja" : "Nein" },
        { label: "Massagefunktion", value: car.seatMassage ? "Ja" : "Nein" },
      ],
    },
  ];

  const featuresCategories = [
    {
      title: "Sicherheit",
      icon: <FaShieldAlt className="h-4 w-4" />,
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
        {
          label: "Kollisionswarnung",
          value: car.collisionAvoidance ? "Ja" : "Nein",
        },
        { label: "Alarmanlage", value: car.alarmSystem ? "Ja" : "Nein" },
        { label: "Wegfahrsperre", value: car.immobilizer ? "Ja" : "Nein" },
        { label: "Isofix", value: car.isofix ? "Ja" : "Nein" },
        {
          label: "Notrufsystem",
          value: car.emergencyCallSystem ? "Ja" : "Nein",
        },
      ],
    },
    {
      title: "Licht",
      icon: <FaLightbulb className="h-4 w-4" />,
      features: [
        {
          label: "Scheinwerferwaschanlage",
          value: car.headlightWasherSystem ? "Ja" : "Nein",
        },
        {
          label: "Nebelscheinwerfer",
          value: car.frontFogLights ? "Ja" : "Nein",
        },
        { label: "Lichtsensor", value: car.lightSensor ? "Ja" : "Nein" },
        {
          label: "Fernlichtassistent",
          value: car.highBeamAssist ? "Ja" : "Nein",
        },
        {
          label: "Blendfreies Fernlicht",
          value: car.glareFreeHighBeam ? "Ja" : "Nein",
        },
        {
          label: "Kurvenlicht",
          value: prettifyValue("bendingLightsType", car.bendingLightsType),
        },
      ],
    },
    {
      title: "Parken",
      icon: <FaParking className="h-4 w-4" />,
      features: [
        {
          label: "Parkassistent",
          value: prettifyValue("parkingAssistants", car.parkingAssistants),
        },
        {
          label: "360° Kamera",
          value: car.parkingAssistants?.includes("CAM_360_DEGREES")
            ? "Ja"
            : "Nein",
        },
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
        { label: "Einparkhilfe", value: car.parkingAssist ? "Ja" : "Nein" },
      ],
    },
  ];

  const highlightSpecs = [
    {
      icon: <FaTachometerAlt className="h-4 w-4 text-sky-100" />,
      label: "Kilometerstand",
      value: car.mileage ? `${car.mileage.toLocaleString("de-DE")} km` : "-",
    },
    {
      icon: <FaCar className="h-4 w-4 text-sky-100" />,
      label: "Erstzulassung",
      value: formatDate(car.firstRegistration),
    },
    {
      icon: <FaGasPump className="h-4 w-4 text-sky-100" />,
      label: "Kraftstoff",
      value: prettifyValue("fuel", car.fuel),
    },
    {
      icon: <GiGearStick className="h-4 w-4 text-sky-100" />,
      label: "Getriebe",
      value: prettifyValue("gearbox", car.gearbox),
    },
    {
      icon: <GiCarDoor className="h-4 w-4 text-sky-100" />,
      label: "Türen",
      value: prettifyValue("doors", car.doors),
    },
    {
      icon: <FaChair className="h-4 w-4 text-sky-100" />,
      label: "Sitze",
      value: car.seats || "-",
    },
  ];

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
            <div className="w-full max-w-xs rounded-2xl border border-sky-700/60 bg-slate-950/95 p-4 shadow-lg shadow-black/50 sm:p-5">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Gesamtpreis
              </div>
              <div className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
                {formatPrice(car.price)}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                keine versteckten Kosten
              </div>
              <button
                onClick={() => setShowContactForm(true)}
                className={`${baseBtn} mt-4 w-full bg-sky-600 text-white hover:bg-sky-500`}
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
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr,1.5fr] gap-4 md:gap-6 items-start">
                {/* Car summary (left) */}
                <div className="space-y-3 md:space-y-4 border border-gray-200 rounded-xl p-3 md:p-4 bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 md:h-20 md:w-20 overflow-hidden rounded-lg border border-gray-200 flex-shrink-0">
                      <Image
                        src={car.images?.[0]?.ref || "/default-car.jpg"}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                        {car.make} {car.model}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-500 line-clamp-2">
                        {car.modelDescription}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-500">Preis</p>
                      <p className="font-semibold text-slate-600">
                        {car.price?.consumerPriceGross?.toLocaleString(
                          "de-DE",
                          {
                            style: "currency",
                            currency: car.price?.currency || "EUR",
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Kilometerstand</p>
                      <p className="font-medium text-gray-800">
                        {car.mileage?.toLocaleString("de-DE")} km
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Erstzulassung</p>
                      <p className="font-medium text-gray-800">
                        {car.firstRegistration
                          ? `${car.firstRegistration.slice(
                              4,
                              6
                            )}/${car.firstRegistration.slice(0, 4)}`
                          : "EZ unbekannt"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-500">Kraftstoff</p>
                      <p className="font-medium text-gray-800">
                        {car.fuel || "-"}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] md:text-xs text-gray-500">
                    Ihre Anfrage wird direkt an unser Verkaufsteam
                    weitergeleitet.
                  </p>
                </div>

                {/* Form (right) */}
                <div className="border border-gray-200 rounded-xl p-3 md:p-4 bg-white">
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
