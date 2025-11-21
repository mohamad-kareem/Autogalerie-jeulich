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
  cars,
  loading,
  syncing, // kept for compatibility, not used here
  syncCars, // kept for compatibility, not used here
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
    <div className="w-full space-y-3">
      {/* TOP BAR: search + small filter toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative w-full md:max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Marke, Modell oder Stichwort suchen..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Right side: quick info + toggle button */}
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
          {/* Small summary text */}
          <div className="text-[11px] text-slate-400 md:text-xs">
            Aktive Filter:&nbsp;
            <span className="text-slate-200">
              {filters.make ? "Marke" : ""}
              {filters.fuelType
                ? filters.make
                  ? ", Kraftstoff"
                  : "Kraftstoff"
                : ""}
              {filters.transmission
                ? filters.make || filters.fuelType
                  ? ", Getriebe"
                  : "Getriebe"
                : ""}
              {!filters.make && !filters.fuelType && !filters.transmission
                ? "keine"
                : ""}
            </span>
          </div>

          {/* Toggle button */}
          <div className="flex justify-end md:justify-start">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 px-3 text-xs font-medium text-slate-100 shadow-sm transition-colors hover:border-sky-500 hover:text-sky-100"
            >
              <Filter className="h-4 w-4" />
              <span>Filter {showFilters ? "schließen" : "öffnen"}</span>
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ADVANCED FILTERS */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-sm shadow-black/40">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Erweiterte Filter
              </p>
              <p className="text-xs text-slate-500">
                Verfeinern Sie Ihre Suche nach Antrieb, Preis und Baujahr.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-slate-300 hover:text-sky-300"
            >
              Filter zurücksetzen
            </button>
          </div>

          {/* GRID CONTENT */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {/* Left: dropdowns */}
            <div className="grid grid-cols-1 gap-4 md:col-span-3 md:grid-cols-3">
              {/* Marke */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
                  <CarFront className="h-3.5 w-3.5" />
                  Marke
                </label>
                <div className="relative">
                  <select
                    value={filters.make}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, make: e.target.value }))
                    }
                    className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Alle Marken</option>
                    {filterOptions.makes.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>

              {/* Kraftstoff */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
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
                    className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Alle Kraftstoffe</option>
                    {filterOptions.fuelTypes.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>

              {/* Getriebe */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
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
                    className="w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-8 text-sm text-slate-100 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Alle Getriebe</option>
                    {filterOptions.transmissions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Right: price + year */}
            <div className="grid grid-cols-1 gap-4 md:col-span-2">
              {/* Preisbereich */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
                  <BadgePercent className="h-3.5 w-3.5" />
                  Preisbereich (Brutto)
                </label>
                <div className="flex gap-2">
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
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Max: {filterOptions.maxPrice.toLocaleString("de-DE")} €
                </p>
              </div>

              {/* Erstzulassung */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-300">
                  <Calendar className="h-3.5 w-3.5" />
                  Erstzulassung (Jahr)
                </label>
                <div className="flex gap-2">
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
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                    className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
