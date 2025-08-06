"use client";
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import OpelImage from "../../(assets)/opelad.png";

export default function OpelPremiumAd() {
  return (
    <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMGYwZjAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 pointer-events-none"></div>

      <div className="relative max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-px bg-gray-300"></div>
            <span className="text-gray-500 font-medium text-sm tracking-widest uppercase">
              Premium Kollektion
            </span>
            <div className="w-12 h-px bg-gray-300"></div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-4">
            Die Essenz von <span className="font-semibold">Opel</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Deutsche Ingenieurskunst in Perfektion. Entdecken Sie unsere
            exklusive Auswahl an Fahrzeugen für höchste Ansprüche.
          </p>
        </motion.div>

        {/* Main content */}
        <div className="bg-gray-50 rounded-none overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative h-72 sm:h-96 lg:h-[500px]"
            >
              <Image
                src={OpelImage}
                alt="Opel Premium Fahrzeuge"
                fill
                className="object-fill"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Overlay */}

              {/* Badge */}
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-center"
            >
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-3xl font-light text-gray-900 mb-5 sm:mb-6">
                  Präzision trifft auf{" "}
                  <span className="font-semibold">Luxus</span>
                </h3>

                <p className="text-gray-600 mb-8 text-sm sm:text-base">
                  Unsere Opel Premium Kollektion steht für höchste Qualität.
                  Jedes Fahrzeug wird sorgfältig ausgewählt und geprüft, um
                  unseren Standards zu entsprechen.
                </p>

                {/* Feature grid */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-10 sm:mb-12">
                  <div>
                    <h4 className=" text-xs sm:text-sm font-medium text-gray-900 mb-1">
                      12 Monate Garantie
                    </h4>
                    <p className="text-gray-500 text-xs">Umfassender Schutz</p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                      Premium Auswahl
                    </h4>
                    <p className="text-gray-500 text-xs">
                      Sorgfältig ausgewählt
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                      Effiziente Leistung
                    </h4>
                    <p className="text-gray-500 text-xs">Geringer Verbrauch</p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                      Exklusiver Service
                    </h4>
                    <p className="text-gray-500 text-xs">
                      Persönliche Betreuung
                    </p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/gebrauchtwagen/689393c6576dad3d00c02f38"
                    className="px-6 sm:px-8 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-none transition-all duration-300 flex items-center justify-center gap-2 group text-sm sm:text-base"
                  >
                    entdecken
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/kontakt"
                    className="px-6 sm:px-8 py-3 bg-transparent border border-gray-300 hover:border-black text-gray-800 hover:text-black font-medium rounded-none transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
                  >
                    Beratung anfragen
                  </Link>
                </div>
              </div>

              {/* Testimonial */}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
