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
  ArrowRight,
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
    <section className="w-full bg-[#f5f5f2] py-10 sm:py-14">
      <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
        {/* Header — title left, "Alle Fahrzeuge" right */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <div className="mb-3 h-[2px] w-10 bg-[#146c2e] sm:w-12" />

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#146c2e] sm:text-[14px] sm:tracking-[0.32em]">
              Fahrzeugbestand
            </p>

            <p className="mt-4 max-w-[480px] text-[14px] font-medium leading-7 text-[#263126] sm:text-[25px] sm:leading-[35px]">
              Modern, elegant, übersichtlich
            </p>
          </div>
        </div>

        <div className="relative">
          {/* Scroll buttons */}
          <button
            type="button"
            onClick={() => scrollByOffset("left")}
            className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-white text-[#101510] shadow-md transition hover:border-[#146c2e] hover:text-[#146c2e]"
            aria-label="Vorherige Fahrzeuge"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollByOffset("right")}
            className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-white text-[#101510] shadow-md transition hover:border-[#146c2e] hover:text-[#146c2e]"
            aria-label="Nächste Fahrzeuge"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Slider */}
          <div
            ref={sliderRef}
            className="flex gap-3 overflow-x-auto scroll-smooth py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
          >
            {/* Loading placeholders */}
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 w-[260px] flex-shrink-0 animate-pulse rounded-[16px] border border-white/70 bg-white shadow-xl shadow-black/10 sm:w-72"
                />
              ))}

            {!loading && cars.length === 0 && (
              <div className="flex w-full items-center justify-center rounded-[16px] border border-dashed border-black/15 bg-white py-10 text-sm font-semibold text-gray-500">
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
                    className="group flex h-full w-[260px] flex-shrink-0 flex-col overflow-hidden rounded-[16px] border border-white/70 bg-white shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:w-72"
                  >
                    {/* Image */}
                    <div className="relative h-40 w-full overflow-hidden bg-[#fafaf8]">
                      {car.images?.[0]?.ref ? (
                        <img
                          src={car.images[0].ref}
                          alt={`${car.make} ${car.model}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <CarFront className="h-8 w-8" />
                        </div>
                      )}

                      {priceLabel && (
                        <div className="absolute bottom-2 left-2 rounded-lg bg-white px-2.5 py-1 backdrop-blur-md">
                          <span className="text-xs font-black text-[#17b14b]">
                            {priceLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col border-t border-black/5 p-4">
                      <h3 className="truncate text-sm font-black tracking-[-0.02em] text-[#101510]">
                        {car.make} {car.model}
                      </h3>

                      {car.modelDescription && (
                        <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-gray-500">
                          {car.modelDescription}
                        </p>
                      )}

                      {/* Specs */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-[#263126]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#146c2e]" />
                          <span>{yearLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-[#146c2e]" />
                          <span className="truncate">{mileageLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Fuel className="h-3.5 w-3.5 text-[#146c2e]" />
                          <span className="truncate">{fuelLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-[#146c2e]" />
                          <span>{powerLabel}</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/gebrauchtwagen/${car._id}`}
                        className="mt-8 inline-flex items-center justify-center  gap-2 rounded-xl bg-black/60 px-5 py-3 text-xs font-black text-white shadow-lg shadow-green-900/25 transition hover:bg-[#0f5724]"
                      >
                        Details ansehen
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
