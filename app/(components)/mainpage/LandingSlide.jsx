"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import popularCategories from "../../utils/images.js";

export default function LandingSlide() {
  const scroll = (direction) => {
    const container = document.getElementById("scroll-container");
    if (!container) return;

    const scrollAmount = window.innerWidth < 640 ? 220 : 300;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-[#f5f5f2] py-10 sm:py-14">
      <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
        {/* Header row — mobile.de style: title left, arrows right */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <div className="mb-3 h-[2px] w-10 bg-[#146c2e] sm:w-12" />

            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#146c2e] sm:text-[10px] sm:tracking-[0.32em]">
              Kategorien
            </p>

            <p className="mt-2 max-w-md text-[13px] font-semibold leading-6 text-[#263126] sm:text-sm">
              Entdecken Sie unsere wichtigsten Bereiche auf einen Blick.
            </p>
          </div>

          {/* Arrows — desktop only, top-right like mobile.de */}
          <div className="hidden shrink-0 gap-2 md:flex">
            <button
              onClick={() => scroll("left")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#101510] shadow-sm transition hover:border-[#146c2e] hover:text-[#146c2e]"
              aria-label="Zurück"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={() => scroll("right")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#101510] shadow-sm transition hover:border-[#146c2e] hover:text-[#146c2e]"
              aria-label="Weiter"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Category Cards */}
        <div
          id="scroll-container"
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {popularCategories.map((category, index) => (
            <Link
              key={index}
              href={category.link || "/gebrauchtwagen"}
              className="group flex w-[160px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-white/70 bg-white shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:w-[200px]"
            >
              {/* Image area — mobile.de style full-width thumbnail */}
              <div className="relative flex h-[120px] items-center justify-center overflow-hidden bg-[#fafaf8] sm:h-[150px]">
                <Image
                  src={category.image}
                  alt={category.alt}
                  width={140}
                  height={140}
                  unoptimized
                  className="h-[80%] w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Text area */}
              <div className="flex flex-1 flex-col border-t border-black/5 p-3.5">
                <h3 className="text-sm font-black tracking-[-0.02em] text-[#101510] sm:text-base">
                  {category.title}
                </h3>

                <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-5 text-[#263126]">
                  {category.description}
                </p>

                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-[#146c2e] transition group-hover:gap-2">
                  Ansehen
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
