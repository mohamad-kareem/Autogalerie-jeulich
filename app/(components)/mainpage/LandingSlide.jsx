"use client";

import Image from "next/image";
import { ChevronRight, ChevronLeft } from "lucide-react";
import popularCategories from "../../utils/images.js";

export default function LandingSlide() {
  const scroll = (direction) => {
    const container = document.getElementById("scroll-container");
    if (!container) return;

    const amount = window.innerWidth <= 640 ? 200 : 300;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-even mb-8 ">
      <div className="w-full max-w-7xl mx-auto relative">
        {/* Title */}
        <div className="px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
            Unsere Kategorien
          </h2>
          <div className="border-b border-gray-800 mb-6"></div>
        </div>

        {/* Scroll Arrows - improved positioning */}
        <div className="absolute inset-y-0 left-0 flex items-center z-10 pl-2">
          <button
            onClick={() => scroll("left")}
            className="bg-black/60 hover:bg-red-800 text-white p-2 sm:p-2.5 rounded-full shadow-lg border border-white/10 transition-all transform hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center z-10 pr-2">
          <button
            onClick={() => scroll("right")}
            className="bg-black/60 hover:bg-red-800 text-white p-2 sm:p-2.5 rounded-full shadow-lg border border-white/10 transition-all transform hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Card Container */}
        <div
          id="scroll-container"
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scroll-smooth scrollbar-hide px-10 sm:px-12"
        >
          {popularCategories.map((category, index) => (
            <div
              key={index}
              className="min-w-[180px] sm:min-w-[200px] md:min-w-[220px] bg-gradient-to-br from-black/80 to-gray-900 hover:from-red-900 hover:to-black/30 transition duration-300 rounded-xl p-4 flex-shrink-0 shadow-md text-center"
            >
              <Image
                src={category.image}
                alt={category.alt}
                width={100}
                height={100}
                className="object-contain mx-auto mb-4"
              />
              <h3 className="text-white text-base sm:text-lg font-semibold">
                {category.title}
              </h3>
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                {category.description}
              </p>
            </div>
          ))}
        </div>

        {/* Subtle Glow */}
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />
      </div>
    </section>
  );
}
