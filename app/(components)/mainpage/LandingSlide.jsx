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
  //     py-12  relative
  return (
    <section className="py-12  relative w-full overflow-hidden   shadow-even mb-8 px-4 sm:px-6 lg:px-16">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-4">
          Unsere Kategorien
        </h2>
        <div className="border-b border-gray-800 mb-4"></div>

        {/* Left Arrow Button */}
        <button
          type="button"
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-red-600 to-black rounded-full  p-1 sm:p-2 hover:from-white hover:to-white  z-10 transition"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-black" />
        </button>

        {/* Scrollable Container */}
        <div
          id="scroll-container"
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
        >
          {popularCategories.map((category, index) => (
            <div
              key={index}
              className="min-w-[200px] sm:min-w-[220px] md:min-w-[240px] bg-gradient-to-br from-black/50 to-white/40 hover:from-red-600 hover:to-black/20 rounded-xl p-4 sm:p-6 flex-shrink-0 flex flex-col items-center justify-between text-center shadow transition duration-300"
            >
              <Image
                src={category.image}
                alt={category.alt}
                width={100}
                height={100}
                className="object-contain mb-4"
              />
              <h3 className="font-semibold text-white text-base sm:text-lg">
                {category.title}
              </h3>
              <p className="text-red-600 text-xs sm:text-sm mt-1">
                {category.description}
              </p>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-red-600 to-black rounded-full shadow p-1 sm:p-2 hover:from-white hover:to-white  z-10 transition"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
        </button>
        {/* Glow Effects */}
        <div className="absolute -bottom-20 -left-20 w-300 h-64 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}
