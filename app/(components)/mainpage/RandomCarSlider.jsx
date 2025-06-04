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
const maps = {
  fuel: {
    DIESEL: "Diesel",
    PETROL: "Benzin",
    ELECTRIC: "Elektrisch",
    HYBRID: "Hybrid",
    LPG: "Autogas (LPG)",
    CNG: "Erdgas (CNG)",
    HYDROGEN: "Wasserstoff",
    OTHER: "Andere",
  },
};
export default function RandomCarSlider() {
  const [cars, setCars] = useState([]);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchRandomCars = async () => {
      try {
        const res = await fetch("/api/cars");
        const data = await res.json();
        const shuffled = data.sort(() => 0.5 - Math.random());
        setCars(shuffled.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch cars", err);
      }
    };
    fetchRandomCars();
  }, []);

  const scroll = (direction) => {
    const container = sliderRef.current;
    if (!container) return;

    const amount = window.innerWidth <= 640 ? 300 : 330;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-12 relative w-full overflow-hidden px-4 sm:px-6 lg:px-16  pb-20 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-white mb-4 tracking-wide">
          Premium-Auswahl
        </h2>
        <div className="border-b border-gray-700 mb-6 w-full"></div>

        {/* Left Arrow Button */}
        <button
          type="button"
          className="absolute left-1 sm:left-17 top-1/2 -translate-y-1/2 bg-gradient-to-br from-black/50 to-white/40 hover:from-red-900 hover:to-black/20 rounded-full p-2 sm:p-3 border border-gray-700 hover:border-gray-500 z-10 transition-all duration-300"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={sliderRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 scroll-smooth scrollbar-hide bg-black"
        >
          {cars.map((car) => (
            <div
              key={car._id}
              className="min-w-[260px] sm:min-w-[280px] bg-gradient-to-br from-black/50 to-white/40   hover:from-red-900 hover:to-black/20 rounded-lg p-4 flex-shrink-0 flex flex-col items-center justify-between text-center shadow-lg transition-all duration-300 "
            >
              {/* Image Container */}
              <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center p-2">
                {car.images?.[0]?.ref ? (
                  <img
                    src={car.images[0].ref}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover rounded-md transform hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600">
                    <CarFront className="h-10 w-10" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="w-full">
                <h3 className="font-medium text-white text-base sm:text-lg line-clamp-1 tracking-tight">
                  {car.make} {car.model}
                </h3>
                {car.modelDescription && (
                  <p className="text-gray-400 text-xs mt-1 line-clamp-1 font-light">
                    {car.modelDescription}
                  </p>
                )}

                {/* Price */}
                {car.price?.consumerPriceGross && (
                  <p className="text-red-500 font-medium text-sm sm:text-base mt-3">
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

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-400 font-light">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    {car.firstRegistration
                      ? car.firstRegistration.slice(0, 4)
                      : "-"}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    {car.mileage ? `${car.mileage.toLocaleString()} km` : "-"}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Fuel className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    {maps.fuel[car.fuel] || car.fuel || "-"}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    {car.power ? `${car.power} PS` : "-"}
                  </div>
                </div>

                <Link
                  href={`/gebrauchtwagen/${car._id}`}
                  className="mt-4 inline-flex items-center justify-center gap-1 text-xs sm:text-sm font-normal text-gray-300 hover:text-white transition-all"
                >
                  Einzelheiten anzeigen{" "}
                  <ChevronRight className="h-3 w-3 mt-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          className="absolute right-1 sm:right-16 top-1/2 -translate-y-1/2 bg-gradient-to-br from-black/50 to-white/40 hover:from-red-900 hover:to-black/20 rounded-full p-2 sm:p-3 border border-gray-700 hover:border-gray-500 z-10 transition-all duration-300"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white" />
        </button>

        {/* Subtle Glow Effect */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-red-500/3 blur-[100px] pointer-events-none"></div>
      </div>
    </section>
  );
}
