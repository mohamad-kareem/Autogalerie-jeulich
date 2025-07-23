"use client";

import Image from "next/image";
import { ChevronRight, ChevronLeft } from "lucide-react";
import popularCategories from "../../utils/images.js";

export default function LandingSlide() {
  const scroll = (direction) => {
    const container = document.getElementById("scroll-container");
    if (!container) return;

    const scrollAmount = window.innerWidth < 640 ? 240 : 320;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-50">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Unsere <span className="text-red-600">Kategorien</span>
          </h2>
          <div className="mt-2 w-24 h-1 bg-red-600 rounded-full mx-auto" />
        </div>

        {/* Scroll Arrows */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-2 top-2/3 -translate-y-1/2 z-20 bg-white text-red-600 border border-gray-300 shadow-md hover:bg-red-50 transition-all p-2 rounded-full"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-2 top-2/3 -translate-y-1/2 z-20 bg-white text-red-600 border border-gray-300 shadow-md hover:bg-red-50 transition-all p-2 rounded-full"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scrollable Category Cards */}
        <div
          id="scroll-container"
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide px-1 py-2"
        >
          {popularCategories.map((category, index) => (
            <div
              key={index}
              className="min-w-[180px] sm:min-w-[220px] md:min-w-[250px] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl p-5 flex-shrink-0 text-center"
            >
              <div className="w-28 h-28 mx-auto mb-4 rounded-lg overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.alt}
                  width={100}
                  height={100}
                  className="object-contain w-full h-full transition-transform duration-300 hover:scale-105"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {category.title}
              </h3>
              <p className="text-sm text-red-600 mt-1">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
