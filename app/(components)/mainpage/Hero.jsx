"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Car, ShieldCheck, Settings } from "lucide-react";

import Bild2 from "../../(assets)/Hero2.jpeg";
import Bild3 from "../../(assets)/yes2.png";
import Bild4 from "../../(assets)/dacia4.png";

import Button from "../helpers/Button.jsx";
import InfoBar from "../InfoBar/Info";

const slides = [
  {
    image: Bild3,
    title: "Hochwertige Fahrzeuge",
    subtitle: "Entdecken Sie unsere exklusiven Fahrzeugmodelle",
    features: ["Finanzierung möglich", "TÜV-geprüft"],
    overlay:
      "linear-gradient(135deg, rgba(20,30,40,0.7) 0%, rgba(50,10,10,0.5) 100%)",
  },
  {
    image: Bild4,
    title: "Individuelle Finanzierung",
    subtitle: "Maßgeschneiderte Lösungen für Ihre Mobilitätsträume",
    features: ["12 Monate Garantie", "Sofort-Zusage"],
    overlay:
      "linear-gradient(135deg, rgba(10,20,40,0.7) 0%, rgba(30,10,50,0.5) 100%)",
  },
  {
    image: Bild2,
    title: "Premium Servicepakete",
    subtitle: "Rundum-sorglos-Pakete für Ihre Mobilität",
    features: ["+70 Fahrzeuge verfügbar"],
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered, currentSlide]);

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
        className="relative w-full h-[100dvh] sm:h-screen max-h-[1200px] overflow-hidden"
        ref={constraintsRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Background & Image */}
        <motion.div className="absolute inset-0" style={{ background }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <div className="relative w-full h-full">
                <Image
                  src={slides[currentSlide].image}
                  alt={`Slide ${currentSlide + 1}`}
                  fill
                  priority
                  quality={100}
                  sizes="100vw"
                  className="object-contain sm:object-cover object-center"
                />
              </div>
              <div
                className="absolute "
                style={{ background: slides[currentSlide].overlay }}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Text Content */}
        <div className="relative z-10 h-full flex items-center px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="container mx-auto">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="max-w-3xl lg:max-w-4xl xl:max-w-5xl"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="inline-flex items-center px-4 py-2 bg-white rounded-xl shadow-lg mb-4 sm:mb-6"
              >
                <span className="text-sm font-semibold tracking-wider text-black">
                  Premium Qualität
                </span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                {slides[currentSlide].title}
              </h1>

              <p className="text-lg sm:text-xl text-white/90 mb-6 max-w-2xl">
                {slides[currentSlide].subtitle}
              </p>

              <motion.div
                className="flex flex-wrap gap-3 sm:gap-4 mb-10"
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

              <motion.div
                className="flex flex-col sm:flex-row gap-3"
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

        {/* Slide Dots */}
        <motion.div
          className="flex absolute bottom-6 sm:bottom-8 left-0 right-0 justify-center gap-2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-6 bg-gradient-to-r from-red-400 to-red-600"
                  : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              whileHover={{ scaleY: 1.5 }}
            />
          ))}
        </motion.div>

        {/* Visual Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,50,50,0.1)_0%,_transparent_70%)] opacity-30" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent" />
        </div>

        {/* Cursor Glow */}
        <motion.div
          className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none"
          style={{
            x: useTransform(x, [0, 100], [-100, 100]),
            y: useMotionValue(0),
          }}
        />
      </section>

      {/* Info bar after hero */}
      <InfoBar />
    </>
  );
}
