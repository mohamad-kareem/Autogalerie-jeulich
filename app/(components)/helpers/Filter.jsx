"use client";
import React from "react";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

const makes = ["Alle", "Mercedes", "BMW", "Audi", "Volkswagen"];
const types = ["Alle", "Limousine", "SUV", "Kombi", "Cabrio"];
const transmissions = ["Alle", "Automatik", "Schaltgetriebe"];
const fuels = ["Alle", "Benzin", "Diesel", "Hybrid", "Elektro"];

const inputClasses =
  "w-full rounded-md border border-gray-200 bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-200 px-2 py-1.5 text-sm placeholder-gray-400";

const labelClasses =
  "block text-xs font-semibold text-gray-700 mb-1 tracking-wide";

const selectClasses =
  "w-full rounded-md border border-gray-200 bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-200 px-2 py-1.5 text-sm";

const sectionClasses = "space-y-3";

const Filter = ({ filters, onChange, onSubmit, onReset }) => {
  // Unified change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (
      ["make", "type", "transmission", "fuel"].includes(name) &&
      value === "Alle"
    ) {
      onChange(name, "");
    } else {
      onChange(name, value);
    }
  };

  return (
    <form
      className="space-y-5 p-2 bg-gray-50 rounded-xl shadow-sm border border-gray-100"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {/* Group 1: Main selectors */}
      <div className={sectionClasses}>
        <div>
          <label className={labelClasses}>Hersteller</label>
          <select
            name="make"
            value={filters.make || "Alle"}
            onChange={handleChange}
            className={selectClasses}
          >
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Modell</label>
          <input
            type="text"
            name="model"
            value={filters.model || ""}
            onChange={handleChange}
            placeholder="Modell"
            className={inputClasses}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={labelClasses}>Typ</label>
          <select
            name="type"
            value={filters.type || "Alle"}
            onChange={handleChange}
            className={selectClasses}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 my-2" />

      {/* Group 2: Specs */}
      <div className={sectionClasses}>
        <div>
          <label className={labelClasses}>Getriebe</label>
          <select
            name="transmission"
            value={filters.transmission || "Alle"}
            onChange={handleChange}
            className={selectClasses}
          >
            {transmissions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Kraftstoff</label>
          <select
            name="fuel"
            value={filters.fuel || "Alle"}
            onChange={handleChange}
            className={selectClasses}
          >
            {fuels.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 my-2" />

      {/* Group 3: Numbers */}
      <div className={sectionClasses}>
        <div>
          <label className={labelClasses}>max. Preis</label>
          <input
            type="number"
            name="maxPrice"
            min="0"
            placeholder="z.B. 20000"
            value={filters.maxPrice || ""}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>max. Kilometer</label>
          <input
            type="number"
            name="maxKilometers"
            min="0"
            placeholder="z.B. 80000"
            value={filters.maxKilometers || ""}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Erstzulassung ab</label>
          <input
            type="number"
            name="minYear"
            min="1970"
            max={new Date().getFullYear()}
            placeholder="1970"
            value={filters.minYear || ""}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Button Row */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-1.5 px-2 rounded-lg bg-black hover:hover:bg-gradient-to-br from-slate-600 to-black active:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1 transition"
        >
          <FiSearch className="w-4 h-4" />
          anzeigen
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:hover:bg-gradient-to-br from-slate-600 to-black/20 text-gray-700 font-medium text-xs shadow-sm flex items-center justify-center gap-1 transition"
        >
          <FiRefreshCw className="w-4 h-4" />
          Zurücksetzen
        </button>
      </div>
    </form>
  );
};

export default Filter;
