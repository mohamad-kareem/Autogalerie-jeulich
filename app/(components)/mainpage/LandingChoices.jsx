"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, GitCompare, Check, ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Bild2 from "../../(assets)/Hero2.jpeg";

export default function LandingChoices() {
  const services = [
    {
      icon: Search,
      title: "Bereit für eine neue Fahrt?",

      highlights: [
        "500+ TÜV-geprüfte Fahrzeuge",

        "Transparente Preise & Finanzierung",
      ],
      cta: "Fahrzeuge entdecken",
      link: "/gebrauchtwagen",
    },
    {
      icon: GitCompare,
      title: "Vergleichen Sie Fahrzeuge",

      highlights: [
        "Individuelle Ausstattungsvergleiche",
        "Experten-Empfehlungen",
      ],
      cta: "Vergleich starten",
      link: "/vergleich",
    },
  ];

  return (
    <section className="relative w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50  overflow-hidden">
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-5 pointer-events-none" />

      <div className="relative max-w-screen-xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Der einfach Weg zum{" "}
            <span className="text-red-800">richtigen Auto</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Entdecke smarte Werkzeuge für einen reibungslosen Autokauf und
            -verkauf.
          </p>
        </motion.div>

        {/* Split Layout: Cards on left, Image on right */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cards Column */}
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="group bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className="p-6 sm:p-6 flex flex-col gap-4 h-full">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-900/10 rounded-lg">
                      <service.icon className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg sm:text-3xl font-semibold text-gray-900">
                      {service.title}
                    </h3>
                  </div>

                  <ul className="space-y-2 text-sm sm:text-lg text-gray-700">
                    {service.highlights.map((point, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-4 h-4 text-red-600 mr-2 mt-1 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <Link
                      href={service.link}
                      className="inline-flex items-center text-red-600 hover:text-red-700 font-medium transition group text-sm sm:text-base"
                    >
                      {service.cta}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden shadow-lg w-full lg:w-1/2 min-h-[360px] sm:min-h-[420px]"
          >
            <Image
              src={Bild2}
              alt="Premium Fahrzeugausstellung"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              quality={85}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-red-300" />
                <span className="text-sm font-medium text-red-200">Jülich</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                Besuchen Sie unsere exklusive Ausstellung
              </h3>

              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-medium rounded-lg transition"
              >
                Standort entdecken
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6 bg-white rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto">
            <div className="text-left">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                Individuelle Beratung gewünscht?
              </h4>
              <p className="text-sm sm:text-base text-gray-600">
                Unsere Experten helfen Ihnen bei der Auswahl
              </p>
            </div>
            <Link
              href="/kontakt"
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-medium rounded-lg transition"
            >
              Termin vereinbaren
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
