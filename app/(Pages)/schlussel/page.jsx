"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  FiSearch,
  FiX,
  FiFilter,
  FiCamera,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { MdSell, MdInventory } from "react-icons/md";
import toast from "react-hot-toast";
import WaitingLounge from "@/app/(components)/helpers/WaitingLounge";

const carBrands = [
  { name: "BMW", logo: "/logos/bmw.png" },
  { name: "Citroen", logo: "/logos/citroen1.png" },
  { name: "Volkswagen", logo: "/logos/Volkswagen2.jpg" },
  { name: "Fiat", logo: "/logos/fiat.jpg" },
  { name: "Ford", logo: "/logos/ford.png" },
  { name: "Opel", logo: "/logos/opel44.png" },
  { name: "Dacia", logo: "/logos/Dacia1.png" },
  { name: "Honda", logo: "/logos/honda1.png" },
  { name: "Mercedes", logo: "/logos/Mercedes2.png" },
  { name: "Suzuki", logo: "/logos/suzuki.jpg" },
  { name: "Renault", logo: "/logos/Renault.png" },
  { name: "Skoda", logo: "/logos/scoda1.jpg" },
  { name: "Hyundai", logo: "/logos/hyundia.jpg" },
  { name: "Peugeot", logo: "/logos/peugeot1.png" },
  { name: "Mazda", logo: "/logos/mazda.png" },
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

export default function KeysPage() {
  // Scheine (keys)
  const [scheins, setScheins] = useState([]);
  // Fahrzeugdaten (mit Bildern)
  const [carList, setCarList] = useState([]);

  const [filterBrand, setFilterBrand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSoldOnly, setShowSoldOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [selectedSchein, setSelectedSchein] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const tableRef = useRef(null);
  const brandsRef = useRef(null);
  const idleTimerRef = useRef(null);
  const previewRef = useRef(null);

  // ---------- Dark mode initialisieren ----------
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // ---------- Idle detection → WaitingLounge ----------
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setIsIdle(false);

      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 10000); // 10 Sekunden
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, []);

  // ---------- Daten laden ----------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [scheinRes, carsRes] = await Promise.all([
          fetch("/api/carschein?limit=500"),
          fetch("/api/cars"),
        ]);

        const scheinData = await scheinRes.json();
        const carsData = await carsRes.json();

        if (!scheinRes.ok) {
          throw new Error(scheinData.error || "Fehler beim Laden der Scheine");
        }
        if (!Array.isArray(carsData)) {
          throw new Error("Fehler beim Laden der Fahrzeugdaten");
        }

        const loadedScheins = Array.isArray(scheinData.docs)
          ? scheinData.docs
          : [];

        setScheins(loadedScheins);
        setCarList(carsData);
      } catch (error) {
        console.error("Fehler beim Laden:", error);
        toast.error("Fehler beim Laden der Schlüssel- und Fahrzeugliste");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------- Auto Reset Brand-Filter nach 60s ----------
  useEffect(() => {
    if (!filterBrand) return;
    const timeout = setTimeout(() => setFilterBrand(""), 60000);
    return () => clearTimeout(timeout);
  }, [filterBrand]);

  const scrollToTable = () => {
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const handleFilterBrand = (brand) => {
    setFilterBrand(brand);
    setSearchTerm("");
    scrollToTable();
  };

  const resetFilters = () => {
    setFilterBrand("");
    setSearchTerm("");
    setShowSoldOnly(false);
    setSelectedSchein(null);

    if (brandsRef.current) {
      brandsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ---------- Filter-Logik ----------
  const filteredScheins = useMemo(
    () =>
      scheins.filter((car) => {
        const name = (car.carName ?? "").toLowerCase();
        const key = (car.keyNumber ?? "").toLowerCase();
        const note = (car.keyNote ?? "").toLowerCase();

        if (filterBrand) {
          const aliases = brandSynonyms[filterBrand] || [filterBrand];
          const matchesBrand = aliases.some((alias) =>
            name.includes(alias.toLowerCase())
          );
          if (!matchesBrand) return false;
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesSearch =
            name.includes(term) || key.includes(term) || note.includes(term);
          if (!matchesSearch) return false;
        }

        if (showSoldOnly && !car.keySold) return false;

        return true;
      }),
    [scheins, filterBrand, searchTerm, showSoldOnly]
  );

  // ---------- Auswahl immer konsistent halten ----------
  useEffect(() => {
    if (isLoading) return;

    if (filteredScheins.length === 0) {
      setSelectedSchein(null);
      return;
    }

    // falls nichts gewählt ist oder die Auswahl nicht mehr in der Liste ist → ersten nehmen
    if (
      !selectedSchein ||
      !filteredScheins.some((s) => s._id === selectedSchein._id)
    ) {
      setSelectedSchein(filteredScheins[0]);
    }
  }, [filteredScheins, isLoading, selectedSchein]);

  // Helper: FIN normalisieren (nur Buchstaben/Zahlen, lowercase)
  const normalizeFin = (val) =>
    (val || "")
      .toString()
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();

  // ---------- Passendes Auto + Bild NUR über FIN finden ----------
  const matchedCar = useMemo(() => {
    if (!selectedSchein || carList.length === 0) return null;

    const fin = normalizeFin(selectedSchein.finNumber);
    if (!fin) return null;

    const carByFin = carList.find((c) => {
      const carFin = normalizeFin(c.finNumber || c.vin || c.vinNumber);
      return carFin && carFin === fin;
    });

    return carByFin || null;
  }, [selectedSchein, carList]);

  const previewImageSrc = useMemo(() => {
    if (!matchedCar) return null;
    if (Array.isArray(matchedCar.images) && matchedCar.images.length > 0) {
      const first = matchedCar.images[0];
      return first?.ref || first?.url || null;
    }
    return null;
  }, [matchedCar]);

  // ---------- Theme classes ----------
  const bgClass = darkMode ? "bg-slate-900" : "bg-slate-100/80";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white/95";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";
  const hoverBg = darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50";

  const inputBg = darkMode
    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-sky-500 focus:ring-sky-500";

  // ---------- Modern Vehicle Preview Component ----------
  const VehiclePreview = () => {
    const isSold = selectedSchein?.keySold;
    const hasImage = !!previewImageSrc;

    const previewCardBg = darkMode ? "bg-slate-800" : "bg-white/95";
    const previewBorder = darkMode ? "border-slate-700" : "border-slate-200";
    const previewHeaderBg = darkMode
      ? "bg-gradient-to-r from-slate-700 to-slate-700/80 border-slate-600"
      : "bg-gradient-to-r from-slate-50 to-slate-100/80 border-slate-200";

    return (
      <aside
        ref={previewRef}
        className={`mt-4 lg:mt-0 self-start rounded-2xl border shadow-lg overflow-hidden transition-colors duration-300 ${previewCardBg} ${previewBorder} ${
          darkMode ? "shadow-slate-900/80" : "shadow-slate-200/80"
        }`}
      >
        {/* Header */}
        <div
          className={`border-b px-4 py-3 transition-colors duration-300 ${previewHeaderBg}`}
        >
          <h3
            className={`text-sm font-semibold flex items-center gap-2 transition-colors duration-300 ${textPrimary}`}
          >
            <FiCamera className="w-4 h-4" />
            Fahrzeugvorschau
          </h3>
          <p
            className={`mt-0.5 text-[11px] transition-colors duration-300 ${textMuted}`}
          >
            {selectedSchein?.carName ||
              (filteredScheins.length === 0
                ? "Keine Fahrzeuge vorhanden"
                : "Bitte ein Fahrzeug in der Tabelle auswählen")}
          </p>
        </div>

        {/* Preview Content */}
        <div className="p-4">
          <div
            className={`relative w-full overflow-hidden rounded-xl border bg-gradient-to-br shadow-sm transition-all duration-300 ${
              hasImage
                ? darkMode
                  ? "border-slate-600 from-slate-700 to-slate-800"
                  : "border-slate-200 from-slate-50 to-slate-100"
                : darkMode
                ? "border-blue-700 from-blue-900/50 to-blue-800/30"
                : "border-blue-200 from-blue-50/50 to-blue-100/30"
            }`}
          >
            {/* VERKAUFT ribbon (deine ursprüngliche Version) */}
            {isSold && (
              <div className="absolute top-0 right-0 z-30 animate-fade-in">
                <div className="relative">
                  <div className="absolute top-6 right-[-44px] transform rotate-45 bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white text-[11px] sm:text-[13px] font-extrabold px-10 sm:px-12 py-1 shadow-xl ring-1 ring-white/80 drop-shadow-sm backdrop-blur-md tracking-widest rounded-sm">
                    VERKAUFT
                  </div>
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
                  className="object-cover transition-all duration-500"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                  <div
                    className={`relative mb-4 rounded-2xl p-6 ${
                      darkMode
                        ? "bg-gradient-to-br from-blue-900/30 to-blue-800/20"
                        : "bg-gradient-to-br from-blue-100/80 to-blue-200/50"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <FiCamera
                        className={`w-12 h-12 mb-2 ${
                          darkMode ? "text-blue-400" : "text-blue-500"
                        }`}
                      />
                      <div
                        className={`w-16 h-1 rounded-full mt-2 ${
                          darkMode ? "bg-blue-500" : "bg-blue-300"
                        }`}
                      />
                    </div>
                  </div>

                  <h4
                    className={`text-sm font-semibold mb-2 ${
                      darkMode ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    {selectedSchein
                      ? "Kein Bild verfügbar"
                      : filteredScheins.length === 0
                      ? "Keine Fahrzeugdaten"
                      : "Noch kein Fahrzeug ausgewählt"}
                  </h4>
                  <p
                    className={`text-xs max-w-xs leading-relaxed ${
                      darkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {selectedSchein
                      ? "Für dieses Fahrzeug ist aktuell kein Bild in der Datenbank hinterlegt."
                      : filteredScheins.length === 0
                      ? "Sobald Fahrzeugschlüssel angelegt sind und Fahrzeugdaten vorhanden sind, erscheinen sie hier."
                      : "Wählen Sie links in der Tabelle ein Fahrzeug aus, um Details zu sehen."}
                  </p>

                  {selectedSchein?.keyNote && (
                    <div
                      className={`mt-4 p-3 rounded-lg border ${
                        darkMode
                          ? "bg-slate-700/80 border-slate-600"
                          : "bg-slate-50/80 border-slate-200/60"
                      }`}
                    >
                      <p
                        className={`text-xs font-medium ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Notiz:
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        {selectedSchein.keyNote}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Info Overlay für Bilder */}
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

          {/* Key Information – nur wenn ein Schein ausgewählt ist */}
          {selectedSchein && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div
                className={`rounded-lg p-3 border transition-colors duration-300 ${
                  darkMode
                    ? "bg-slate-700/80 border-slate-600"
                    : "bg-slate-50/80 border-slate-200/60"
                }`}
              >
                <p
                  className={`text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Schlüssel Nr.
                </p>
                <p
                  className={`text-sm font-semibold font-mono mt-1 transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {selectedSchein?.keyNumber || "–"}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 border transition-colors duration-300 ${
                  darkMode
                    ? "bg-slate-700/80 border-slate-600"
                    : "bg-slate-50/80 border-slate-200/60"
                }`}
              >
                <p
                  className={`text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Anzahl
                </p>
                <p
                  className={`text-sm font-semibold mt-1 transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {selectedSchein?.keyCount ?? 2}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  };

  // ---------- WaitingLounge ----------
  if (isIdle) return <WaitingLounge />;

  // ---------- Table-Komponente ----------
  const tableSection = (
    <section
      ref={tableRef}
      className={`overflow-hidden rounded-2xl border shadow-lg transition-colors duration-300 ${cardBg} ${borderColor} ${
        darkMode ? "shadow-slate-900/80" : "shadow-slate-200/60"
      }`}
    >
      {/* Header / Controls */}
      <header
        className={`border-b px-3 py-2 sm:px-4 sm:py-3 transition-colors duration-300 ${
          darkMode
            ? "border-slate-700 bg-slate-700/80"
            : "border-slate-200 bg-slate-50/80"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title + Count + Dark Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3
              className={`text-sm font-semibold tracking-tight transition-colors duration-300 ${textPrimary}`}
            >
              Fahrzeugschlüssel
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors	duration-300 ${
                darkMode
                  ? "bg-blue-900/50 text-blue-200"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {filteredScheins.length}
            </span>
            {showSoldOnly && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors	duration-300 ${
                  darkMode
                    ? "border-amber-700 bg-amber-900/50 text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                Nur verkaufte
              </span>
            )}

            {/* Optional Dark Mode Toggle (wenn du willst, aktivieren) */}
            {/* 
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 rounded-lg transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-600"
              }`}
              title={
                darkMode ? "Zu Hellmodus wechseln" : "Zu Dunkelmodus wechseln"
              }
            >
              {darkMode ? (
                <FiSun className="h-3.5 w-3.5" />
              ) : (
                <FiMoon className="h-3.5 w-3.5" />
              )}
            </button>
            */}
          </div>

          {/* Search / Filter / Reset */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Search */}
            <div className="relative w-52 sm:w-64">
              <FiSearch
                className={`pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors	duration-300 ${
                  darkMode ? "text-slate-400" : "text-slate-400"
                }`}
              />
              <input
                type="text"
                placeholder="Fahrzeug, Schlüssel oder Notiz suchen…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border py-1.5 pl-8 pr-8 text-xs outline-none transition focus:ring-1 sm:text-sm ${inputBg}`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors	duration-300 ${
                    darkMode
                      ? "text-slate-400 hover:text-slate-300"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sold Filter (icon) */}
            <button
              onClick={() => setShowSoldOnly((prev) => !prev)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                showSoldOnly
                  ? darkMode
                    ? "border-sky-500 bg-sky-900/50 text-sky-300"
                    : "border-sky-500 bg-sky-50 text-sky-700"
                  : darkMode
                  ? "border-slate-600 bg-slate-700 text-slate-400 hover:bg-slate-600"
                  : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
              }`}
              title="Nur verkaufte Fahrzeuge anzeigen"
            >
              <FiFilter className="h-4 w-4" />
            </button>

            {/* Reset */}
            {(filterBrand || searchTerm || showSoldOnly) && (
              <button
                onClick={resetFilters}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  darkMode
                    ? "border-slate-600 bg-slate-700 text-slate-400 hover:bg-slate-600"
                    : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                }`}
                title="Alle Filter zurücksetzen"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead
            className={`border-b transition-colors	duration-300 ${
              darkMode
                ? "border-slate-700 bg-slate-700/80"
                : "border-slate-200 bg-slate-100/80"
            }`}
          >
            <tr>
              <th
                className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs transition-colors	duration-300 ${textMuted}`}
              >
                Fahrzeug
              </th>
              <th
                className={`w-24 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs transition-colors	duration-300 ${textMuted}`}
              >
                Schl.Nr.
              </th>
              <th
                className={`w-20 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide sm:px-4 sm:py-3 sm:text-xs transition-colors	duration-300 ${textMuted}`}
              >
                Anzahl
              </th>
              <th
                className={`hidden w-32 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide sm:table-cell sm:px-4 sm:py-3 sm:text-xs transition-colors	duration-300 ${textMuted}`}
              >
                Status
              </th>
            </tr>
          </thead>

          <tbody
            className={`divide-y transition-colors	duration-300 ${
              darkMode
                ? "divide-slate-700 bg-slate-800"
                : "divide-slate-200 bg-white"
            }`}
          >
            {isLoading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-3 sm:px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-6 w-6 rounded-full transition-colors	duration-300 ${
                          darkMode ? "bg-slate-700" : "bg-slate-200"
                        }`}
                      />
                      <div className="space-y-1">
                        <div
                          className={`h-3 w-28 rounded sm:h-4 sm:w-40 transition-colors	duration-300 ${
                            darkMode ? "bg-slate-700" : "bg-slate-200"
                          }`}
                        />
                        <div
                          className={`h-2.5 w-20 rounded sm:w-28 transition-colors	duration-300 ${
                            darkMode ? "bg-slate-700" : "bg-slate-200"
                          }`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center sm:px-4">
                    <div
                      className={`mx-auto h-5 w-14 rounded sm:h-6 sm:w-16 transition-colors	duration-300 ${
                        darkMode ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                  </td>
                  <td className="px-3 py-3 text-center sm:px-4">
                    <div
                      className={`mx-auto h-4 w-8 rounded transition-colors	duration-300 ${
                        darkMode ? "bg-slate-700" : "bg-slate-200"
                      }`}
                    />
                  </td>
                  <td className="hidden px-3 py-3 text-center sm:table-cell sm:px-4">
                    <div
                      className={`mx-auto h-5 w-20 rounded sm:h-6 transition-colors	duration-300 ${
                        darkMode ? "bg-slate-700" : "bg-slate-200"
                      }`}
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
                    setTimeout(() => {
                      if (previewRef.current) {
                        previewRef.current.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 80);
                  }}
                  className={`cursor-pointer transition-all	duration-200 ${
                    selectedSchein?._id === car._id
                      ? darkMode
                        ? "bg-sky-900/30 border-l-4 border-l-sky-500 shadow-sm"
                        : "bg-sky-50 border-l-4 border-l-sky-500 shadow-sm"
                      : `${hoverBg}`
                  }`}
                >
                  {/* Fahrzeug + Note */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {car.keyColor && (
                        <span
                          className="inline-block h-4 w-4 rounded-full border shadow-sm sm:h-5 sm:w-5"
                          style={{ backgroundColor: car.keyColor }}
                          title={`Farbe: ${car.keyColor}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-xs font-semibold sm:text-sm ${
                            car.keySold
                              ? `line-through ${
                                  darkMode ? "text-slate-500" : "text-slate-400"
                                }`
                              : textPrimary
                          }`}
                          title={car.carName}
                        >
                          {car.carName}
                        </div>
                        {car.keyNote && (
                          <div
                            className={`mt-0.5 truncate text-[11px] sm:text-xs transition-colors	duration-300 ${
                              darkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                            title={car.keyNote}
                          >
                            {car.keyNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Schlüsselnummer */}
                  <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                    <span
                      className={`inline-flex min-w-[3.5rem] items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold font-mono sm:min-w-[4rem] sm:px-2.5 sm:py-1.5 sm:text-sm transition-colors	duration-300 ${
                        darkMode
                          ? "border-sky-800 bg-sky-900/50 text-slate-200"
                          : "border-sky-100 bg-sky-50 text-slate-800"
                      }`}
                    >
                      {car.keyNumber || "–"}
                    </span>
                  </td>

                  {/* Anzahl */}
                  <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                    <span
                      className={`text-xs font-semibold sm:text-sm transition-colors	duration-300 ${textPrimary}`}
                    >
                      {car.keyCount ?? 2}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="hidden px-3 py-2.5 text-center sm:table-cell sm:px-4 sm:py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:py-1.5 sm:text-xs transition-colors	duration-300 ${
                        car.keySold
                          ? darkMode
                            ? "border-rose-700 bg-rose-900/50 text-rose-300"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                          : darkMode
                          ? "border-emerald-700 bg-emerald-900/50 text-emerald-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {car.keySold ? "Verkauft" : "Verfügbar"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`mb-3 h-10 w-10 sm:h-12 sm:w-12 transition-colors	duration-300 ${
                        darkMode ? "text-slate-600" : "text-slate-400"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p
                      className={`mb-1 text-sm font-medium transition-colors	duration-300 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Keine Fahrzeuge gefunden
                    </p>
                    <p
                      className={`max-w-xs text-[11px] sm:text-xs transition-colors	duration-300 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {filterBrand || searchTerm || showSoldOnly
                        ? "Passen Sie Ihre Filterkriterien an."
                        : "Es sind noch keine Schlüssel-Daten hinterlegt."}
                    </p>
                  </div>
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
      className={`min-h-screen px-2 py-4 sm:px-3 md:px-4 transition-colors	duration-300 ${bgClass}`}
    >
      <div className="mx-auto mt-4 w-full max-w-[1200px] lg:max-w-[1400px]">
        {/* Marken-Filter oben */}
        <section ref={brandsRef} className="mb-5 sm:mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className={`text-xs font-semibold uppercase tracking-wide transition-colors	duration-300 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Markenfilter
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {carBrands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleFilterBrand(brand.name)}
                className={`flex flex-col items-center rounded-xl border p-2 text-center text-xs font-medium transition-all	duration-150 ${
                  filterBrand === brand.name
                    ? darkMode
                      ? "border-sky-500 bg-sky-900/50 shadow-sm shadow-sky-900/50"
                      : "border-sky-500 bg-sky-50 shadow-sm shadow-sky-100"
                    : darkMode
                    ? "border-slate-600 bg-slate-800 hover:border-slate-500 hover:shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-1.5 flex h-12 w-16 items-center justify-center sm:h-14 sm:w-20">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                </div>
                <span
                  className={`w-full truncate text-[11px] sm:text-xs transition-colors	duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Immer: Tabelle links, Vorschau rechts (auf Mobile untereinander) */}
        <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
          {tableSection}
          <VehiclePreview />
        </div>

        <p
          className={`mt-4 text-center text-[11px] sm:text-xs transition-colors	duration-300 ${
            darkMode ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Automatische Filterrücksetzung nach 60 Sekunden Inaktivität.
        </p>
      </div>
    </div>
  );
}
