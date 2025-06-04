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
    const amount = window.innerWidth <= 640 ? 260 : 330;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-16 py-14 bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6">
          Premium-Auswahl
        </h2>

        <div className="relative">
          {/* Arrows */}
          <div className="absolute inset-y-0 left-0 flex items-center z-10">
            <button
              onClick={() => scroll("left")}
              className="bg-black/60 hover:bg-red-800 text-white p-2 sm:p-2.5 rounded-full shadow border border-white/10 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center z-10">
            <button
              onClick={() => scroll("right")}
              className="bg-black/60 hover:bg-red-800 text-white p-2 sm:p-2.5 rounded-full shadow border border-white/10 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Cards */}
          <div
            ref={sliderRef}
            className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth scrollbar-hide px-6 sm:px-10"
          >
            {cars.map((car) => (
              <div
                key={car._id}
                className="min-w-[250px] sm:min-w-[280px] bg-gradient-to-br from-black/80 to-gray-900 rounded-xl border border-gray-800 p-4 flex-shrink-0 shadow-lg transition duration-300 hover:shadow-red-800/20"
              >
                {/* Image */}
                <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                  {car.images?.[0]?.ref ? (
                    <img
                      src={car.images[0].ref}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <CarFront className="w-8 h-8 text-gray-600" />
                  )}
                </div>

                {/* Details */}
                <h3 className="text-white font-medium text-base sm:text-lg truncate">
                  {car.make} {car.model}
                </h3>

                {car.modelDescription && (
                  <p className="text-gray-400 text-sm mt-1 truncate">
                    {car.modelDescription}
                  </p>
                )}

                {/* Price */}
                {car.price?.consumerPriceGross && (
                  <p className="text-red-500 font-semibold text-sm mt-3">
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

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-400 font-light">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {car.firstRegistration
                      ? car.firstRegistration.slice(0, 4)
                      : "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Gauge className="w-4 h-4" />
                    {car.mileage ? `${car.mileage.toLocaleString()} km` : "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    {maps.fuel[car.fuel] || car.fuel || "-"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {car.power ? `${car.power} PS` : "-"}
                  </div>
                </div>

                {/* Link */}
                <Link
                  href={`/gebrauchtwagen/${car._id}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs text-red-400 hover:text-white transition"
                >
                  Einzelheiten anzeigen
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Glow Effect */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      </div>
    </section>
  );
}
