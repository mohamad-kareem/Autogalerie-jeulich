"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Car, ShieldCheck, Settings, ArrowRight, Check } from "lucide-react";

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
      <Car size={16} className="text-red-500" />,
      <ShieldCheck size={16} className="text-red-500" />,
      <Settings size={16} className="text-red-500" />,
    ];
    return icons[index % icons.length];
  };

  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden flex items-center pt-20 md:pt-0">
      {/* Enhanced Dark Red Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-red-900/10">
        <motion.div
          className="absolute top-1/4 left-1/4 w-60 h-60 md:w-80 md:h-80 bg-red-600/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-60 h-60 md:w-80 md:h-80 bg-red-800/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
          }}
        />
      </div>

      {/* Digital Rain Effect - Reduced on mobile */}
      <div className="absolute inset-0 opacity-10 md:opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-red-400/30 text-xs md:text-sm font-mono"
            style={{
              left: `${5 + i * 6}%`,
              top: "-20px",
            }}
            animate={{
              y: ["0vh", "100vh"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          >
            {Math.random().toString(36).substring(2, 3)}
          </motion.div>
        ))}
      </div>

      {/* Main Content - Mobile first column layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col lg:grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
        {/* RIGHT SIDE - Larger Frame on Desktop */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative w-full order-1 lg:order-2"
        >
          {/* Main Display */}
          <div className="relative w-full max-w-lg mx-auto lg:max-w-none lg:ml-auto lg:mr-0 lg:w-full">
            {/* Outer Glow */}
            <motion.div
              className="absolute -inset-2 md:-inset-6 lg:-inset-8 bg-gradient-to-r from-red-600/20 to-red-800/20 rounded-xl md:rounded-2xl blur-lg lg:blur-xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />

            {/* Holographic Frame */}
            <div
              className="relative bg-gray-900/80 backdrop-blur-lg rounded-lg md:rounded-xl lg:rounded-2xl border border-red-500/40 shadow-xl md:shadow-2xl lg:shadow-3xl overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Cyber Header */}
              <div className="flex items-center justify-between px-3 md:px-4 lg:px-6 py-2 md:py-3 lg:py-4 border-b border-red-500/30 bg-gradient-to-r from-red-900/20 to-black/50">
                <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444] md:shadow-[0_0_6px_#ef4444] lg:shadow-[0_0_8px_#ef4444]" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-400 shadow-[0_0_4px_#f87171] md:shadow-[0_0_6px_#f87171] lg:shadow-[0_0_8px_#f87171]" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-300 shadow-[0_0_4px_#fca5a5] md:shadow-[0_0_6px_#fca5a5] lg:shadow-[0_0_8px_#fca5a5]" />
                </div>
                <div className="text-xs md:text-sm font-bold text-red-200 tracking-wider font-mono">
                  AUTOGALERIE JÜLICH
                </div>
                <div className="w-6 md:w-8 lg:w-10" />
              </div>

              {/* Holographic Stage - Larger on desktop */}
              <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 bg-gradient-to-br from-gray-900 via-black to-red-900/30 overflow-hidden">
                {/* Animated Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.15)_1px,transparent_1px)] bg-[size:20px_20px] md:bg-[size:30px_30px] lg:bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

                {/* Single Scan Line */}
                <motion.div
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"
                  animate={{
                    top: ["0%", "100%", "0%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Holographic Car */}
                <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 lg:p-8">
                  <div className="relative w-full h-32 sm:h-36 md:h-40 lg:h-52 xl:h-60">
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
                          className="object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] md:drop-shadow-[0_0_25px_rgba(220,38,38,0.5)] lg:drop-shadow-[0_0_35px_rgba(220,38,38,0.5)]"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    {/* Holographic Effect */}
                    <motion.div
                      className="absolute inset-0 bg-[linear-gradient(transparent_70%,rgba(220,38,38,0.1)_90%)] bg-[length:100%_3px]"
                      animate={{
                        backgroundPosition: ["0% 0%", "0% 100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </div>

                {/* Elegant Feature Strip Overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 px-3 md:px-4 lg:px-6 py-1.5 md:py-2 lg:py-3"
                >
                  <div className="flex items-center justify-center gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide text-xs md:text-sm">
                    {slide.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 lg:gap-2 text-gray-200 whitespace-nowrap"
                      >
                        {iconForFeature(index)}
                        <span className="text-xs md:text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Data Stream */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-4 md:h-6 lg:h-8 bg-gradient-to-t from-red-500/15 to-transparent"
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </div>
            </div>

            {/* Premium Badge */}
          </div>
        </motion.div>

        {/* LEFT CONTENT - Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-4 md:space-y-6 order-2 lg:order-1 text-center lg:text-left lg:pr-8"
        >
          {/* Holographic Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-900/40 backdrop-blur-lg border border-red-500/40 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_#ef4444]" />
            <span className="text-xs font-bold text-red-200 tracking-wide">
              Premium Qualität seit 2012
            </span>
          </motion.div>

          {/* Main Heading */}
          <div className="space-y-3 md:space-y-4">
            <motion.h1
              key={slide.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-bold leading-tight text-xl sm:text-2xl md:text-4xl "
            >
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                {slide.title.split(" ")[0]}
              </span>
              <br />
              <span className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
                {slide.title.split(" ").slice(1).join(" ")}
              </span>
            </motion.h1>

            <motion.p
              key={slide.subtitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-sm md:text-base lg:text-lg text-gray-300 max-w-md mx-auto lg:mx-0 leading-relaxed font-light"
            >
              {slide.subtitle}
            </motion.p>
          </div>

          {/* Holographic CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 pt-2 justify-center lg:justify-start"
          >
            <Link
              href={slide.cta.primary.href}
              className="group relative px-5 py-2.5 md:px-6 md:py-3 lg:px-4 lg:py-3.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 rounded-lg font-semibold text-sm md:text-base lg:text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                {slide.cta.primary.text}
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Link>

            <Link
              href={slide.cta.secondary.href}
              className="px-5 py-2.5 md:px-6 md:py-3 lg:px-7 lg:py-3.5 border border-red-500/40 hover:border-red-400 rounded-lg font-semibold text-sm md:text-base lg:text-lg backdrop-blur-lg bg-black/30 hover:bg-red-500/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] text-center"
            >
              {slide.cta.secondary.text}
            </Link>
          </motion.div>

          {/* Guarantees */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 pt-4 md:pt-6"
          >
            {[
              "24 Monate Garantie",
              "+100 Fahrzeuge",
              "Persönliche Beratung",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs md:text-sm lg:text-base text-gray-300"
              >
                <Check size={12} className="text-green-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
