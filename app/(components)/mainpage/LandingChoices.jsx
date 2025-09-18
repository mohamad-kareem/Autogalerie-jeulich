"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  GitCompare,
  Check,
  ArrowRight,
  MapPin,
  Shield,
  Car,
  Users,
} from "lucide-react";
import Image from "next/image";
import Bild2 from "../../(assets)/boora.jpeg";

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
      color: "bg-gradient-to-r from-red-800 to-red-700",
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
      color: "bg-gradient-to-r from-gray-700 to-gray-800",
    },
  ];

  return (
    <section className="relative w-full bg-white py-10 sm:py-14 px-3 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f5f5f5_1px,transparent_1px),linear-gradient(to_bottom,#f5f5f5_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] opacity-20" />

      {/* Decorative elements */}
      <div className="absolute top-10 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-red-500/5 rounded-full blur-2xl sm:blur-3xl" />
      <div className="absolute bottom-10 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-gray-500/5 rounded-full blur-2xl sm:blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-10 sm:mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[10px] sm:text-xs font-medium text-red-700 mb-3 sm:mb-5"
          >
            Smart. Einfach. Zuverlässig.
          </motion.div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-5">
            Ihr Weg zum <span className="text-red-800">perfekten Fahrzeug</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl sm:max-w-2xl mx-auto">
            Moderne Lösungen für einen stressfreien Autokauf und -verkauf.
          </p>
        </motion.div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-8">
          {/* Services */}
          <div className="w-full lg:w-2/5 space-y-5">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`p-2.5 rounded-lg ${service.color} text-white shadow-sm flex-shrink-0`}
                    >
                      <service.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        {service.title}
                      </h3>
                      <ul className="space-y-1.5 mb-3 sm:mb-4">
                        {service.highlights.map((point, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-800 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-700">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={service.link}
                        className="inline-flex items-center font-medium text-red-800 hover:text-red-700 transition-colors group/link text-xs sm:text-sm"
                      >
                        <span className="border-b border-transparent group-hover/link:border-red-800 transition-all pb-0.5">
                          {service.cta}
                        </span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Image section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="w-full lg:w-3/5 relative rounded-lg overflow-hidden shadow-md min-h-[220px] sm:min-h-[350px]"
          >
            <Image
              src={Bild2}
              alt="Premium Fahrzeugausstellung"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              quality={85}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 text-white">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="p-1 bg-red-800/90 backdrop-blur-sm rounded-md">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium bg-gray-900/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                  Jülich
                </span>
              </div>

              <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3">
                Besuchen Sie unsere exklusive Ausstellung
              </h3>

              <Link
                href="/kontakt"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-gray-900 font-medium rounded-md transition hover:bg-gray-100 shadow-sm text-xs sm:text-sm"
              >
                Standort entdecken
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10 sm:mt-14"
        >
          <div className="relative bg-black rounded-lg sm:rounded-xl overflow-hidden py-4 sm:py-4 px-4 sm:px-6 text-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

            <div className="relative z-10 max-w-xl mx-auto">
              <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-4">
                Individuelle Beratung gewünscht?
              </h3>
              <p className="text-gray-300 mb-4 sm:mb-6 text-xs sm:text-sm">
                Unsere Experten helfen Ihnen bei der Auswahl des perfekten
                Fahrzeugs
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-medium rounded-md transition shadow-sm hover:shadow text-xs sm:text-base"
                >
                  Termin vereinbaren
                </Link>
                <Link
                  href="/gebrauchtwagen"
                  className="inline-flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-md transition backdrop-blur-sm text-xs sm:text-base"
                >
                  Angebote ansehen
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
