"use client";
import Image from "next/image";
import Bild2 from "../(assets)/Hero2.jpeg";
import Bild3 from "../(assets)/yes2.png";
import Bild4 from "../(assets)/dacia4.png";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Car, ShieldCheck, Settings } from "lucide-react";
import Link from "next/link";
import Button from "./Button.jsx";
import InfoBar from "./InfoBar/Info";

const slides = [
  {
    image: Bild3,
    title: "Premium Fahrzeugflotte",
    subtitle: "Entdecken Sie unsere exklusiven Fahrzeugmodelle",
    features: ["0% Finanzierung möglich", "Sofort-Zusage"],
    overlay:
      "linear-gradient(135deg, rgba(20,30,40,0.7) 0%, rgba(50,10,10,0.5) 100%)",
  },
  {
    image: Bild4,
    title: "Individuelle Finanzierung",
    subtitle: "Maßgeschneiderte Lösungen für Ihre Mobilitätsträume",
    features: ["+200 Fahrzeuge verfügbar", "12 Monate Garantie", "TÜV-geprüft"],
    overlay:
      "linear-gradient(135deg, rgba(10,20,40,0.7) 0%, rgba(30,10,50,0.5) 100%)",
  },
  {
    image: Bild2,
    title: "Premium Servicepakete",
    subtitle: "Rundum-sorglos-Pakete für Ihre Mobilität",
    features: ["Kostenlose Inspektion", "Mietwagen-Service", "24h Pannenhilfe"],
    overlay:
      "linear-gradient(135deg, rgba(30,20,30,0.7) 0%, rgba(10,30,40,0.5) 100%)",
  },
];

const FeatureIcon = ({ icon, text }) => (
  <motion.div
    className="flex items-center gap-2"
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
      {icon}
    </div>
    <span className="text-sm md:text-base text-white/90">{text}</span>
  </motion.div>
);

export default function UltraModernHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const xInput = [-100, 0, 100];
  const background = useTransform(x, xInput, [
    "linear-gradient(135deg, #0e1a25 0%, #2a0a0a 100%)",
    "linear-gradient(135deg, #0a1428 0%, #1e0a32 100%)",
    "linear-gradient(135deg, #1e141e 0%, #0a1e28 100%)",
  ]);

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered, currentSlide]);

  // Parallax effect for mouse movement
  const handleMouseMove = (e) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const xPos = (e.clientX - left) / width;
    x.set(xPos * 100 - 50);
  };

  return (
    <>
      <Head>
        <title>Home | Auto Galerie Jülich</title>
        <meta name="robots" content="index,follow" />
        <meta
          name="description"
          content="Auto Galerie Jülich – Beste Gebrauchtwagen in NRW."
        />
      </Head>
      <section
        className="relative w-full h-screen sm:h-[90vh] max-h-[1200px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        ref={constraintsRef}
      >
        {/* Dynamic Background */}
        <motion.div className="absolute inset-0" style={{ background }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.43, 0.13, 0.23, 0.96] }}
              className="absolute inset-0"
            >
              <div className="relative w-full h-full">
                <Image
                  src={slides[currentSlide].image}
                  alt={`Slide ${currentSlide + 1}`}
                  fill
                  priority
                  quality={100}
                  className="object-cover object-center"
                  sizes="100vw"
                />
              </div>

              <div
                className="absolute inset-0"
                style={{
                  background: slides[currentSlide].overlay,
                }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Content Container */}
        <div className="relative z-10 h-full flex items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.4,
                duration: 0.8,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
              className="max-w-3xl lg:max-w-4xl xl:max-w-5xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-lg sm:rounded-xl mb-4 sm:mb-6 shadow-lg"
              >
                <span className="text-xs sm:text-sm font-semibold tracking-wider text-black">
                  PREMIUM AUTOHANDEL
                </span>
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {slides[currentSlide].title}
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl">
                {slides[currentSlide].subtitle}
              </p>

              {/* Features */}
              <motion.div
                className="flex flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {slides[currentSlide].features.map((feature, i) => (
                  <FeatureIcon
                    key={i}
                    icon={
                      i === 0 ? (
                        <Car size={16} className="text-red-500" />
                      ) : i === 1 ? (
                        <ShieldCheck size={16} className="text-red-500" />
                      ) : (
                        <Settings size={16} className="text-red-500" />
                      )
                    }
                    text={feature}
                  />
                ))}
              </motion.div>

              {/* Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button>
                  <Link href="/gebrauchtwagen">
                    <span>Fahrzeuge entdecken</span>
                  </Link>
                </Button>
                <Button>
                  <Link href="/kontakt">
                    <span>Beratungstermin</span>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Slide Indicators */}
        <motion.div
          className="flex absolute bottom-6 sm:bottom-8 md:bottom-10 left-0 right-0 justify-center gap-2 sm:gap-3 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-6 sm:w-8 bg-gradient-to-r from-red-400 to-red-600"
                  : "w-2 sm:w-3 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              whileHover={{ scaleY: 1.5 }}
            />
          ))}
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,50,50,0.1)_0%,_transparent_70%)] opacity-30" />
          <div className="absolute bottom-0 left-0 w-full h-32 sm:h-48 bg-gradient-to-t from-black to-transparent" />

          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Micro-interaction cursor follower */}
        <motion.div
          className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none"
          style={{
            x: useTransform(x, [0, 100], [-100, 100]),
            y: useMotionValue(0),
          }}
        />
      </section>
      <InfoBar />
    </>
  );
}
