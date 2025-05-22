"use client";

import { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight, FaPause, FaPlay } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageSlider({
  images,
  car,
  autoPlay = true,
  interval = 5000,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("right");
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Handle auto-play
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPlaying, interval, images.length]);

  // Slide handlers
  const handlePrevious = useCallback(() => {
    setDirection("left");
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setDirection("right");
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToImage = useCallback(
    (index) => {
      setDirection(index > currentIndex ? "right" : "left");
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  // Animation settings
  const slideVariants = {
    hiddenRight: { x: "100%", opacity: 0 },
    hiddenLeft: { x: "-100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
    exitRight: { x: "-100%", opacity: 0, transition: { duration: 0.6 } },
    exitLeft: { x: "100%", opacity: 0, transition: { duration: 0.6 } },
  };

  // Get visible thumbnails (current + next two)
  const getVisibleThumbnails = () => {
    const thumbnails = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % images.length;
      thumbnails.push(images[index]);
    }
    return thumbnails;
  };

  return (
    <div className="relative w-full group">
      {/* **Main Slider** */}
      <div className="relative overflow-hidden rounded-xl aspect-video bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            variants={slideVariants}
            initial={direction === "right" ? "hiddenRight" : "hiddenLeft"}
            animate="visible"
            exit={direction === "right" ? "exitLeft" : "exitRight"}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex].ref}
              alt={`${car.make} ${car.model} - ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              loading={currentIndex <= 2 ? "eager" : "lazy"}
            />
          </motion.div>
        </AnimatePresence>

        {/* **Navigation Arrows** */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <FaChevronLeft className="text-lg" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 backdrop-blur-sm"
              aria-label="Next image"
            >
              <FaChevronRight className="text-lg" />
            </button>
          </>
        )}

        {/* **Play/Pause Button** */}
        {autoPlay && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
        )}

        {/* **Image Counter** */}
        <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-2 py-1 rounded-md">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* **Thumbnail Strip (3 Visible Images)** */}
      {images.length > 1 && (
        <div className="flex justify-center mt-4 gap-3 px-2">
          {getVisibleThumbnails().map((image, i) => {
            const actualIndex = (currentIndex + i) % images.length;
            return (
              <motion.button
                key={actualIndex}
                onClick={() => goToImage(actualIndex)}
                whileHover={{ scale: 1.05 }}
                className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                  actualIndex === currentIndex
                    ? "ring-2 ring-primary-500"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{ width: "80px", height: "60px" }}
                aria-label={`View image ${actualIndex + 1}`}
              >
                <img
                  src={image.ref}
                  alt={`Thumbnail ${actualIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {actualIndex === currentIndex && (
                  <motion.div
                    className="absolute inset-0 bg-black/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
