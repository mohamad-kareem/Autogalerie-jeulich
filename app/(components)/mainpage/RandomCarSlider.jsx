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
  const sliderRef = useRef(null);

  useEffect(() => {
    async function fetchCars() {
      try {
        const res = await fetch("/api/cars");
        const data = await res.json();
        // Shuffle
        const shuffled = data.sort(() => 0.5 - Math.random());
        setCars(shuffled.slice(0, 6));
      } catch (e) {
        console.error("Error fetching cars", e);
      }
    }
    fetchCars();
  }, []);

  const scrollByOffset = (dir = "right") => {
    const container = sliderRef.current;
    if (!container) return;
    const offset =
      window.innerWidth < 768
        ? container.clientWidth / 1.5
        : container.clientWidth / 3;
    container.scrollBy({
      left: dir === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-16 py-14 bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-6">
          Premium-Auswahl
        </h2>

        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scrollByOffset("left")}
            className="absolute top-1/2 left-2 sm:left-4 transform -translate-y-1/2 bg-black/50 hover:bg-red-700 text-white p-2 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* Slider Container */}
          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-snap-x scroll-smooth px-2 sm:px-6"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {cars.map((car) => (
              <div
                key={car._id}
                className="snap-center flex-shrink-0 w-60 sm:w-64 md:w-72 lg:w-80 bg-gradient-to-br from-black/80 to-gray-900 rounded-xl border border-gray-800 p-4 shadow-lg hover:shadow-red-800/30 transition-transform transform hover:scale-105"
              >
                {/* Image */}
                <div className="w-full h-36 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center mb-4">
                  {car.images?.[0]?.ref ? (
                    <img
                      src={car.images[0].ref}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <CarFront className="w-10 h-10 text-gray-500" />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-white font-medium text-lg truncate">
                  {car.make} {car.model}
                </h3>

                {/* Short Description */}
                {car.modelDescription && (
                  <p className="text-gray-400 text-sm mt-1">
                    {car.modelDescription.split(" ").slice(0, 4).join(" ")}
                    {car.modelDescription.split(" ").length > 4 && "…"}
                  </p>
                )}

                {/* Price */}
                {car.price?.consumerPriceGross && (
                  <p className="text-red-500 font-semibold text-base mt-3">
                    {parseFloat(car.price.consumerPriceGross).toLocaleString(
                      "de-DE",
                      {
                        style: "currency",
                        currency: car.price.currency || "EUR",
                        maximumFractionDigits: 0,
                      }
                    )}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {car.firstRegistration?.slice(0, 4) || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Gauge className="w-4 h-4" />
                    {car.mileage ? `${car.mileage.toLocaleString()} km` : "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    {fuelMap[car.fuel] || car.fuel || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {car.power ? `${car.power} PS` : "-"}
                  </div>
                </div>

                {/* Details Link */}
                <Link
                  href={`/gebrauchtwagen/${car._id}`}
                  className="inline-flex items-center text-sm text-red-400 hover:text-white mt-4"
                >
                  Einzelheiten anzeigen
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollByOffset("right")}
            className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 bg-black/50 hover:bg-red-700 text-white p-2 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Decorative Glow */}
        <div className="hidden lg:block absolute -bottom-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
      </div>
    </section>
  );
}
