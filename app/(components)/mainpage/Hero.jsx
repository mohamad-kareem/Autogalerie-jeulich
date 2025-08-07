"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  ShieldCheck,
  Settings,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Check,
} from "lucide-react";
import SimpleContactFormModal from "../helpers/SimpleContactFormModal";
import Bild2 from "../../(assets)/Peugeot.png";
import Bild3 from "../../(assets)/corsa1.png";
import Bild4 from "../../(assets)/promo3.png";
import Bild5 from "../../(assets)/opel2ad.png";
export default function Hero() {
  const slides = [
    {
      image: Bild2,
      title: "Exklusive Fahrzeugkollektion",
      subtitle:
        "TÜV-geprüfte Premium-Fahrzeuge mit flexiblen Finanzierungsoptionen.",
      features: ["Individuelle Finanzierung", "TÜV-geprüfte Qualität"],

      cta: {
        primary: { text: "Fahrzeuge entdecken", href: "/gebrauchtwagen" },
        secondary: { text: "Beratungstermin", href: "/kontakt" },
      },
    },
    {
      image: Bild3,
      title: "Maßgeschneiderte Finanzierung",
      subtitle: "12 Monate Premium-Garantie mit Sofort-Zusage.",
      features: ["12 Monate Garantie", "Sofort-Zusage"],

      cta: {
        primary: { text: "Fahrzeuge entdecken", href: "/gebrauchtwagen" },
        secondary: { text: "Beratungstermin", href: "/kontakt" },
      },
    },
    {
      image: Bild5,
      title: "Premium Serviceerlebnis",
      subtitle: "Über 100 exklusive Fahrzeuge mit VIP-Service.",
      features: ["100+ Fahrzeuge", "VIP-Service"],

      cta: {
        primary: { text: "Fahrzeuge entdecken", href: "/gebrauchtwagen" },
        secondary: { text: "Beratungstermin", href: "/kontakt" },
      },
    },

    {
      image: Bild4,
      title: "Premium Serviceerlebnis",
      subtitle: "Über 100 exklusive Fahrzeuge mit VIP-Service.",
      features: ["100+ Fahrzeuge", "VIP-Service"],

      cta: {
        primary: { text: "Fahrzeuge entdecken", href: "/gebrauchtwagen" },
        secondary: { text: "Beratungstermin", href: "/kontakt" },
      },
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-advance slides
  const resetTimeout = () =>
    timeoutRef.current && clearTimeout(timeoutRef.current);

  useEffect(() => {
    resetTimeout();
    if (!isHovering) {
      timeoutRef.current = setTimeout(
        () =>
          setCurrentSlide((prev) =>
            prev === slides.length - 1 ? 0 : prev + 1
          ),
        7000
      );
    }
    return resetTimeout;
  }, [currentSlide, isHovering]);

  const goToSlide = (index) => setCurrentSlide(index);
  const nextSlide = () =>
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const slide = slides[currentSlide];

  const iconForFeature = (index) => {
    const icons = [
      <Car size={isMobile ? 14 : 16} className="text-red-600" />,
      <ShieldCheck size={isMobile ? 14 : 16} className="text-red-600" />,
      <Settings size={isMobile ? 14 : 16} className="text-red-600" />,
    ];
    return icons[index % icons.length];
  };

  return (
    <section className="relative bg-gray-50 overflow-hidden">
      {/* Mobile-optimized background */}
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10" />

      <div className="relative w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto  px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-6 md:gap-12 mt-5">
        {/* Content section - optimized stacking on mobile */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4 md:space-y-6 lg:space-y-8 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium tracking-wide shadow"
          >
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className=" absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-white"></span>
            </span>
            Premium Qualität seit 2012
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-3 md:space-y-4 lg:space-y-6"
          >
            <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
              {slide.title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-md mx-auto lg:mx-0">
              {slide.subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3"
          >
            {slide.features.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 bg-white text-gray-800 rounded-lg px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium shadow-sm border border-gray-100 hover:shadow transition-all group"
              >
                <span className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 bg-red-900/10 rounded-full group-hover:bg-red-900/20 transition-colors">
                  {iconForFeature(index)}
                </span>
                {feature}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start pt-2 md:pt-4"
          >
            <Link
              href={slide.cta.primary.href}
              className="group flex items-center justify-center gap-1.5 px-5 py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 bg-black text-white font-semibold rounded-lg shadow hover:shadow-md hover:bg-red-800 transition-all text-sm md:text-lg"
            >
              {slide.cta.primary.text}
              <ArrowRight
                size={isMobile ? 14 : 16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href={slide.cta.secondary.href}
              className="px-5 py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 border border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow text-sm md:text-base"
            >
              {slide.cta.secondary.text}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 pt-4 md:pt-6"
          >
            {[
              "24 Monate Garantie",
              "+100 Fahrzeuge",
              "Persönliche Beratung",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600"
              >
                <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 bg-green-900/5 rounded-full">
                  <Check size={isMobile ? 12 : 14} className="text-green-700" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Image slider section - full width on mobile */}
        <div className="w-full lg:w-1/2 relative order-1 lg:order-2 mt-10 lg:mt-0  lg:mb-0">
          <div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl lg:shadow-2xl border-2 md:border-4 border-white"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                className="absolute inset-0"
                initial={{ opacity: 0, x: isMobile ? 0 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isMobile ? 0 : -100 }}
                transition={{
                  duration: isMobile ? 0.4 : 0.6,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: slide.overlay }}
                />
              </motion.div>
            </AnimatePresence>

            {/* Slide navigation arrows - larger touch targets on mobile */}
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-red-900 p-1.5 md:p-2 rounded-full shadow z-10 transition-all active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronRight size={isMobile ? 16 : 18} className="rotate-180" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-red-900 p-1.5 md:p-2 rounded-full shadow z-10 transition-all active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight size={isMobile ? 16 : 18} />
            </button>

            {/* Slide indicators - bottom centered */}
            <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-4 md:w-6 bg-white"
                      : "w-2 md:w-3 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Floating testimonial card - only on desktop */}
          {!isMobile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="hidden lg:block absolute -bottom-6 -right-6 w-64 h-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
            >
              <div className="p-4 bg-gradient-to-br from-black to-red-900 text-white">
                <h3 className="font-bold text-sm md:text-base mb-1">
                  Kundenbewertungen
                </h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-3 h-3 md:w-4 md:h-4 text-yellow-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs">4.9 (128)</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs md:text-sm text-gray-600 italic">
                  "Ausgezeichneter Service und Premium-Fahrzeuge."
                </p>
                <p className="text-2xs md:text-xs text-gray-500 mt-1">
                  — Michael B., München
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating contact button - mobile optimized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
      >
        <button
          onClick={() => setShowContactModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 md:px-5 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-red-800 transition-all active:scale-95"
        >
          <MessageSquare size={isMobile ? 16 : 20} />
          {!isMobile && (
            <span className="text-sm md:text-base font-medium">Beratung</span>
          )}
        </button>
      </motion.div>
      <SimpleContactFormModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </section>
  );
}
