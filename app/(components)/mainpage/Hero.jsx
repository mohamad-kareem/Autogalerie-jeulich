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
  ArrowRight,
  Check,
} from "lucide-react";
import SimpleContactFormModal from "../helpers/SimpleContactFormModal";

import Bild2 from "../../(assets)/img8.png";
import Bild3 from "../../(assets)/img88.png";
import Bild5 from "../../(assets)/img10.png";

export default function Hero() {
  const slides = [
    {
      image: Bild2,
      title: "Exklusive Fahrzeugkollektion",
      subtitle: "TÜV-geprüfte Premium-Fahrzeuge mit flexibler Finanzierung.",
      features: ["12 Monate Garantie", "Sofort-Zusage"],
      cta: {
        primary: { text: "Fahrzeuge entdecken", href: "/gebrauchtwagen" },
        secondary: { text: "Beratungstermin", href: "/kontakt" },
      },
    },
    {
      image: Bild3,
      title: "Maßgeschneiderte Finanzierung",
      subtitle: "12 Monate Premium-Garantie mit Sofort-Zusage.",
      features: ["Individuelle Finanzierung", "TÜV-geprüfte Qualität"],
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
        6000
      );
    }
    return resetTimeout;
  }, [currentSlide, isHovering]);

  const goToSlide = (index) => setCurrentSlide(index);
  const slide = slides[currentSlide];

  const iconForFeature = (index) => {
    const icons = [
      <Car size={18} className="text-red-500" />,
      <ShieldCheck size={18} className="text-red-500" />,
      <Settings size={18} className="text-red-500" />,
    ];
    return icons[index % icons.length];
  };

  return (
    <section className="relative bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden min-h-screen flex items-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.12),transparent_70%)]" />

      <div className="relative w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-16 flex flex-col lg:flex-row items-center gap-6 md:gap-12">
        {/* Slider Image */}
        <div
          className="w-full lg:w-1/2 relative flex justify-center order-1 lg:order-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="relative w-full h-64 sm:h-80 md:h-[420px] lg:h-[500px] rounded-lg overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-contain drop-shadow-[0_30px_60px_rgba(255,0,0,0.35)]"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Elegant Feature Strip Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 px-4 sm:px-6 py-2 sm:py-3"
            >
              <div className="flex items-center justify-center sm:justify-between gap-4 sm:gap-8 overflow-x-auto scrollbar-hide text-xs sm:text-sm">
                {slide.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-gray-200 whitespace-nowrap"
                  >
                    {iconForFeature(index)}
                    <span>{feature}</span>
                    {index < slide.features.length - 1 && (
                      <span className="hidden sm:inline text-gray-500">|</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Indicators */}
            {/* Indicators (hidden on mobile) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden sm:flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-white w-4"
                      : "bg-white/40 hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-5 order-2 lg:order-1">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block bg-red-600/20 text-red-400 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide"
          >
            Premium Qualität seit 2012
          </motion.span>

          <motion.h1
            key={slide.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="
    text-xl 
    sm:text-2xl 
    md:text-3xl 
    lg:text-4xl 
    xl:text-5xl 
    2xl:text-6xl 
    font-extrabold 
    leading-snug 
    sm:leading-tight
  "
          >
            {slide.title}
          </motion.h1>

          <motion.p
            key={slide.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-sm sm:text-base text-gray-300 max-w-md mx-auto lg:mx-0"
          >
            {slide.subtitle}
          </motion.p>

          {/* Guarantees */}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-3 sm:pt-4 w-full max-w-xs mx-auto sm:max-w-none"
          >
            <Link
              href={slide.cta.primary.href}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-red-600 to-red-800 
               hover:from-red-700 hover:to-red-900 rounded-lg shadow-md sm:shadow-lg 
               text-white font-semibold text-sm sm:text-base transition-all 
               hover:shadow-red-600/40 flex items-center justify-center gap-2"
            >
              {slide.cta.primary.text}
              <ArrowRight size={16} />
            </Link>

            <Link
              href={slide.cta.secondary.href}
              className="px-4 py-2 sm:px-6 sm:py-3 border border-red-600 text-white rounded-lg 
               font-semibold text-sm sm:text-base hover:bg-red-600/10 transition-all 
               flex items-center justify-center"
            >
              {slide.cta.secondary.text}
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-6"
          >
            {[
              "24 Monate Garantie",
              "+100 Fahrzeuge",
              "Persönliche Beratung",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs sm:text-sm text-gray-300"
              >
                <Check size={14} className="text-green-500" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Floating contact button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
      >
        <button
          onClick={() => setShowContactModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-800 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:shadow-red-600/40 transition-all active:scale-95"
        >
          <MessageSquare size={20} />
          {!isMobile && (
            <span className="text-sm md:text-base font-medium">Beratung</span>
          )}
        </button>
      </motion.div>

      {/* Contact Modal */}
      <SimpleContactFormModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </section>
  );
}
