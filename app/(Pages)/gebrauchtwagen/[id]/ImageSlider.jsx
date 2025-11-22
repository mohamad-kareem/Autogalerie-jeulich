"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FiArrowLeft } from "react-icons/fi";

const ImageSlider = ({
  images = [],
  car = {},
  // still allow overrides, but mobile height is more relaxed
  height = "h-64 sm:h-80 lg:h-96",
  width = "w-full",
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Normalize image URLs
  const imageUrls = (images || []).map((img) =>
    typeof img === "string" ? img : img?.ref
  );

  const hasImages = imageUrls.length > 0;
  const hasMultiple = imageUrls.length > 1;

  const altText = `${car.make || ""} ${car.model || ""}`.trim() || "Fahrzeug";

  const goPrev = (setter) => {
    setter((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const goNext = (setter) => {
    setter((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* MAIN VIEWER */}
      <div className="relative w-full">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-sm shadow-black/40 group">
          {/* Fullscreen Button */}
          {hasImages && (
            <button
              type="button"
              className="absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-100 shadow-md transition-all hover:border-sky-500 hover:bg-slate-900 hover:text-white sm:right-3 sm:top-3"
              onClick={() => setFullscreenImage(activeImage)}
              aria-label="Vollbild"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          )}

          {/* MAIN IMAGE AREA */}
          <div
            className={`
              relative ${width} ${height}
              bg-slate-950
              transition-opacity duration-300
            `}
          >
            <Image
              src={imageUrls[activeImage] || "/default-car.jpg"}
              alt={altText}
              fill
              className="object-contain bg-gradient-to-b from-slate-900 via-slate-950 to-black transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              priority
              quality={90}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
              unoptimized
            />
          </div>

          {/* NAVIGATION ARROWS */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => goPrev(setActiveImage)}
                className="
                  absolute left-1 top-1/2 -translate-y-1/2
                  inline-flex h-9 w-9 items-center justify-center
                  rounded-full border border-slate-700
                  bg-slate-900/90 text-slate-100
                  shadow-md
                  transition-all
                  hover:border-sky-500 hover:bg-slate-900 hover:text-white
                  active:scale-95
                  sm:left-2
                "
                aria-label="Vorheriges Bild"
              >
                <FiArrowLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => goNext(setActiveImage)}
                className="
                  absolute right-1 top-1/2 -translate-y-1/2
                  inline-flex h-9 w-9 items-center justify-center
                  rounded-full border border-slate-700
                  bg-slate-900/90 text-slate-100
                  shadow-md
                  transition-all
                  hover:border-sky-500 hover:bg-slate-900 hover:text-white
                  active:scale-95
                  sm:right-2
                "
                aria-label="Nächstes Bild"
              >
                <FiArrowLeft className="h-4 w-4 rotate-180" />
              </button>

              {/* COUNTER */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-sm ring-1 ring-slate-700 sm:bottom-3">
                {activeImage + 1} / {imageUrls.length}
              </div>

              {/* PROGRESS BAR */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{
                    width: `${((activeImage + 1) / imageUrls.length) * 100}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* THUMBNAILS */}
      {hasMultiple && (
        <div className="relative mt-3">
          {/* Soft gradient edges only from sm+ (on very small screens it's not needed) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-slate-950 via-slate-950 to-transparent sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-slate-950 via-slate-950 to-transparent sm:block" />

          <div className="flex space-x-2 overflow-x-auto px-1 py-2 scrollbar-hide">
            {imageUrls.map((img, index) => {
              const isActive = activeImage === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`
                    relative flex-shrink-0
                    h-14 w-20
                    sm:h-16 sm:w-24
                    overflow-hidden rounded-xl border text-left
                    transition-all duration-200
                    ${
                      isActive
                        ? "border-sky-500 ring-2 ring-sky-500/70 scale-[1.03]"
                        : "border-slate-800 hover:border-sky-500/60 hover:scale-[1.02]"
                    }
                  `}
                  aria-label={`Bild ${index + 1} anzeigen`}
                >
                  <Image
                    src={img || "/default-car.jpg"}
                    alt={`${altText} Bild ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL */}
      {fullscreenImage !== null && hasImages && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-2 sm:p-4">
          <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-slate-100 shadow-md transition-all hover:bg-slate-800 hover:text-white"
              aria-label="Schließen"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* FULLSCREEN NAV ARROWS */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => goPrev(setFullscreenImage)}
                  className="absolute left-2 top-1/2 z-50 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-100 shadow-md transition-all hover:bg-slate-800 hover:text-white sm:left-4"
                  aria-label="Vorheriges Bild"
                >
                  <FiArrowLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={() => goNext(setFullscreenImage)}
                  className="absolute right-2 top-1/2 z-50 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-100 shadow-md transition-all hover:bg-slate-800 hover:text-white sm:right-4"
                  aria-label="Nächstes Bild"
                >
                  <FiArrowLeft className="h-5 w-5 rotate-180" />
                </button>
              </>
            )}

            {/* FULLSCREEN IMAGE */}
            <div className="pointer-events-none relative h-[70vh] w-[96vw] max-w-5xl sm:h-[80vh]">
              <Image
                src={imageUrls[fullscreenImage] || "/default-car.jpg"}
                alt={`${altText} (Fullscreen)`}
                fill
                className="object-contain"
                quality={100}
              />
            </div>

            {/* COUNTER IN FS */}
            {hasMultiple && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-slate-50 shadow-md">
                {fullscreenImage + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageSlider;
