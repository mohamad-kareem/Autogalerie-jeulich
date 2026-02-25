"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiCamera, FiX, FiFilter } from "react-icons/fi";
import { ArrowLeft } from "lucide-react";
import WaitingLounge from "@/app/(components)/helpers/WaitingLounge";

const carBrands = [
  { name: "BMW", logo: "/logos/bmw.png" },
  { name: "Citroen", logo: "/logos/citroen1.png" },
  { name: "Volkswagen", logo: "/logos/vw2.png" },
  { name: "Fiat", logo: "/logos/fiattest.png" },
  { name: "Ford", logo: "/logos/ford.png" },
  { name: "Opel", logo: "/logos/opel44.png" },
  { name: "Dacia", logo: "/logos/Dacia1.png" },
  { name: "Honda", logo: "/logos/honda1.png" },
  { name: "Mercedes", logo: "/logos/Mercedes2.png" },
  { name: "Suzuki", logo: "/logos/suzuki.png" },
  { name: "Renault", logo: "/logos/Renault.png" },
  { name: "Skoda", logo: "/logos/skodaa.png" },
  { name: "Hyundai", logo: "/logos/hyundia.png" },
  { name: "Peugeot", logo: "/logos/peugeot1.png" },
  { name: "Mazda", logo: "/logos/mazdaa.png" },
  { name: "Nissan", logo: "/logos/nissan.png" },
  { name: "Seat", logo: "/logos/seat1.png" },
  { name: "Kia", logo: "/logos/kia1.png" },
  { name: "Toyota", logo: "/logos/Toyota1.png" },
  { name: "MiniCooper", logo: "/logos/minicooper1.png" },
  { name: "Audi", logo: "/logos/audi1.png" },
];

const brandSynonyms = {
  Volkswagen: ["Volkswagen", "VW"],
  Mercedes: ["Mercedes", "Mercedes-Benz"],
  MiniCooper: ["Mini", "MiniCooper"],
  BMW: ["BMW"],
  Citroen: ["Citroen"],
  Fiat: ["Fiat"],
  Ford: ["Ford"],
  Opel: ["Opel"],
  Dacia: ["Dacia"],
  Honda: ["Honda"],
  Suzuki: ["Suzuki"],
  Renault: ["Renault"],
  Skoda: ["Skoda"],
  Hyundai: ["Hyundai"],
  Peugeot: ["Peugeot"],
  Mazda: ["Mazda"],
  Nissan: ["Nissan"],
  Seat: ["Seat"],
  Kia: ["Kia"],
  Toyota: ["Toyota"],
  Audi: ["Audi"],
};

const cx = (...c) => c.filter(Boolean).join(" ");

// FIN normalizer (shared)
function normalizeFin(val) {
  return (val || "")
    .toString()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
    .trim();
}

// ✅ Decide if a record is “dead” (sold + removed from system)
function isDeadSoldRecord(schein) {
  const sold = !!schein?.keySold || schein?.stage === "SOLD";
  if (!sold) return false;

  const keyNumber = (schein?.keyNumber || "").trim();
  const keyCount = Number.isFinite(Number(schein?.keyCount))
    ? Number(schein?.keyCount)
    : null;

  // Your exact symptom: Schl.Nr “–”, Anzahl 0
  const looksRemoved =
    (!keyNumber || keyNumber === "–") && (keyCount === 0 || keyCount === null);

  // Also hide if dashboardHidden set (your own “clear” feature)
  const hidden = !!schein?.dashboardHidden;

  return looksRemoved || hidden;
}

