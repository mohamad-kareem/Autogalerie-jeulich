"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FiArrowLeft, FiMaximize2, FiX } from "react-icons/fi";

const ImageSlider = ({
  images = [],
  car = {},
  height = "h-64 sm:h-80 lg:h-96",
  width = "w-full",
  darkMode = false,
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

  // Theme styles
  const borderColor = darkMode ? "border-gray-700" : "border-slate-200";
  const bgColor = darkMode ? "bg-gray-900/60" : "bg-slate-50";
  const textColor = darkMode ? "text-gray-100" : "text-slate-900";
  const textMuted = darkMode ? "text-gray-400" : "text-slate-500";
  const buttonBg = darkMode ? "bg-gray-800/90" : "bg-white/90";
  const buttonHover = darkMode ? "hover:bg-gray-700" : "hover:bg-slate-100";
  const accentColor = darkMode ? "text-blue-400" : "text-blue-600";
  const accentBorder = darkMode ? "border-blue-500" : "border-blue-500";

  return (
    <>
      {/* MAIN VIEWER */}
      <div className="relative w-full">
        <div
          className={`relative overflow-hidden rounded-xl ${borderColor} border shadow-sm`}
        >
          {/* Fullscreen Button */}
          {hasImages && (
            <button
              type="button"
              className={`absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border ${borderColor} ${buttonBg} ${textMuted} shadow-md transition-all ${buttonHover} hover:${accentBorder} hover:${accentColor}`}
              onClick={() => setFullscreenImage(activeImage)}
              aria-label="Vollbild"
            >
              <FiMaximize2 size={14} />
            </button>
          )}

          {/* MAIN IMAGE AREA */}
          <div
            className={`
              relative ${width} ${height}
              ${darkMode ? "bg-gray-900" : "bg-slate-100"}
              transition-opacity duration-300
            `}
          >
            {hasImages ? (
              <Image
                src={imageUrls[activeImage] || "/default-car.jpg"}
                alt={altText}
                fill
                className={`object-contain transition-transform duration-300 ease-out ${
                  darkMode
                    ? "from-gray-900 via-gray-950 to-black"
                    : "from-slate-100 via-slate-50 to-white"
                }`}
                priority
                quality={90}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
                unoptimized
              />
            ) : (
              <div
                className={`flex h-full items-center justify-center ${
                  darkMode ? "text-gray-600" : "text-slate-400"
                }`}
              >
                <div className="text-center">
                  <FiX size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kein Bild verfügbar</p>
                </div>
              </div>
            )}
          </div>

          {/* NAVIGATION ARROWS */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => goPrev(setActiveImage)}
                className={`
                  absolute left-2 top-1/2 -translate-y-1/2
                  inline-flex h-8 w-8 items-center justify-center
                  rounded-full border ${borderColor}
                  ${buttonBg} ${textMuted}
                  shadow-md
                  transition-all
                  ${buttonHover} hover:${accentBorder} hover:${accentColor}
                  active:scale-95
                `}
                aria-label="Vorheriges Bild"
              >
                <FiArrowLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => goNext(setActiveImage)}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2
                  inline-flex h-8 w-8 items-center justify-center
                  rounded-full border ${borderColor}
                  ${buttonBg} ${textMuted}
                  shadow-md
                  transition-all
                  ${buttonHover} hover:${accentBorder} hover:${accentColor}
                  active:scale-95
                `}
                aria-label="Nächstes Bild"
              >
                <FiArrowLeft className="rotate-180" size={14} />
              </button>

              {/* COUNTER */}
              <div
                className={`pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full ${buttonBg} ${borderColor} border px-3 py-1 text-xs font-medium ${textColor} shadow-sm`}
              >
                {activeImage + 1} / {imageUrls.length}
              </div>

              {/* PROGRESS BAR */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 ${
                  darkMode ? "bg-gray-800" : "bg-slate-200"
                }`}
              >
                <div
                  className={`h-full ${
                    darkMode ? "bg-blue-500" : "bg-blue-600"
                  } transition-all duration-300`}
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
        <div className="relative mt-4">
          {/* Gradient edges for better UX */}
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 ${
              darkMode
                ? "bg-gradient-to-r from-gray-900 via-gray-900/95 to-transparent"
                : "bg-gradient-to-r from-white via-white/95 to-transparent"
            } sm:block`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 ${
              darkMode
                ? "bg-gradient-to-l from-gray-900 via-gray-900/95 to-transparent"
                : "bg-gradient-to-l from-white via-white/95 to-transparent"
            } sm:block`}
          />

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
                    h-16 w-20
                    sm:h-18 sm:w-24
                    overflow-hidden rounded-lg border text-left
                    transition-all duration-200
                    ${
                      isActive
                        ? `${accentBorder} ring-2 ring-blue-500/30 scale-[1.03]`
                        : `${borderColor} hover:border-blue-400/60 hover:scale-[1.02]`
                    }
                  `}
                  aria-label={`Bild ${index + 1} anzeigen`}
                >
                  <Image
                    src={img || "/default-car.jpg"}
                    alt={`${altText} Bild ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                  {isActive && (
                    <div
                      className={`absolute inset-0 ${
                        darkMode
                          ? "bg-gradient-to-t from-black/30 via-transparent to-transparent"
                          : "bg-gradient-to-t from-white/20 via-transparent to-transparent"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL */}
      {fullscreenImage !== null && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 ${
              darkMode
                ? "bg-gray-900/95 backdrop-blur-sm"
                : "bg-gray-900/90 backdrop-blur-sm"
            }`}
            onClick={() => setFullscreenImage(null)}
          />

          <div className="relative z-10 flex h-full w-full max-w-6xl items-center justify-center">
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={() => setFullscreenImage(null)}
              className={`absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full ${buttonBg} ${textMuted} shadow-md transition-all ${buttonHover} hover:${accentColor}`}
              aria-label="Schließen"
            >
              <FiX size={20} />
            </button>

            {/* FULLSCREEN NAV ARROWS */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => goPrev(setFullscreenImage)}
                  className={`absolute left-4 top-1/2 z-50 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full ${buttonBg} ${textMuted} shadow-md transition-all ${buttonHover} hover:${accentColor}`}
                  aria-label="Vorheriges Bild"
                >
                  <FiArrowLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => goNext(setFullscreenImage)}
                  className={`absolute right-4 top-1/2 z-50 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full ${buttonBg} ${textMuted} shadow-md transition-all ${buttonHover} hover:${accentColor}`}
                  aria-label="Nächstes Bild"
                >
                  <FiArrowLeft className="rotate-180" size={20} />
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
              <div
                className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full ${
                  darkMode ? "bg-black/60" : "bg-white/90"
                } px-4 py-2 text-sm font-medium ${
                  darkMode ? "text-gray-100" : "text-gray-900"
                } shadow-lg`}
              >
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
