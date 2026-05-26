"use client";

import { useMemo } from "react";
import {
  Search,
  CarFront,
  Fuel,
  HardDrive,
  Calendar,
  BadgePercent,
  RotateCcw,
  SlidersHorizontal,
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
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
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
        }),
      ),

      maxPrice: Math.ceil(maxPrice / 10000) * 10000 || 100000,
    };
  }, [cars]);

  const handleReset = () => {
    setSearchTerm("");

    setFilters({
      make: "",
      model: "",
      fuelType: "",
      transmission: "",
      minPrice: 0,
      maxPrice: filterOptions.maxPrice,
      minYear: 1990,
      maxYear: new Date().getFullYear(),
      maxMileage: "",
    });
  };

  return (
    <aside className="sticky top-[96px] w-full rounded-[24px] border border-white/80 bg-white p-4 shadow-lg shadow-black/5 lg:w-[270px] lg:shrink-0">
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#07111f]">
            Filter
          </h2>
        </div>
      </div>

      <div className="space-y-5">
        {/* SEARCH */}
        <div>
          <FilterLabel label="Suchen" />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#146c2e]" />

            <input
              type="text"
              placeholder="Marke oder Modell..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className="h-11 w-full rounded-2xl border border-black/10 bg-[#fafaf8] pl-9 pr-3 text-sm font-medium text-[#101510] outline-none transition placeholder:text-[#9aa39a] hover:border-[#146c2e]/40 focus:border-[#146c2e]"
            />
          </div>
        </div>

        {/* MARKE */}
        <FilterSelect
          label="Marke"
          value={filters.make}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              make: value,
              model: "",
            }))
          }
          options={filterOptions.makes}
          placeholder="Alle Marken"
        />

        {/* KRAFTSTOFF */}
        <FilterButtonGroup
          icon={<Fuel />}
          label="Kraftstoff"
          value={filters.fuelType}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              fuelType: value,
            }))
          }
          options={filterOptions.fuelTypes}
        />

        {/* GETRIEBE */}
        <FilterButtonGroup
          icon={<HardDrive />}
          label="Getriebe"
          value={filters.transmission}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              transmission: value,
            }))
          }
          options={filterOptions.transmissions}
        />

        {/* PREIS */}
        <div>
          <FilterLabel icon={<BadgePercent />} label="Preisbereich" />

          <div className="grid grid-cols-2 gap-2">
            <InputBox
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  minPrice: parseInt(value) || 0,
                }))
              }
            />

            <InputBox
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  maxPrice: parseInt(value) || filterOptions.maxPrice,
                }))
              }
            />
          </div>

          <p className="mt-1.5 text-[11px] font-normal text-[#7b857b]">
            Max: {filterOptions.maxPrice.toLocaleString("de-DE")} €
          </p>
        </div>

        {/* ERSTZULASSUNG */}
        <div>
          <FilterLabel icon={<Calendar />} label="Erstzulassung" />

          <div className="grid grid-cols-2 gap-2">
            <InputBox
              type="number"
              placeholder="Von"
              min="1990"
              max={new Date().getFullYear()}
              value={filters.minYear}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  minYear: parseInt(value) || 1990,
                }))
              }
            />

            <InputBox
              type="number"
              placeholder="Bis"
              min="1990"
              max={new Date().getFullYear()}
              value={filters.maxYear}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  maxYear: parseInt(value) || new Date().getFullYear(),
                }))
              }
            />
          </div>
        </div>

        {/* RESET */}
        <button
          type="button"
          onClick={handleReset}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[#146c2e]/20 bg-[#e6f1e9] text-[13px] font-medium text-[#146c2e] transition hover:bg-[#dceee0]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Filter zurücksetzen
        </button>
      </div>
    </aside>
  );
}

function FilterLabel({ icon, label }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#202820]">
      {icon && (
        <span className="text-[#146c2e] [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </span>
      )}

      {label}
    </label>
  );
}

function FilterSelect({ icon, label, value, onChange, options, placeholder }) {
  return (
    <div>
      <FilterLabel icon={icon} label={label} />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full cursor-pointer rounded-2xl border border-black/10 bg-[#fafaf8] px-3 text-sm font-medium text-[#202820] outline-none transition hover:border-[#146c2e]/40 focus:border-[#146c2e]"
      >
        <option value="">{placeholder}</option>

        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterButtonGroup({ icon, label, value, onChange, options }) {
  return (
    <div>
      <FilterLabel icon={icon} label={label} />

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(active ? "" : option.value)}
              className={`h-9 rounded-xl border px-3 text-[12px] font-medium transition ${
                active
                  ? "border-[#146c2e] bg-[#146c2e] text-white shadow-sm"
                  : "border-black/10 bg-[#fafaf8] text-[#5f695f] hover:border-[#146c2e]/40 hover:bg-[#f1f6f2] hover:text-[#146c2e]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InputBox({ value, onChange, ...props }) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-2xl border border-black/10 bg-[#fafaf8] px-3 text-sm font-medium text-[#202820] outline-none transition placeholder:text-[#9aa39a] hover:border-[#146c2e]/40 focus:border-[#146c2e]"
    />
  );
}
