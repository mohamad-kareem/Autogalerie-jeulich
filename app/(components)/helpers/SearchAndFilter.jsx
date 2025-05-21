"use client";

import { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Filter,
  Car,
  Search,
  Calendar,
  Gauge,
  Fuel,
  Milestone,
  Settings,
  ChevronDown,
  ChevronRight,
  List,
  Grid,
  Star,
  Heart,
  CarFront,
  HardDrive,
  Users,
  BadgePercent,
} from "lucide-react";
import Link from "next/link";
import Button from "@/app/(components)/helpers/Button";

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
  viewMode,
  setViewMode,
  favorites,
  toggleFavorite,
}) {
  // Get unique filter options from cars data
  const filterOptions = useMemo(() => {
    const makes = new Set();
    const fuelTypes = new Set();
    const transmissions = new Set();
    let maxPrice = 0;

    cars.forEach((car) => {
      if (car.make) makes.add(car.make);
      if (car.fuel) fuelTypes.add(car.fuel);
      if (car.gearbox) transmissions.add(car.gearbox);
      if (car.price?.consumerPriceGross > maxPrice) {
        maxPrice = car.price.consumerPriceGross;
      }
    });

    return {
      makes: Array.from(makes).sort(),
      fuelTypes: Array.from(fuelTypes).sort(),
      transmissions: Array.from(transmissions).sort(),
      maxPrice: Math.ceil(maxPrice / 10000) * 10000 || 100000,
    };
  }, [cars]);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-6">
        {/* Search Component */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Marke, Modell oder Schlüsselwörter..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "secondary"}
            className="flex items-center gap-2"
          >
            <Filter className="h-5 w-5" />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-red-600" />
              Erweiterte Filter
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Schließen
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Make Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <CarFront className="h-4 w-4" />
                Marke
              </label>
              <div className="relative">
                <select
                  value={filters.make}
                  onChange={(e) =>
                    setFilters({ ...filters, make: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                >
                  <option value="">Alle Marken</option>
                  {filterOptions.makes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Fuel Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                Kraftstoffart
              </label>
              <div className="relative">
                <select
                  value={filters.fuelType}
                  onChange={(e) =>
                    setFilters({ ...filters, fuelType: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                >
                  <option value="">Alle Kraftstoffe</option>
                  {filterOptions.fuelTypes.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Transmission Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <HardDrive className="h-4 w-4" />
                Getriebe
              </label>
              <div className="relative">
                <select
                  value={filters.transmission}
                  onChange={(e) =>
                    setFilters({ ...filters, transmission: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 appearance-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                >
                  <option value="">Alle Getriebe</option>
                  {filterOptions.transmissions.map((trans) => (
                    <option key={trans} value={trans}>
                      {trans}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <BadgePercent className="h-4 w-4" />
                Preisbereich (€)
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                  />
                </div>
                <div className="relative flex-1">
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Erstzulassung
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                  />
                </div>
                <div className="relative flex-1">
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() => {
                setFilters({
                  make: "",
                  fuelType: "",
                  minPrice: 0,
                  maxPrice: filterOptions.maxPrice,
                  minYear: 1990,
                  maxYear: new Date().getFullYear(),
                  transmission: "",
                });
              }}
              variant="secondary"
              className="px-4 py-2.5"
            >
              Filter zurücksetzen
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
