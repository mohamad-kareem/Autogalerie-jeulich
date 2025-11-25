"use client";

import { useMemo } from "react";
import {
  Search,
  Filter,
  CarFront,
  Fuel,
  HardDrive,
  Calendar,
  BadgePercent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const fuelMap = {
  PETROL: "Benzin",
  DIESEL: "Diesel",
  petrol: "Benzin",
  diesel: "Diesel",
};

const gearboxMap = {
  MANUAL_GEAR: "Schaltgetriebe",
  AUTOMATIC_GEAR: "Automatik",
  SEMI_AUTOMATIC_GEAR: "Halbautomatik",
  NO_GEARS: "Ohne Getriebe",
};

export default function SearchAndFilter({
  cars = [],
  loading,
  syncing, // kept for compatibility
  syncCars, // kept for compatibility
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
}) {
  const filterOptions = useMemo(() => {
    const makes = new Set();
    const fuelTypes = new Map();
    const transmissions = new Map();
    let maxPrice = 0;

    cars.forEach((car) => {
      if (car.make) makes.add(car.make);

      if (car.fuel) {
        fuelTypes.set(car.fuel, fuelMap[car.fuel] || car.fuel);
      }

      if (car.gearbox) {
        const key = car.gearbox.toUpperCase().replace(/ /g, "_");
        transmissions.set(car.gearbox, gearboxMap[key] || car.gearbox);
      }

      if (car.price?.consumerPriceGross > maxPrice) {
        maxPrice = car.price.consumerPriceGross;
      }
    });

    return {
      makes: Array.from(makes)
        .sort()
        .map((make) => ({ value: make, label: make })),
      fuelTypes: Array.from(fuelTypes.entries()).map(([value, label]) => ({
        value,
        label,
      })),
      transmissions: Array.from(transmissions.entries()).map(
        ([value, label]) => ({ value, label })
      ),
      maxPrice: Math.ceil(maxPrice / 10000) * 10000 || 100000,
    };
  }, [cars]);

  const handleReset = () => {
    setFilters({
      make: "",
      fuelType: "",
      transmission: "",
      minPrice: 0,
      maxPrice: filterOptions.maxPrice,
      minYear: 1990,
      maxYear: new Date().getFullYear(),
    });
  };

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {/* TOP BAR: search + filter side by side (mobile-first) */}
      <div className="flex w-full items-center justify-between gap-2 sm:gap-3">
        {/* Search input */}
        <div className="relative min-w-0 flex-1 md:flex-none md:w-full md:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Marke, Modell oder Stichwort suchen..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/90 pl-7 pr-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:py-2 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Filter toggle button */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-1.5 text-[11px] font-medium text-slate-100 shadow-sm transition-colors hover:border-sky-500 hover:text-sky-100 sm:px-3 sm:py-2 sm:text-xs"
        >
          <Filter className="h-3.5 w-3.5" />
          {/* Text only on desktop */}
          <span className="hidden md:inline">
            {showFilters ? "Filter zu" : "Filter"}
          </span>
          {showFilters ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ADVANCED FILTERS */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-3 shadow-sm shadow-black/40 sm:p-4">
          {/* Header */}
          <div className="mb-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-[11px]">
                Erweiterte Filter
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-medium text-slate-300 hover:text-sky-300 sm:text-xs"
            >
              Filter zurücksetzen
            </button>
          </div>

          {/* GRID CONTENT */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
            {/* Left: dropdowns */}
            <div className="grid grid-cols-1 gap-3 md:col-span-3 md:grid-cols-3">
              {/* Marke */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-300 sm:text-xs">
                  <CarFront className="h-3.5 w-3.5" />
                  Marke
                </label>
                <div className="relative">
                  <select
                    value={filters.make}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, make: e.target.value }))
                    }
                    className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 pr-7 text-[11px] text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
                  >
                    <option value="">Alle Marken</option>
                    {filterOptions.makes.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-500 sm:right-2.5" />
                </div>
              </div>

              {/* Kraftstoff */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-300 sm:text-xs">
                  <Fuel className="h-3.5 w-3.5" />
                  Kraftstoff
                </label>
                <div className="relative">
                  <select
                    value={filters.fuelType}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        fuelType: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 pr-7 text-[11px] text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
                  >
                    <option value="">Alle Kraftstoffe</option>
                    {filterOptions.fuelTypes.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-500 sm:right-2.5" />
                </div>
              </div>

              {/* Getriebe */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-300 sm:text-xs">
                  <HardDrive className="h-3.5 w-3.5" />
                  Getriebe
                </label>
                <div className="relative">
                  <select
                    value={filters.transmission}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        transmission: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 pr-7 text-[11px] text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
                  >
                    <option value="">Alle Getriebe</option>
                    {filterOptions.transmissions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-500 sm:right-2.5" />
                </div>
              </div>
            </div>

            {/* Right: price + year */}
            <div className="grid grid-cols-1 gap-3 md:col-span-2">
              {/* Preisbereich */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-300 sm:text-xs">
                  <BadgePercent className="h-3.5 w-3.5" />
                  Preisbereich (Brutto)
                </label>
                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice:
                          parseInt(e.target.value) || filterOptions.maxPrice,
                      }))
                    }
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">
                  Max: {filterOptions.maxPrice.toLocaleString("de-DE")} €
                </p>
              </div>

              {/* Erstzulassung */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-300 sm:text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  Erstzulassung (Jahr)
                </label>
                <div className="flex gap-1.5 sm:gap-2">
                  <input
                    type="number"
                    placeholder="Von"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={filters.minYear}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minYear: parseInt(e.target.value) || 1990,
                      }))
                    }
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Bis"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={filters.maxYear}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxYear:
                          parseInt(e.target.value) || new Date().getFullYear(),
                      }))
                    }
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:px-3 sm:py-2 sm:text-sm"
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
