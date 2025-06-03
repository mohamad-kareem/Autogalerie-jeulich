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
  Settings,
} from "lucide-react";
import Button from "@/app/(components)/helpers/Button";
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
  syncing,
  syncCars,
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
        .map((make) => ({
          value: make,
          label: make,
        })),
      fuelTypes: Array.from(fuelTypes.entries()).map(([value, label]) => ({
        value,
        label,
      })),
      transmissions: Array.from(transmissions.entries()).map(
        ([value, label]) => ({
          value,
          label,
        })
      ),
      maxPrice: Math.ceil(maxPrice / 10000) * 10000 || 100000,
    };
  }, [cars]);

  return (
    <div className="w-full">
      {/* Top Search and Button */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 w-full">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Marke, Modell oder Schlüsselwörter..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-500 placeholder-gray-500  shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto flex items-center justify-end">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "secondary"}
            className="w-full md:w-auto flex items-center justify-center gap-2"
          >
            <Filter className="h-5 w-5" />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gradient-to-br from-black/20 to-[#140000] p-6 rounded-xl border border-gray-100 mb-6 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-red-600" />
              Erweiterte Filter
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-sm text-white hover:text-gray-300"
            >
              Schließen
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {/* Reusable Select Field */}
            {[
              {
                label: "Marke",
                icon: <CarFront className="h-4 w-4" />,
                value: filters.make,
                options: filterOptions.makes,
                onChange: (val) => setFilters({ ...filters, make: val }),
              },
              {
                label: "Kraftstoffart",
                icon: <Fuel className="h-4 w-4" />,
                value: filters.fuelType,
                options: filterOptions.fuelTypes,
                onChange: (val) => setFilters({ ...filters, fuelType: val }),
              },
              {
                label: "Getriebe",
                icon: <HardDrive className="h-4 w-4" />,
                value: filters.transmission,
                options: filterOptions.transmissions,
                onChange: (val) =>
                  setFilters({ ...filters, transmission: val }),
              },
            ].map(({ label, icon, value, options, onChange }, index) => (
              <div key={index}>
                <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  {icon}
                  {label}
                </label>
                <div className="relative">
                  <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full text-gray-500  border border-gray-200 rounded-lg px-3 py-2.5 pr-8 appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                  >
                    <option value="">Alle {label}</option>
                    {options.map(({ value: optVal, label: optLabel }) => (
                      <option key={optVal} value={optVal}>
                        {optLabel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ))}

            {/* Price */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                <BadgePercent className="h-4 w-4" />
                Preisbereich (€)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minPrice: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-1/2 text-gray-500 placeholder-gray-500  border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxPrice:
                        parseInt(e.target.value) || filterOptions.maxPrice,
                    })
                  }
                  className="w-1/2 text-gray-500 placeholder-gray-500  border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Erstzulassung
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Von"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={filters.minYear}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minYear: parseInt(e.target.value) || 1990,
                    })
                  }
                  className="w-1/2 text-gray-500 placeholder-gray-500  border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                />
                <input
                  type="number"
                  placeholder="Bis"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={filters.maxYear}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxYear:
                        parseInt(e.target.value) || new Date().getFullYear(),
                    })
                  }
                  className="w-1/2 text-gray-500 placeholder-gray-500  border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  make: "",
                  fuelType: "",
                  transmission: "",
                  minPrice: 0,
                  maxPrice: filterOptions.maxPrice,
                  minYear: 1990,
                  maxYear: new Date().getFullYear(),
                })
              }
              className="px-4 py-2.5 text-sm  text-gray-200 rounded-lg hover:bg-gradient-to-br from-red-600 to-black transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
