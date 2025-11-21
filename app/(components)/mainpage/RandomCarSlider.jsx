"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  CarFront,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Gauge,
  Fuel,
  Zap,
} from "lucide-react";

const fuelMap = {
  DIESEL: "Diesel",
  PETROL: "Benzin",
  ELECTRIC: "Elektrisch",
  HYBRID: "Hybrid",
  LPG: "Autogas (LPG)",
  CNG: "Erdgas (CNG)",
  HYDROGEN: "Wasserstoff",
  OTHER: "Andere",
};

export default function RandomCarSlider() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        if (!res.ok) throw new Error("Fehler beim Laden der Fahrzeuge");
        const data = await res.json();
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setCars(shuffled.slice(0, 6));
      } catch (err) {
        console.error("Error fetching cars", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCars();
  }, []);

  const scrollByOffset = (dir = "right") => {
    const container = sliderRef.current;
    if (!container) return;
    const offset = container.clientWidth * 0.7;
    container.scrollBy({
      left: dir === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  const formatPrice = (price) => {
    if (!price) return null;
    const num = parseFloat(price);
    if (Number.isNaN(num)) return null;
    return num.toLocaleString("de-DE", { maximumFractionDigits: 0 }) + " €";
  };

  const formatMileage = (mileage) => {
    if (!mileage && mileage !== 0) return "-";
    return `${mileage.toLocaleString("de-DE")} km`;
  };

  const formatYear = (firstRegistration) =>
    firstRegistration ? firstRegistration.slice(0, 4) : "-";

  return (
    <section className="w-full bg-white border-b border-gray-100 py-10 sm:py-14 px-4 sm:px-6 lg:px-16">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header – same vibe as DesktopMenu: clean, neutral */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Unsere Fahrzeuge
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Übersichtlich, kompakt und direkt verfügbar.
            </p>
          </div>

          <Link
            href="/gebrauchtwagen"
            className="hidden items-center gap-1 text-sm border-2 border-gray-300 p-1 rounded-xl font-medium text-gray-800 transition hover:text-black sm:flex"
          >
            Alle Fahrzeuge
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          {/* Scroll buttons – match menu: white, gray border, subtle shadow */}
          <button
            type="button"
            onClick={() => scrollByOffset("left")}
            className="absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 hover:border-gray-400"
            aria-label="Vorherige Fahrzeuge"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollByOffset("right")}
            className="absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 hover:border-gray-400"
            aria-label="Nächste Fahrzeuge"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Slider */}
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Loading placeholders */}
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 w-72 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
                />
              ))}

            {!loading && cars.length === 0 && (
              <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-10 text-sm text-gray-500">
                Derzeit sind keine Fahrzeuge verfügbar.
              </div>
            )}

            {!loading &&
              cars.map((car) => {
                const priceLabel = formatPrice(car?.price?.consumerPriceGross);
                const yearLabel = formatYear(car?.firstRegistration);
                const mileageLabel = formatMileage(car?.mileage);
                const fuelLabel = fuelMap[car?.fuel] || car?.fuel || "-";
                const powerLabel =
                  car?.power || car?.kw ? `${car.power || car.kw} PS` : "-";

                return (
                  <article
                    key={car._id}
                    className="group flex h-full w-72 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gray-400 hover:shadow-md"
                  >
                    {/* Image */}
                    <div className="h-40 w-full overflow-hidden bg-gray-100">
                      {car.images?.[0]?.ref ? (
                        <img
                          src={car.images[0].ref}
                          alt={`${car.make} ${car.model}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <CarFront className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {car.make} {car.model}
                        </h3>
                      </div>

                      {car.modelDescription && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                          {car.modelDescription}
                        </p>
                      )}

                      {priceLabel && (
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {priceLabel}
                        </p>
                      )}

                      {/* Specs */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{yearLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5" />
                          <span className="truncate">{mileageLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Fuel className="h-3.5 w-3.5" />
                          <span className="truncate">{fuelLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          <span>{powerLabel}</span>
                        </div>
                      </div>

                      {/* CTA – black button to match neutral theme */}
                      <Link
                        href={`/gebrauchtwagen/${car._id}`}
                        className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-black"
                      >
                        Details ansehen
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>

          {/* Mobile "Alle Fahrzeuge" link */}
          <div className="mt-4 flex justify-center sm:hidden">
            <Link
              href="/gebrauchtwagen"
              className="flex items-center gap-1 text-sm font-medium text-gray-800 transition hover:text-black"
            >
              Alle Fahrzeuge ansehen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
