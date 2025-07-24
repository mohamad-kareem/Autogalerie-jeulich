"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CarImage from "../../(assets)/promo2.png";

export default function AdPromotion() {
  return (
    <section className="bg-gray-50 py-8 sm:py-10">
      <div className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden rounded-2xl shadow-2xl mx-3 sm:mx-4 my-10 border border-gray-800">
        <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-20 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 z-10 space-y-4 sm:space-y-6"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-xs sm:text-sm font-semibold mb-2 sm:mb-4">
              <span className="animate-pulse mr-1">🔥</span> LIMITIERTES ANGEBOT
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug tracking-tight">
              Sommer-Special:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
                Traumwagen sichern!
              </span>
            </h2>

            <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-md leading-relaxed">
              Jetzt Ihren Traumwagen sichern! Exklusive Sonderangebote auf
              geprüfte Premium-Fahrzeuge mit Vollausstattung und Garantie.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Link
                href="/gebrauchtwagen/68446995473b1608a4d56575"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-xl font-bold hover:from-amber-400 hover:to-amber-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/30 text-sm sm:text-base"
              >
                Angebote entdecken
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-6 py-3 sm:py-4 bg-transparent border-2 border-gray-700 text-white rounded-xl font-semibold hover:border-amber-500 hover:text-amber-400 transition-all duration-300 text-sm sm:text-base"
              >
                Jetzt kontaktieren
              </Link>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex-1 relative w-full max-w-sm sm:max-w-md md:max-w-lg h-64 sm:h-72 md:h-96 rounded-xl overflow-hidden border-2 border-gray-800 shadow-xl"
          >
            <Image
              src={CarImage}
              alt="Promoted car special offer"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              quality={90}
              unoptimized
            />

            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-black/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-amber-500/30">
              <p className="font-bold text-amber-400 text-xs sm:text-sm">
                + 1 Jahre Garantie
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-red-500/10 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
