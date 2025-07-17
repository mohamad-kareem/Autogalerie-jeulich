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
        ? container.clientWidth / 1.2
        : container.clientWidth / 3;
    container.scrollBy({
      left: dir === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-gray-50 px-4 sm:px-6 lg:px-16 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
            Unsere Premium-Auswahl
          </h2>
          <Link
            href="/gebrauchtwagen"
            className="text-base sm:text-lg font-medium text-black hover:text-red-700 flex items-center"
          >
            Alle Fahrzeuge anzeigen
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>

        {/* Slider Container */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scrollByOffset("left")}
            className="hidden md:flex absolute top-1/2 -left-5 transform -translate-y-1/2 z-20 bg-white border border-gray-200 text-red-600 p-2 rounded-full shadow-md hover:bg-red-100 transition-all duration-300 group-hover:opacity-100 opacity-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Scrollable Row */}
          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide px-1 py-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {cars.map((car) => (
              <div
                key={car._id}
                className="snap-center flex-shrink-0 w-72 sm:w-80 lg:w-[22rem] bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-red-400/30 transition-transform transform hover:scale-[1.03]"
              >
                {/* Image */}
                <div className="w-full h-44 sm:h-48 lg:h-52 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-xl">
                  {car.images?.[0]?.ref ? (
                    <img
                      src={car.images[0].ref}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <CarFront className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {car.make} {car.model}
                    </h3>
                    {car.price?.consumerPriceGross && (
                      <span className="text-red-600 font-bold text-sm sm:text-base ml-2 whitespace-nowrap">
                        {parseFloat(
                          car.price.consumerPriceGross
                        ).toLocaleString("de-DE", {
                          style: "currency",
                          currency: car.price.currency || "EUR",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    )}
                  </div>

                  {car.modelDescription && (
                    <p className="text-gray-500 text-sm line-clamp-1">
                      {car.modelDescription}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm mt-2 border-t border-gray-100 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {car.firstRegistration?.slice(0, 4) || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {car.mileage
                          ? `${car.mileage.toLocaleString()} km`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {fuelMap[car.fuel] || car.fuel || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {car.power ? `${car.power} PS` : "-"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/gebrauchtwagen/${car._id}`}
                    className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-200 text-red-700 py-2 px-4 text-sm sm:text-base rounded-md transition-all duration-200"
                  >
                    Details ansehen
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollByOffset("right")}
            className="hidden md:flex absolute top-1/2 -right-5 transform -translate-y-1/2 z-20 bg-white border border-gray-200 text-red-600 p-2 rounded-full shadow-md hover:bg-red-100 transition-all duration-300 group-hover:opacity-100 opacity-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
