"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FiSearch, FiX, FiFilter } from "react-icons/fi";
import toast from "react-hot-toast";

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
  const [cars, setCars] = useState([]);
  const [filterBrand, setFilterBrand] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSoldOnly, setShowSoldOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tableRef = useRef(null);
  const brandsRef = useRef(null);

  // Load all Scheine (keys) from /api/carschein
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/carschein?limit=500");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Fehler beim Laden der Scheine");
        }

        setCars(Array.isArray(data.docs) ? data.docs : []);
      } catch (error) {
        console.error("Fehler beim Laden der Autos:", error);
        toast.error("Fehler beim Laden der Schlüssel-Liste");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, []);

  // Brand filter auto reset after 60s
  useEffect(() => {
    if (!filterBrand) return;

    const timeout = setTimeout(() => {
      setFilterBrand("");
    }, 60000);

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

  const handleFilter = (brand) => {
    setFilterBrand(brand);
    setSearchTerm("");
    scrollToTable();
  };

  const resetFilters = () => {
    setFilterBrand("");
    setSearchTerm("");
    setShowSoldOnly(false);

    if (brandsRef.current) {
      brandsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Filter logic
  const filteredCars = cars.filter((car) => {
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
  });

  return (
    <div className="min-h-screen bg-slate-50 px-2 py-4 sm:px-3 md:px-4">
      <div className="mx-auto mt-4 w-full max-w-[1200px] lg:max-w-[1400px]">
        {/* Brand Logos Section */}
        <section ref={brandsRef} className="mb-5 sm:mb-6">
          <div className="mb-3 ">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700 sm:text-sm">
              Markenfilter
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {carBrands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleFilter(brand.name)}
                className={`flex flex-col items-center rounded-lg p-2 text-center text-xs font-medium transition-all duration-200 ${
                  filterBrand === brand.name
                    ? "border-2 border-blue-500 bg-blue-50 shadow-sm"
                    : "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
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
                <span className="w-full truncate text-[11px] text-slate-700 sm:text-xs">
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Table Card */}
        <section
          ref={tableRef}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <header className="border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-2.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Title & count */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3">
                <h3 className="text-sm font-semibold text-slate-800">
                  Fahrzeugschlüssel :
                </h3>

                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {filteredCars.length}
                </span>

                {showSoldOnly && (
                  <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                    Nur verkaufte
                  </span>
                )}
              </div>

              {/* Right: compact search + tiny filter + tiny reset */}
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {/* Search input */}
                <div className="relative w-50 ">
                  <FiSearch className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1 pl-8 pr-8 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Super compact "Nur verkauft" filter: icon only */}
                <button
                  onClick={() => setShowSoldOnly((prev) => !prev)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors ${
                    showSoldOnly
                      ? "border-blue-500 bg-blue-100 text-blue-700"
                      : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                  title="Nur verkaufte Fahrzeuge anzeigen"
                >
                  <FiFilter className="h-4 w-4" />
                </button>

                {/* Tiny reset button for brand/search if needed */}
                {(filterBrand || searchTerm) && (
                  <button
                    onClick={resetFilters}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 transition-colors hover:bg-slate-50"
                    title="Filter löschen"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                    Fahrzeug
                  </th>
                  <th className="w-24 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                    Schl.Nr.
                  </th>
                  <th className="w-20 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                    Anzahl
                  </th>
                  <th className="hidden sm:table-cell w-28 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-slate-200" />
                          <div className="space-y-1">
                            <div className="h-3 w-28 rounded bg-slate-200 sm:h-4 sm:w-32" />
                            <div className="h-2.5 w-20 rounded bg-slate-200 sm:w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center sm:px-4">
                        <div className="mx-auto h-5 w-14 rounded bg-slate-200 sm:h-6 sm:w-16" />
                      </td>
                      <td className="px-3 py-3 text-center sm:px-4">
                        <div className="mx-auto h-4 w-8 rounded bg-slate-200" />
                      </td>
                      <td className="px-3 py-3 text-center sm:px-4">
                        <div className="mx-auto h-5 w-20 rounded bg-slate-200 sm:h-6" />
                      </td>
                    </tr>
                  ))
                ) : filteredCars.length > 0 ? (
                  filteredCars.map((car) => (
                    <tr
                      key={car._id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {car.keyColor && (
                            <span
                              className="inline-block h-4 w-4 rounded-full border border-slate-300 shadow-sm sm:h-5 sm:w-5"
                              style={{ backgroundColor: car.keyColor }}
                              title={`Farbe: ${car.keyColor}`}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className={`truncate text-xs font-semibold sm:text-sm ${
                                car.keySold
                                  ? "line-through text-slate-400"
                                  : "text-slate-900"
                              }`}
                              title={car.carName}
                            >
                              {car.carName}
                            </div>
                            {car.keyNote && (
                              <div
                                className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs"
                                title={car.keyNote}
                              >
                                {car.keyNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                        <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-semibold text-slate-700 font-mono sm:min-w-[4rem] sm:px-2.5 sm:py-1.5 sm:text-sm">
                          {car.keyNumber || "–"}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                        <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                          {car.keyCount ?? 2}
                        </span>
                      </td>

                      <td className="hidden sm:table-cell px-3 py-2.5 text-center sm:px-4 sm:py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:py-1.5 sm:text-xs ${
                            car.keySold
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-green-200 bg-green-50 text-green-700"
                          }`}
                        >
                          {car.keySold ? "Verkauft" : "Verfügbar"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mb-3 h-10 w-10 sm:h-12 sm:w-12"
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
                        <p className="mb-1 text-sm font-medium text-slate-500">
                          Keine Fahrzeuge gefunden
                        </p>
                        <p className="max-w-xs text-[11px] text-slate-400 sm:text-xs">
                          {filterBrand || searchTerm || showSoldOnly
                            ? "Versuchen Sie, Ihre Filterkriterien zu ändern."
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

        <p className="mt-4 text-center text-[11px] text-slate-400 sm:text-xs">
          Automatische Filterrücksetzung nach 60 Sekunden Inaktivität
        </p>
      </div>
    </div>
  );
}
