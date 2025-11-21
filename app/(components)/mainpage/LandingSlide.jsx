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
    <section className="w-full bg-white border-b border-gray-100 py-10 sm:py-14 px-4 sm:px-6 lg:px-16">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-2 sm:px-4 lg:px-8">
        {/* Title */}
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">
            Unsere Kategorien
          </h2>
          <div className="mt-3 h-[2px] w-20 mx-auto rounded-full bg-gray-900" />
          <p className="mt-3 text-sm sm:text-base text-gray-500">
            Entdecken Sie unsere wichtigsten Bereiche auf einen Blick.
          </p>
        </div>

        {/* Slider Container with Arrows */}
        <div className="relative">
          {/* Scroll Arrows */}
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:border-gray-400 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:border-gray-400 transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrollable Category Cards */}
          <div
            id="scroll-container"
            className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide px-1 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {popularCategories.map((category, index) => (
              <div
                key={index}
                className="min-w-[180px] sm:min-w-[210px] md:min-w-[230px] lg:min-w-[240px] flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-400 hover:shadow-md"
              >
                <div className="mx-auto mb-4 h-24 w-24 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <Image
                    src={category.image}
                    alt={category.alt}
                    width={100}
                    height={100}
                    unoptimized
                    className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
