"use client";
import React, { useState } from "react";
import Image from "next/image";
import { FiArrowLeft } from "react-icons/fi";

const ImageSlider = ({ images = [], car = {} }) => {
  const [activeImage, setActiveImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Normalize image URLs
  const imageUrls = images.map((img) =>
    typeof img === "string" ? img : img.ref
  );

  const altText = `${car.make || ""} ${car.model || ""}`.trim();

  return (
    <>
      {/* Main Viewer */}
      <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <button
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-lg shadow-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
          onClick={() => setFullscreenImage(activeImage)}
          aria-label="Vollbild"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>

        <div className="relative h-96 w-full transition-opacity duration-300">
          <Image
            src={imageUrls[activeImage] || "/default-car.jpg"}
            alt={altText}
            fill
            className="object-contain  transition-transform duration-500 ease-in-out group-hover:scale-[1.02]"
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          />
        </div>

        {imageUrls.length > 1 && (
          <>
            <button
              onClick={() =>
                setActiveImage((prev) =>
                  prev === 0 ? imageUrls.length - 1 : prev - 1
                )
              }
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-red-500 text-gray-800 p-2 md:p-3 rounded-full shadow-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Prev"
            >
              <FiArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
              onClick={() =>
                setActiveImage((prev) =>
                  prev === imageUrls.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-red-500 text-gray-800 p-2 md:p-3 rounded-full shadow-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Next"
            >
              <FiArrowLeft className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
              {activeImage + 1} / {imageUrls.length}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-red-200 transition-all duration-300"
                style={{
                  width: `${((activeImage + 1) / imageUrls.length) * 100}%`,
                }}
              ></div>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="relative mt-3">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>

          <div className="flex space-x-3 overflow-x-auto py-2 px-1 scrollbar-hide -mx-1">
            {imageUrls.map((img, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`relative flex-shrink-0 w-20 h-20 bg-white rounded-lg border overflow-hidden transition-all duration-200 ease-in-out ${
                  activeImage === index
                    ? "ring-2 ring-red-500 border-transparent scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:scale-105"
                }`}
              >
                <Image
                  src={img}
                  alt={`${altText} Bild ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {activeImage === index && (
                  <div className="absolute inset-0 bg-black/20"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenImage !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
              aria-label="Close"
            >
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setFullscreenImage((prev) =>
                      prev === 0 ? imageUrls.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 md:p-3 rounded-full hover:bg-white/10 transition-all"
                  aria-label="Prev"
                >
                  <FiArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                <button
                  onClick={() =>
                    setFullscreenImage((prev) =>
                      prev === imageUrls.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 md:p-3 rounded-full hover:bg-white/10 transition-all"
                  aria-label="Next"
                >
                  <FiArrowLeft className="w-6 h-6 md:w-8 md:h-8 rotate-180" />
                </button>
              </>
            )}

            <div className="relative w-full h-full max-w-6xl">
              <Image
                src={imageUrls[fullscreenImage] || "/default-car.jpg"}
                alt={`${altText} (Fullscreen)`}
                fill
                className="object-contain"
                quality={100}
              />
            </div>

            {imageUrls.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
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
