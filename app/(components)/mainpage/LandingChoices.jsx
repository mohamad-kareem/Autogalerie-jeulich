"use client";

import { motion } from "framer-motion";
import Button from "../helpers/Button";
import Link from "next/link";
import { Car, GitCompare, Search, Check } from "lucide-react";

export default function LandingChoices() {
  const features = [
    {
      icon: <Search className="text-red-700" size={20} />,
      title: "Bereit für eine neue Fahrt?",
      items: [
        "Sieh dir die neuesten Modelle an",
        "Vergleiche Fahrzeuge nebeneinander",
      ],
      buttonText: "🔍 Gebrauchtwagen suchen",
      link: "/gebrauchtwagen",
    },
    {
      icon: <GitCompare className="text-red-800" size={20} />,
      title: "Vergleiche Fahrzeuge ganz einfach",
      items: [
        "Modelle nebeneinander darstellen",
        "Unterschiede schnell erkennen",
      ],
      buttonText: "Vergleiche Autos ↔",
      link: "/vergleich",
    },
  ];

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    {feature.icon}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {feature.title}
                  </h2>
                </div>

                <ul className="text-gray-300 space-y-2 mb-6 text-sm sm:text-base flex-grow">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check
                        className="text-red-800 mt-0.5 flex-shrink-0"
                        size={16}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link href={feature.link} passHref>
                    <Button className="w-full sm:w-auto">
                      {feature.buttonText}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
    </section>
  );
}