export default function KeysPage() {
  const [scheins, setScheins] = useState([]);
  const [carList, setCarList] = useState([]);

  const [filterBrand, setFilterBrand] = useState("");
  const [showSoldOnly, setShowSoldOnly] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);

  const [selectedSchein, setSelectedSchein] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const tableRef = useRef(null);
  const previewRef = useRef(null);
  const idleTimerRef = useRef(null);

  // ---------------------------
  // Dark mode init
  // ---------------------------
  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const systemPrefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setDarkMode(isDark);

    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  // ---------------------------
  // Idle detection → WaitingLounge
  // ---------------------------
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setIsIdle(false);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 10000);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => document.addEventListener(e, resetIdleTimer));
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((e) => document.removeEventListener(e, resetIdleTimer));
    };
  }, []);

  // ---------------------------
  // Fetch data
  // ---------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setIsLoading(true);

        // ✅ important: tell backend we do NOT want dead sold records
        const [scheinRes, carsRes] = await Promise.all([
          fetch("/api/carschein?limit=500&hideDead=1"),
          fetch("/api/cars"),
        ]);

        const scheinData = await scheinRes.json();
        const carsData = await carsRes.json();

        if (!scheinRes.ok)
          throw new Error(scheinData?.error || "Failed to load Scheine");
        if (!Array.isArray(carsData))
          throw new Error("Failed to load cars list");

        const loadedScheins = Array.isArray(scheinData?.docs)
          ? scheinData.docs
          : [];

        if (!cancelled) {
          setScheins(loadedScheins);
          setCarList(carsData);
        }
      } catch (err) {
        console.error(err);
        toast.error("Fehler beim Laden der Schlüssel- und Fahrzeugliste");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------
  // Auto-reset brand/sold filters after 60s
  // ---------------------------
  useEffect(() => {
    if (!filterBrand && !showSoldOnly) return;
    const t = setTimeout(() => {
      setFilterBrand("");
      setShowSoldOnly(false);
    }, 60000);
    return () => clearTimeout(t);
  }, [filterBrand, showSoldOnly]);

  const scrollToTable = useCallback(() => {
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const handleFilterBrand = useCallback(
    (brand) => {
      setFilterBrand((prev) => (prev === brand ? "" : brand));
      scrollToTable();
    },
    [scrollToTable],
  );

  // ---------------------------
  // Filter scheins
  // ---------------------------
  const filteredScheins = useMemo(() => {
    return scheins.filter((car) => {
      // ✅ HARD RULE: never show dead sold records
      if (isDeadSoldRecord(car)) return false;

      const name = (car?.carName || "").toLowerCase();

      if (filterBrand) {
        const aliases = brandSynonyms[filterBrand] || [filterBrand];
        const matchesBrand = aliases.some((a) =>
          name.includes(a.toLowerCase()),
        );
        if (!matchesBrand) return false;
      }

      if (showSoldOnly && !car?.keySold && car?.stage !== "SOLD") return false;

      return true;
    });
  }, [scheins, filterBrand, showSoldOnly]);

  // Keep selection consistent
  useEffect(() => {
    if (isLoading) return;

    if (filteredScheins.length === 0) {
      setSelectedSchein(null);
      return;
    }

    if (
      !selectedSchein ||
      !filteredScheins.some((s) => s._id === selectedSchein._id)
    ) {
      setSelectedSchein(filteredScheins[0]);
    }
  }, [filteredScheins, isLoading, selectedSchein]);

  // ---------------------------
  // Match car image ONLY by FIN
  // ---------------------------
  const matchedCar = useMemo(() => {
    if (!selectedSchein || carList.length === 0) return null;
    const fin = normalizeFin(selectedSchein?.finNumber);
    if (!fin) return null;

    return (
      carList.find(
        (c) => normalizeFin(c.finNumber || c.vin || c.vinNumber) === fin,
      ) || null
    );
  }, [selectedSchein, carList]);

  const previewImageSrc = useMemo(() => {
    if (!matchedCar) return null;
    const imgs = matchedCar?.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      return first?.ref || first?.url || null;
    }
    return null;
  }, [matchedCar]);

  // ---------------------------
  // Theme classes
  // ---------------------------
  const bgClass = darkMode ? "bg-slate-900" : "bg-slate-100/80";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white/95";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";
  const hoverBg = darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50";

  // ---------------------------
  // Vehicle Preview Component
  // ---------------------------
  const VehiclePreview = () => {
    const isSold =
      !!selectedSchein?.keySold || selectedSchein?.stage === "SOLD";
    const hasImage = !!previewImageSrc;

    const previewCardBg = darkMode ? "bg-slate-800" : "bg-white/95";
    const previewBorder = darkMode ? "border-slate-700" : "border-slate-200";
    const previewHeaderBg = darkMode
      ? "bg-gradient-to-r from-slate-700 to-slate-700/80 border-slate-600"
      : "bg-gradient-to-r from-slate-50 to-slate-100/80 border-slate-200";

    return (
      <aside
        ref={previewRef}
        className={cx(
          "mt-4 lg:mt-0 self-start rounded-2xl border shadow-lg overflow-hidden transition-colors duration-300",
          previewCardBg,
          previewBorder,
          darkMode ? "shadow-slate-900/80" : "shadow-slate-200/80",
        )}
      >
        <div
          className={cx(
            "border-b px-4 py-3 transition-colors duration-300",
            previewHeaderBg,
          )}
        >
          <h3
            className={cx(
              "text-sm font-semibold flex items-center gap-2",
              textPrimary,
            )}
          >
            <FiCamera className="w-4 h-4" />
            Fahrzeugvorschau
          </h3>
        </div>

        <div className="p-4">
          <div
            className={cx(
              "relative w-full overflow-hidden rounded-xl border bg-gradient-to-br shadow-sm transition-all duration-300",
              hasImage
                ? darkMode
                  ? "border-slate-600 from-slate-700 to-slate-800"
                  : "border-slate-200 from-slate-50 to-slate-100"
                : darkMode
                  ? "border-blue-700 from-blue-900/50 to-blue-800/30"
                  : "border-blue-200 from-blue-50/50 to-blue-100/30",
            )}
          >
            {isSold && (
              <div className="absolute top-0 right-0 z-30">
                <div className="absolute top-6 right-[-44px] rotate-45 bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white text-[11px] sm:text-[13px] font-extrabold px-10 sm:px-12 py-1 shadow-xl ring-1 ring-white/80 tracking-widest rounded-sm">
                  VERKAUFT
                </div>
              </div>
            )}

            <div className="relative aspect-[4/3] w-full">
              {hasImage ? (
                <Image
                  src={previewImageSrc}
                  alt={
                    matchedCar
                      ? `${matchedCar.make || ""} ${matchedCar.model || ""}`
                      : selectedSchein?.carName || "Fahrzeugbild"
                  }
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <div
                    className={cx(
                      "relative mb-4 rounded-2xl p-6",
                      darkMode
                        ? "bg-gradient-to-br from-blue-900/30 to-blue-800/20"
                        : "bg-gradient-to-br from-blue-100/80 to-blue-200/50",
                    )}
                  >
                    <FiCamera
                      className={cx(
                        "w-12 h-12 mb-2",
                        darkMode ? "text-blue-400" : "text-blue-500",
                      )}
                    />
                    <div
                      className={cx(
                        "w-16 h-1 rounded-full mt-2",
                        darkMode ? "bg-blue-500" : "bg-blue-300",
                      )}
                    />
                  </div>

                  <h4
                    className={cx(
                      "text-sm font-semibold mb-2",
                      darkMode ? "text-blue-300" : "text-blue-700",
                    )}
                  >
                    {selectedSchein
                      ? "Kein Bild verfügbar"
                      : "Noch kein Fahrzeug ausgewählt"}
                  </h4>
                  <p
                    className={cx(
                      "text-xs max-w-xs leading-relaxed",
                      darkMode ? "text-slate-400" : "text-slate-600",
                    )}
                  >
                    {selectedSchein
                      ? "Für dieses Fahrzeug ist aktuell kein Bild in der Datenbank hinterlegt."
                      : "Wählen Sie links in der Tabelle ein Fahrzeug aus, um Details zu sehen."}
                  </p>

                  {selectedSchein?.keyNote && (
                    <div
                      className={cx(
                        "mt-4 p-3 rounded-lg border",
                        darkMode
                          ? "bg-slate-700/80 border-slate-600"
                          : "bg-slate-50/80 border-slate-200/60",
                      )}
                    >
                      <p
                        className={cx(
                          "text-xs font-medium",
                          darkMode ? "text-slate-300" : "text-slate-700",
                        )}
                      >
                        Notiz:
                      </p>
                      <p
                        className={cx(
                          "text-xs mt-1",
                          darkMode ? "text-slate-400" : "text-slate-600",
                        )}
                      >
                        {selectedSchein.keyNote}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {hasImage && selectedSchein && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="text-white">
                  <h4 className="text-sm font-semibold truncate">
                    {matchedCar?.make} {matchedCar?.model}
                  </h4>
                  {selectedSchein?.keyNote && (
                    <p className="text-xs text-white/80 truncate mt-1">
                      {selectedSchein.keyNote}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedSchein && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div
                className={cx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-[clamp(10px,2.4vw,14px)]",
                  darkMode
                    ? "bg-slate-700/70 text-slate-100"
                    : "bg-slate-100 text-slate-900",
                )}
                style={{ flex: "1 1 auto" }}
              >
                <span>Schlüssel:</span>
                <span className="font-bold tracking-wider">
                  {selectedSchein?.keyNumber || "–"}
                </span>
              </div>

              <div
                className={cx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 font-mono tracking-widest text-[clamp(9px,2.2vw,14px)]",
                  darkMode
                    ? "bg-slate-700/70 text-slate-100"
                    : "bg-slate-100 text-slate-900",
                )}
                style={{ flex: "1 1 auto" }}
              >
                <span>FIN:</span>
                <span className="truncate">
                  {selectedSchein?.finNumber || "–"}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  };

  // Waiting Lounge
  if (isIdle) return <WaitingLounge />;

  // Table section
  const tableSection = (
    <section
      ref={tableRef}
      className={cx(
        "overflow-hidden rounded-2xl border shadow-lg transition-colors duration-300",
        cardBg,
        borderColor,
        darkMode ? "shadow-slate-900/80" : "shadow-slate-200/60",
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-[11px] sm:text-xs md:text-sm">
          <thead
            className={cx(
              "border-b transition-colors duration-300",
              darkMode
                ? "border-slate-700 bg-slate-700/80"
                : "border-slate-200 bg-slate-100/80",
            )}
          >
            <tr>
              <th
                className={cx(
                  "px-3 py-2 text-left text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-wide sm:px-4 sm:py-3",
                  textMuted,
                )}
              >
                <div className="flex items-center gap-1">
                  <span>Fahrzeug</span>
                  {filterBrand && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterBrand("");
                      }}
                      className={cx(
                        "inline-flex items-center justify-center rounded-2xl border px-1 py-[2px] text-[9px] transition-colors duration-200",
                        darkMode
                          ? "border-slate-500 text-slate-300 hover:border-blue-400 hover:text-blue-300"
                          : "border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-500",
                      )}
                      title="Markenfilter zurücksetzen"
                    >
                      <FiX className="h-4 w-3" />
                    </button>
                  )}
                </div>
              </th>

              <th
                className={cx(
                  "w-24 px-3 py-2 text-center text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-wide sm:px-4 sm:py-3",
                  textMuted,
                )}
              >
                Schl.Nr.
              </th>

              <th
                className={cx(
                  "w-20 px-3 py-2 text-center text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-wide sm:px-4 sm:py-3",
                  textMuted,
                )}
              >
                Anzahl
              </th>

              <th
                onClick={() => setShowSoldOnly((p) => !p)}
                className={cx(
                  "hidden w-32 px-3 py-2 text-center text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-wide sm:table-cell sm:px-4 sm:py-3 cursor-pointer select-none",
                  showSoldOnly
                    ? darkMode
                      ? "text-emerald-300"
                      : "text-emerald-700"
                    : textMuted,
                )}
                title="Klicken, um nur verkaufte Fahrzeuge anzuzeigen"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <FiFilter
                    className={cx(
                      "h-3 w-3",
                      showSoldOnly
                        ? darkMode
                          ? "text-emerald-300"
                          : "text-emerald-700"
                        : "text-slate-400",
                    )}
                  />
                </div>
              </th>
            </tr>
          </thead>

          <tbody
            className={cx(
              "divide-y tracking-wide transition-colors duration-300",
              darkMode
                ? "divide-slate-700 bg-slate-800"
                : "divide-slate-200 bg-white",
            )}
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-3 sm:px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cx(
                          "h-6 w-6 rounded-full",
                          darkMode ? "bg-slate-700" : "bg-slate-200",
                        )}
                      />
                      <div className="space-y-1">
                        <div
                          className={cx(
                            "h-3 w-28 sm:h-4 sm:w-40 rounded",
                            darkMode ? "bg-slate-700" : "bg-slate-200",
                          )}
                        />
                        <div
                          className={cx(
                            "h-2.5 w-20 sm:w-28 rounded",
                            darkMode ? "bg-slate-700" : "bg-slate-200",
                          )}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center sm:px-4">
                    <div
                      className={cx(
                        "mx-auto h-5 w-14 sm:h-6 sm:w-16 rounded",
                        darkMode ? "bg-slate-700" : "bg-slate-200",
                      )}
                    />
                  </td>
                  <td className="px-3 py-3 text-center sm:px-4">
                    <div
                      className={cx(
                        "mx-auto h-4 w-8 rounded",
                        darkMode ? "bg-slate-700" : "bg-slate-200",
                      )}
                    />
                  </td>
                  <td className="hidden px-3 py-3 text-center sm:table-cell sm:px-4">
                    <div
                      className={cx(
                        "mx-auto h-5 w-20 sm:h-6 rounded",
                        darkMode ? "bg-slate-700" : "bg-slate-200",
                      )}
                    />
                  </td>
                </tr>
              ))
            ) : filteredScheins.length > 0 ? (
              filteredScheins.map((car) => (
                <tr
                  key={car._id}
                  onClick={() => {
                    setSelectedSchein(car);
                    setTimeout(
                      () =>
                        previewRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
                      80,
                    );
                  }}
                  className={cx(
                    "cursor-pointer transition-all duration-200",
                    selectedSchein?._id === car._id
                      ? darkMode
                        ? "bg-sky-900/30 border-l-4 border-l-sky-500 shadow-sm"
                        : "bg-sky-50 border-l-4 border-l-sky-500 shadow-sm"
                      : hoverBg,
                  )}
                >
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {!!car?.keyColor && (
                        <span
                          className="inline-block h-4 w-4 rounded-full border shadow-sm sm:h-5 sm:w-5"
                          style={{ backgroundColor: car.keyColor }}
                          title={`Farbe: ${car.keyColor}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className={cx(
                            "truncate text-xs sm:text-sm font-semibold",
                            car?.keySold || car?.stage === "SOLD"
                              ? `line-through ${darkMode ? "text-slate-500" : "text-slate-400"}`
                              : textPrimary,
                          )}
                          title={car.carName}
                        >
                          {car.carName}
                        </div>
                        {!!car?.keyNote && (
                          <div
                            className={cx(
                              "mt-0.5 truncate text-[11px] sm:text-xs",
                              darkMode ? "text-slate-400" : "text-slate-500",
                            )}
                            title={car.keyNote}
                          >
                            {car.keyNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                    <span
                      className={cx(
                        "inline-flex min-w-[3.2rem] sm:min-w-[3.5rem] md:min-w-[4rem] items-center justify-center rounded-md border px-2 py-1 text-[11px] sm:text-xs md:text-sm font-semibold font-mono",
                        darkMode
                          ? "border-sky-800 bg-sky-900/50 text-slate-200"
                          : "border-sky-100 bg-sky-50 text-slate-800",
                      )}
                    >
                      {car.keyNumber || "–"}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                    <span
                      className={cx(
                        "text-xs sm:text-sm font-semibold",
                        textPrimary,
                      )}
                    >
                      {car.keyCount ?? 2}
                    </span>
                  </td>

                  <td className="hidden px-3 py-2.5 text-center sm:table-cell sm:px-4 sm:py-3">
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full px-2 py-1 sm:px-2 sm:py-1.5 text-[11px] sm:text-xs font-semibold",
                        car?.keySold || car?.stage === "SOLD"
                          ? darkMode
                            ? "text-rose-300"
                            : "text-rose-700"
                          : darkMode
                            ? "text-emerald-500"
                            : "text-emerald-900",
                      )}
                    >
                      {car?.keySold || car?.stage === "SOLD"
                        ? "Verkauft"
                        : "Verfügbar"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <p
                    className={cx(
                      "text-sm font-medium",
                      darkMode ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    Keine Fahrzeuge gefunden
                  </p>
                  <p
                    className={cx(
                      "mt-1 text-[11px] sm:text-xs",
                      darkMode ? "text-slate-500" : "text-slate-400",
                    )}
                  >
                    {filterBrand || showSoldOnly
                      ? "Passen Sie Ihre Filterkriterien an."
                      : "Es sind noch keine Schlüssel-Daten hinterlegt."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div
      className={cx(
        "min-h-screen px-2 py-4 sm:px-3 md:px-4 transition-colors duration-300",
        bgClass,
      )}
    >
      <div className="mx-auto w-full max-w-[1200px] lg:max-w-[1400px]">
        {/* Brand filter */}
        <section className="mb-5 sm:mb-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mt-5">
            {carBrands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleFilterBrand(brand.name)}
                className={cx(
                  "flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 sm:px-2.5 sm:py-3 md:px-3 md:py-3 lg:px-4 lg:py-2 transition-all duration-150",
                  filterBrand === brand.name
                    ? darkMode
                      ? "border-sky-500 bg-sky-900/40 shadow-md shadow-sky-900/40"
                      : "border-sky-500 bg-sky-100 shadow-md"
                    : darkMode
                      ? "border-slate-700 bg-slate-800 hover:border-blue-400 hover:shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                )}
              >
                <div className="mb-1 flex h-10 w-16 sm:h-12 sm:w-20 md:h-20 md:w-28 lg:h-24 lg:w-32 xl:h-28 xl:w-36 items-center justify-center">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={180}
                    height={180}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                </div>

                <span
                  className={cx(
                    "w-full truncate text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium tracking-wide",
                    darkMode ? "text-slate-300" : "text-slate-700",
                  )}
                >
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Table + Preview */}
        <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
          {tableSection}
          <VehiclePreview />
        </div>

        {/* Footer */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/AdminDashboard"
            className={cx(
              "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] sm:text-xs transition-colors duration-200",
              darkMode
                ? "border-slate-500/40 text-slate-300 hover:border-blue-400 hover:text-blue-300 hover:bg-slate-800/60"
                : "border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-700 hover:bg-slate-100",
            )}
            aria-label="Zum Dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>

          <p
            className={cx(
              "text-center text-[10px] sm:text-xs",
              darkMode ? "text-slate-500" : "text-slate-500",
            )}
          >
            Automatische Filterrücksetzung nach 60 Sekunden Inaktivität.
          </p>
        </div>
      </div>
    </div>
  );
}
