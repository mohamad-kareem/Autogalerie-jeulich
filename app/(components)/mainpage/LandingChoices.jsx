"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  GitCompare,
  Check,
  ArrowRight,
  MapPin,
  Car,
  Users,
  Shield,
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
      color: "bg-gradient-to-r from-red-700 to-red-900",
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
      color: "bg-gradient-to-r from-gray-700 to-gray-900",
    },
  ];

  return (
    <section className="relative w-full bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-red-900/5 to-gray-900/5" />
      <div className="absolute top-40 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading with improved typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800 mb-4">
            Smart. Einfach. Zuverlässig.
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
            Ihr Weg zum{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-red-900">
              perfekten Fahrzeug
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            Moderne Lösungen für einen stressfreien Autokauf und -verkauf.
          </p>
        </motion.div>

        {/* Main content - reversed layout */}
        <div className="flex flex-col lg:flex-row-reverse gap-10 lg:gap-16">
          {/* Cards Column */}
          <div className="flex flex-col gap-8 w-full lg:w-1/2">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="absolute top-0 left-0 w-2 h-full group-hover:w-full transition-all duration-500 ease-out ${service.color} opacity-10 group-hover:opacity-20" />

                <div className="relative p-8 flex flex-col gap-5 h-full">
                  <div className="flex items-start gap-5">
                    <div
                      className={`p-3 rounded-xl ${service.color} text-white shadow-md flex-shrink-0`}
                    >
                      <service.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {service.title}
                      </h3>
                      <ul className="space-y-3 text-gray-700">
                        {service.highlights.map((point, i) => (
                          <li key={i} className="flex items-start">
                            <div className="bg-red-100 rounded-full p-0.5 mt-0.5 mr-3 flex-shrink-0">
                              <Check className="w-4 h-4 text-red-700" />
                            </div>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={service.link}
                      className="inline-flex items-center font-medium transition group text-red-700 hover:text-red-900"
                    >
                      <span className="mr-2 bg-gradient-to-r from-red-700 to-red-900 bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-all group-hover:bg-[length:100%_2px] pb-1">
                        {service.cta}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
            className="relative rounded-2xl overflow-hidden shadow-2xl w-full lg:w-1/2 min-h-[420px] sm:min-h-[500px]"
          >
            <Image
              src={Bild2}
              alt="Premium Fahrzeugausstellung"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              quality={90}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-red-700/30 backdrop-blur-sm rounded-lg">
                  <MapPin className="w-4 h-4 text-red-300" />
                </div>
                <span className="text-sm font-medium text-red-200 bg-red-900/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  Jülich
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                Besuchen Sie unsere exklusive Ausstellung
              </h3>
              <p className="text-gray-200 mb-5 max-w-md">
                Erleben Sie unsere Premium-Fahrzeuge persönlich und erhalten Sie
                eine professionelle Beratung vor Ort.
              </p>

              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 text-base font-medium rounded-lg transition hover:bg-gray-100 shadow-md"
              >
                Standort entdecken
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Enhanced CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-black py-12 px-8 shadow-xl">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gray-600/20 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h4 className="text-2xl font-bold text-white mb-3">
                Individuelle Beratung gewünscht?
              </h4>
              <p className="text-gray-300 mb-6">
                Unsere Experten helfen Ihnen bei der Auswahl des perfekten
                Fahrzeugs
              </p>
              <Link
                href="/kontakt"
                className="inline-flex items-center px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-medium rounded-lg transition shadow-md hover:shadow-lg"
              >
                Kostenlosen Termin vereinbaren
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
