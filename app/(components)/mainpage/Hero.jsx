"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import back from "@/app/(assets)/back2.png";
import {
  Search,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  BadgeEuro,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const fullText = "Premium-Fahrzeuge.";

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    minYear: "",
    maxMileage: "",
    maxPrice: "",
    location: "",
  });

  useEffect(() => {
    const currentText = isDeleting
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    const timer = setTimeout(() => {
      setText(currentText);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
        setTypingSpeed(100);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setTypingSpeed(150);
      } else {
        setTypingSpeed(isDeleting ? 50 : 150);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, typingSpeed]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await fetch("/api/cars", { cache: "no-store" });
        const data = await res.json();
        setCars(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load cars:", error);
      } finally {
        setLoading(false);
      }
    };

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

  const mileages = ["25000", "50000", "75000", "90000", "100000", "150000"];
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
      location: "",
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
    if (filters.location) params.set("location", filters.location);

    router.push(`/gebrauchtwagen?${params.toString()}`);
  };

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 text-white">
      {/* Desktop Background */}
      <div className="absolute inset-0 hidden sm:block">
        <Image
          src={back}
          alt="Sportwagen auf einer Straße bei Sonnenuntergang"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-slate-950/10" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 xl:px-8">
        <div className="grid min-h-[calc(100vh-112px)] w-full items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] xl:gap-12">
          {/* Left Content */}
          <div className="max-w-2xl space-y-6 text-center sm:text-left">
            <div className="hidden sm:inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-200">
                Autogalerie&nbsp;– Jülich
              </span>
            </div>

            <h1 className="font-playfair text-3xl leading-tight sm:text-4xl md:text-5xl xl:text-6xl">
              <span className="inline-block min-h-[1em]">
                {text}
                <span className="animate-pulse">|</span>
              </span>

              <span className="mt-2 block text-[12px] uppercase tracking-[0.35em] text-blue-200 sm:text-xs md:text-sm">
                Klar. Direkt.
              </span>
            </h1>

            <p className="hidden max-w-xl text-sm leading-relaxed text-slate-200 sm:block md:text-base">
              Auswahl, Qualität und Service auf Konzernniveau – an einem
              Standort.
            </p>

            <div className="flex flex-nowrap items-center justify-center gap-3 sm:justify-start">
              <Link
                href="/gebrauchtwagen"
                className="inline-flex w-1/2 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-md transition hover:bg-slate-200 sm:w-auto"
              >
                Fahrzeuge ansehen
              </Link>

              <Link
                href="/kontakt"
                className="inline-flex w-1/2 items-center justify-center rounded-full border border-white/60 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-blue-400 hover:text-blue-200 sm:w-auto"
              >
                Beratung vereinbaren
              </Link>
            </div>

            {/* Mobile Image */}
            <div className="sm:hidden">
              <div className="relative h-[34vh] min-h-[230px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-2xl shadow-black/40">
                <Image
                  src={back}
                  alt="Sportwagen auf einer Straße bei Sonnenuntergang"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/25" />
              </div>
            </div>

            <p className="mx-auto max-w-xl text-center text-sm text-slate-200 sm:hidden">
              Auswahl, Qualität und Service auf Konzernniveau
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-200 sm:justify-start sm:text-xs md:text-sm">
              <Benefit icon={<ShieldCheck />} text="Geprüfte Fahrzeuge" />
              <Benefit icon={<BadgeEuro />} text="Transparente Konditionen" />
            </div>
          </div>

          {/* Filter Box */}
          <div className="w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5 lg:ml-auto">
            <h2 className="mb-4 text-center text-sm font-semibold text-slate-100 sm:text-base">
              {loading ? "Fahrzeuge werden geladen..." : "Fahrzeug suchen"}
            </h2>

            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-2">
              <Search className="ml-2 h-4 w-4 text-blue-300" />

              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Marke, Modell oder Stichwort"
                className="h-8 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-400"
              />

              <button
                onClick={handleSearch}
                className="h-8 rounded-full bg-white px-4 text-xs font-semibold text-black transition hover:bg-slate-200"
              >
                Suchen
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SelectBox
                label="Marke"
                value={filters.make}
                onChange={(value) => updateFilter("make", value)}
                options={makes}
                placeholder="Alle Marken"
              />

              <SelectBox
                label="Modell"
                value={filters.model}
                onChange={(value) => updateFilter("model", value)}
                options={models}
                placeholder="Alle Modelle"
                disabled={!filters.make}
              />

              <SelectBox
                label="Erstzulassung ab"
                value={filters.minYear}
                onChange={(value) => updateFilter("minYear", value)}
                options={years}
                placeholder="Beliebig"
              />

              <SelectBox
                label="Kilometer bis"
                value={filters.maxMileage}
                onChange={(value) => updateFilter("maxMileage", value)}
                options={mileages}
                placeholder="Beliebig"
                format={(value) =>
                  `${Number(value).toLocaleString("de-DE")} km`
                }
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SelectBox
                label="Preis bis"
                value={filters.maxPrice}
                onChange={(value) => updateFilter("maxPrice", value)}
                options={prices}
                placeholder="Beliebig"
                format={(value) =>
                  Number(value).toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })
                }
              />

              <div className="lg:col-span-2">
                <span className="mb-1 block text-[11px] font-medium text-slate-300">
                  Ort oder PLZ
                </span>

                <input
                  value={filters.location}
                  onChange={(e) => updateFilter("location", e.target.value)}
                  placeholder="52428, Jülich"
                  className="h-9 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-[12px] font-semibold text-white outline-none transition placeholder:text-slate-400 hover:border-blue-300/70 focus:border-blue-300"
                />
              </div>

              <button
                onClick={handleSearch}
                className="mt-[18px] flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-4 text-[12px] font-bold text-black transition hover:bg-slate-200"
              >
                <Search className="h-4 w-4" />
                {resultCount} Angebote
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] font-semibold text-slate-300">
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 transition hover:text-blue-200"
              >
                <RotateCcw className="h-4 w-4" />
                Zurücksetzen
              </button>

              <Link
                href="/gebrauchtwagen"
                className="inline-flex items-center gap-2 transition hover:text-blue-200"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Weitere Filter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Beliebig",
  format,
  disabled = false,
}) {
  return (
    <label className="text-left">
      <span className="mb-1 block text-[11px] font-medium text-slate-300">
        {label}
      </span>

      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-white/15 bg-white/10 px-3 pr-9 text-[12px] font-semibold text-white outline-none transition hover:border-blue-300/70 focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" className="bg-slate-900">
            {placeholder}
          </option>

          {options.map((option) => (
            <option key={option} value={option} className="bg-slate-900">
              {format ? format(option) : option}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
      </div>
    </label>
  );
}

function Benefit({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-medium text-slate-200">
      <span className="text-blue-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {text}
    </div>
  );
}
