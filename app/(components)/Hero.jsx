"use client";
import Image from "next/image";
import Hero1 from "../(assets)/dacia.jpg";
import Hero2 from "../(assets)/Hero2.jpeg";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [Hero1, Hero2];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative max-w-[76rem] mx-auto h-[50vh] sm:h-[40vh] md:h-[50vh] lg:h-[50vh] mb-8 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full overflow-hidden shadow-lg">
        {/* Background image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.4 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={slides[index]}
              alt={`Slide ${index + 1}`}
              className="object-contains h-full w-full"
              priority
            />
            <div className="absolute inset-0 bg-black/5 z-10" />
          </motion.div>
        </AnimatePresence>

        <div className="  absolute bottom-10 sm:bottom-14 left-10 sm:left-15 z-20 flex flex-col items-start bg-black/50 p-4 sm:p-6 rounded-xl shadow-md max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] border border-white/30">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
            Autogalerie Jülich
          </h2>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            Alte Dürenerstraße 4
            <br />
            52428 Jülichs
            <br />
            Deutschland
            <br />
            <span className="block mt-2 font-semibold">
              Tel.: +49 2461 9163780
            </span>
          </p>
        </div>

        {/* Arrows and dots */}
        <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex items-center justify-between px-4 z-30">
          <button
            onClick={prevSlide}
            className="p-2 bg-white/40 hover:bg-red-600 rounded-full transition"
          >
            <ChevronLeft size={20} color="white" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                  i === index ? "bg-white" : "bg-white/40"
                } transition`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 bg-white/40 hover:bg-red-600 rounded-full transition"
          >
            <ChevronRight size={20} color="white" />
          </button>
        </div>
      </div>
    </section>
  );
}
