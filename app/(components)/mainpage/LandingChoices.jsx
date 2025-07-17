"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, GitCompare, Check, ArrowRight } from "lucide-react";
import Image from "next/image";
import Bild2 from "../../(assets)/Hero2.jpeg";

export default function LandingChoices() {
  const services = [
    {
      icon: Search,
      title: "Bereit für eine neue Fahrt?",
      highlights: [
        "500+ geprüfte Autos",
        "Neueste Modelle entdecken",
        "Top Preise sichern",
      ],
      cta: "Fahrzeuge ansehen",
      link: "/gebrauchtwagen",
    },
    {
      icon: GitCompare,
      title: "Vergleiche Fahrzeuge ganz einfach",
      highlights: [
        "Technik auf einen Blick",
        "Unterschiede sofort sehen",
        "Modelle direkt vergleichen",
      ],
      cta: "Fahrzeuge vergleichen",
      link: "/vergleich",
    },
  ];

  return (
    <section className="w-full bg-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
          >
            Der einfache Weg zum{" "}
            <span className="text-red-600">richtigen Auto</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-3 text-gray-600 text-base sm:text-lg max-w-xl mx-auto"
          >
            Entdecke smarte Werkzeuge für einen stressfreien Autokauf.
          </motion.p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Image Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden shadow-md"
          >
            <div className="relative w-full h-64 sm:h-80 md:h-full">
              <Image
                src={Bild2}
                alt="Autoausstellung"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-4 left-4 text-white z-10">
                <h3 className="text-lg sm:text-3xl font-semibold">
                  Besuche unseren Showroom
                </h3>
              </div>
            </div>
          </motion.div>

          {/* Service Cards */}
          <div className="flex flex-col gap-6">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="p-5 sm:p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-red-100 text-red-600 rounded-md">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <ul className="space-y-1 mb-3">
                      {service.highlights.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start text-sm text-gray-700"
                        >
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-[2px]" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={service.link}
                      className="inline-flex items-center text-red-600 hover:text-red-700 font-medium transition"
                    >
                      {service.cta}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
