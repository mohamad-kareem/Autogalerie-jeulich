"use client";
import Image from "next/image";
import Bild1 from "../(assets)/dacia.jpg";
import Bild2 from "../(assets)/Hero2.jpeg";
import Bild3 from "../(assets)/plate.png";
import Bild4 from "../(assets)/www.png";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Phone, MapPin, Mail } from "lucide-react";
import Link from "next/link";
const dias = [
  {
    image: Bild2,
    title: "Dein Autohaus",
    subtitle: "Finden Sie Ihr perfektes Auto aus unserer Auswahl",
  },
  {
    image: Bild3,
    title: "Außergewöhnlicher Kundenservice",
    subtitle: "Erleben Sie automobilen Service auf höchstem Niveau",
  },
];

export default function StartseiteHeld() {
  const [index, setzeIndex] = useState(0);
  const [istÜberfahren, setzeIstÜberfahren] = useState(false);

  // Automatisches Wechseln der Dias
  useEffect(() => {
    const intervall = setInterval(() => {
      if (!istÜberfahren) {
        nächstesDia();
      }
    }, 5000);
    return () => clearInterval(intervall);
  }, [istÜberfahren]);

  const nächstesDia = () => setzeIndex((vorher) => (vorher + 1) % dias.length);
  const vorherigesDia = () =>
    setzeIndex((vorher) => (vorher - 1 + dias.length) % dias.length);

  return (
    <section
      className="relative w-full h-screen max-h-[90vh] overflow-hidden mb-15"
      onMouseEnter={() => setzeIstÜberfahren(true)}
      onMouseLeave={() => setzeIstÜberfahren(false)}
    >
      {/* Hintergrund-Diashow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <Image
            src={dias[index].image}
            alt={`Dia ${index + 1}`}
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Textüberlagerung */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Textinhalt */}
        <div className="container mx-auto px-6 pt-24 sm:pt-32 md:pt-40">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {dias[index].title}
            </h1>
            <p className="text-xs sm:text-lg text-white/90 mb-8">
              {dias[index].subtitle}
            </p>
            <div className="flex gap-4">
              <div className="flex gap-4">
                <Link
                  href="/gebrauchtwagen"
                  className="px-8 py-3 bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-800 text-white font-medium rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  Jetzt ansehen
                </Link>
                <Link
                  href="/kontakt"
                  className="px-4 py-3 bg-transparent border-2 border-white text-white font-medium rounded-full hover:bg-white hover:text-black transition-all duration-300"
                >
                  Kontaktieren Sie uns
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Kontaktleiste */}
        {/* <div className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm"> */}
        <div className="bg-black backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-800 rounded-full">
                <MapPin className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-white/80">Besuchen Sie uns</p>
                <p className="text-white font-medium">
                  Alte Dürenerstraße 4, 52428 Jülich
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-800 rounded-full">
                <Phone className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-white/80">Rufen Sie uns an</p>
                <p className="text-white font-medium">+49 2461 9163780</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-800 rounded-full">
                <Mail className="text-white" size={20} />
              </div>
              <div>
                <p className="text-sm text-white/80">Schreiben Sie uns</p>
                <p className="text-white font-medium">
                  info@autogalerie-juelich.de
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigationspfeile */}
      <div className="absolute bottom-1/6 left-4 right-4 flex justify-between items-center z-50 pointer-events-none">
        <button
          onClick={vorherigesDia}
          className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-600 rounded-full transition-all duration-300 transform hover:scale-110 pointer-events-auto"
          aria-label="Vorheriges Dia"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>

        <button
          onClick={nächstesDia}
          className="w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-red-600 rounded-full transition-all duration-300 transform hover:scale-110 pointer-events-auto"
          aria-label="Nächstes Dia"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      </div>

      {/* Dia-Indikatoren */}
      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-20">
        {dias.map((_, i) => (
          <button
            key={i}
            onClick={() => setzeIndex(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === index
                ? "bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-800"
                : "bg-white/50"
            }`}
            aria-label={`Zu Dia ${i + 1} wechseln`}
          />
        ))}
      </div>
    </section>
  );
}
