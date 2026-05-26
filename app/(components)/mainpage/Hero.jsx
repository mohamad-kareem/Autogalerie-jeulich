"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  CalendarDays,
  Gauge,
  Fuel,
  Settings,
  ArrowRight,
  MapPin,
} from "lucide-react";

export default function Hero() {
  const router = useRouter();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    make: "",
    model: "",
    minYear: "",
    maxMileage: "",
    maxPrice: "",
  });

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars", { cache: "no-store" });
        const data = await res.json();
        setCars(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed loading cars:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCars();
  }, []);

  const makes = useMemo(() => {
    return [...new Set(cars.map((car) => car.make).filter(Boolean))].sort();
  }, [cars]);

  const models = useMemo(() => {
    return [
      ...new Set(
        cars
          .filter((car) => !filters.make || car.make === filters.make)
          .map((car) => car.model)
          .filter(Boolean),
      ),
    ].sort();
  }, [cars, filters.make]);

  const years = useMemo(() => {
    return [
      ...new Set(
        cars
          .map((car) =>
            car.firstRegistration
              ? String(car.firstRegistration).slice(0, 4)
              : null,
          )
          .filter(Boolean),
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [cars]);

  const mileages = ["25000", "50000", "75000", "100000", "150000"];
  const prices = ["5000", "10000", "15000", "20000", "30000", "50000"];

  const resultCount = useMemo(() => {
    return cars.filter((car) => {
      const title = `${car.make || ""} ${car.model || ""} ${
        car.modelDescription || ""
      }`.toLowerCase();

      const price = Number(car.price?.consumerPriceGross || 0);
      const year = car.firstRegistration
        ? Number(String(car.firstRegistration).slice(0, 4))
        : 0;
      const mileage = Number(car.mileage || 0);

      return (
        (!searchTerm || title.includes(searchTerm.toLowerCase())) &&
        (!filters.make || car.make === filters.make) &&
        (!filters.model || car.model === filters.model) &&
        (!filters.minYear || year >= Number(filters.minYear)) &&
        (!filters.maxMileage || mileage <= Number(filters.maxMileage)) &&
        (!filters.maxPrice || price <= Number(filters.maxPrice))
      );
    }).length;
  }, [cars, searchTerm, filters]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "make" ? { model: "" } : {}),
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      make: "",
      model: "",
      minYear: "",
      maxMileage: "",
      maxPrice: "",
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.minYear) params.set("minYear", filters.minYear);
    if (filters.maxMileage) params.set("maxMileage", filters.maxMileage);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    params.set("location", "52428 Jülich");

    const query = params.toString();
    router.push(query ? `/gebrauchtwagen?${query}` : "/gebrauchtwagen");
  };

  return (
    <section className="w-full bg-[#f5f5f2]">
      <div className="mx-auto max-w-[1180px] px-0 pb-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-none border-0 bg-white shadow-xl shadow-black/10 sm:rounded-b-[28px] sm:border sm:border-white/70">
          <div className="relative h-[430px] w-full overflow-hidden sm:h-[520px] lg:h-[610px]">
            <Image
              src="/hyundai3.png"
              alt="Hyundai i20"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5f2ed]/80 via-[#f5f2ed]/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <div className="absolute left-5 top-6 z-10 max-w-[310px] sm:left-8 sm:top-8 lg:left-10 lg:top-10">
              <div className="mb-3 h-[2px] w-12 bg-[#146c2e]" />

              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.32em] text-[#146c2e]">
                Hyundai
              </p>

              <h1 className="text-[34px] font-black leading-[0.95] tracking-[-0.045em] text-[#07111f] sm:text-[42px] lg:text-[50px]">
                Hyundai i20
              </h1>

              <p className="mt-1 text-[26px] font-black tracking-[-0.04em] text-[#146c2e] sm:text-[32px] lg:text-[36px]">
                2017
              </p>

              <p className="mt-3 max-w-[250px] text-[12px] font-semibold leading-5 text-[#263126] sm:text-[13px]">
                Zuverlässig, effizient und ideal für Stadt und Alltag.
              </p>

              <Link
                href="/gebrauchtwagen"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black/60 px-5 py-3 text-xs font-black text-white shadow-lg shadow-green-900/25 transition hover:bg-[#0f5724]"
              >
                Details zum Fahrzeug
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="absolute bottom-4 left-4 right-4 hidden rounded-[16px] border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-xl sm:block sm:left-6 sm:right-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:divide-x md:divide-white/10">
                <InfoItem
                  icon={<CalendarDays />}
                  label="Erstzulassung"
                  value="2017"
                />

                <InfoItem
                  icon={<Gauge />}
                  label="Kilometerstand"
                  value="73.500 km"
                />

                <InfoItem icon={<Fuel />} label="Kraftstoff" value="Benzin" />

                <InfoItem
                  icon={<Settings />}
                  label="Getriebe"
                  value="Schaltgetriebe"
                />

                <div className="flex items-center md:justify-end md:pl-3">
                  <div>
                    <p className="text-[22px] font-black leading-none text-[#17b14b]">
                      8.990 €
                    </p>

                    <p className="mt-1 text-[11px] font-bold text-white/80">
                      inkl. MwSt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white px-4 py-5 sm:px-5 lg:px-6">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#146c2e]">
                {loading ? "Fahrzeuge werden geladen..." : ""}
              </p>

              <h2 className="mt-1 text-lg font-black text-[#101510]">
                Passendes Fahrzeug finden
              </h2>
            </div>

            <div className="flex h-[46px] items-center rounded-2xl border border-black/10 bg-[#fafaf8] px-4">
              <Search className="h-4 w-4 text-[#146c2e]" />

              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Marke, Modell oder Stichwort"
                className="h-full w-full bg-transparent px-3 text-sm font-semibold text-[#101510] outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="mt-4 grid items-end gap-3 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_170px]">
              <SelectBox
                label="Marke"
                value={filters.make}
                onChange={(v) => updateFilter("make", v)}
                options={makes}
                placeholder="Alle Marken"
              />

              <SelectBox
                label="Modell"
                value={filters.model}
                onChange={(v) => updateFilter("model", v)}
                options={models}
                placeholder="Alle Modelle"
                disabled={!filters.make}
              />

              <SelectBox
                label="Erstzulassung"
                value={filters.minYear}
                onChange={(v) => updateFilter("minYear", v)}
                options={years}
                placeholder="Beliebig"
              />

              <SelectBox
                label="Kilometerstand bis"
                value={filters.maxMileage}
                onChange={(v) => updateFilter("maxMileage", v)}
                options={mileages}
                placeholder="Beliebig"
                format={(v) => `${Number(v).toLocaleString("de-DE")} km`}
              />

              <SelectBox
                label="Preis bis"
                value={filters.maxPrice}
                onChange={(v) => updateFilter("maxPrice", v)}
                options={prices}
                placeholder="Beliebig"
                format={(v) =>
                  Number(v).toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })
                }
              />

              <button
                onClick={handleSearch}
                className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#146c2e] px-4 text-white shadow-lg shadow-green-900/20 transition hover:bg-[#0f5724]"
              >
                <span className="text-lg font-black leading-none">
                  {resultCount}
                </span>
                <span className="text-xs font-black">Angebote</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex h-[46px] min-w-[230px] flex-1 items-center rounded-2xl border border-black/10 bg-[#fafaf8] px-4">
                <MapPin className="h-4 w-4 text-[#146c2e]" />

                <span className="px-3 text-xs font-bold text-[#101510]">
                  Alte Dürenerstraße 4, Jülich
                </span>
              </div>

              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-[#101510]"
              >
                <RotateCcw className="h-4 w-4" />
                Filter zurücksetzen
              </button>

              <Link
                href="/gebrauchtwagen"
                className="hidden  items-center gap-2 text-xs font-black text-[#146c2e] transition hover:text-[#101510] sm:inline-flex"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Weitere Filter anzeigen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 md:px-3 first:md:pl-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
        <span className="[&>svg]:h-[15px] [&>svg]:w-[15px]">{icon}</span>
      </div>

      <div>
        <p className="text-[9px] font-semibold leading-none text-white/65">
          {label}
        </p>

        <p className="mt-1 text-[12px] font-black leading-none text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  format,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black text-[#101510]">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-[48px] w-full cursor-pointer appearance-none rounded-2xl border border-black/10 bg-[#fafaf8] px-3 pr-8 text-xs font-bold text-[#101510] outline-none transition hover:border-[#146c2e] focus:border-[#146c2e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option} value={option}>
              {format ? format(option) : option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </label>
  );
}
