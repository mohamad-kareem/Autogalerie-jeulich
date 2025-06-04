"use client";

import { motion } from "framer-motion";
import Button from "../helpers/Button";
import Link from "next/link";
import { Search, GitCompare, Check } from "lucide-react";
import Image from "next/image";
import ch from "@/app/(assets)/ch.png";
import ch1 from "@/app/(assets)/ch1.png";

export default function LandingChoices() {
  const features = [
    {
      icon: <Search className="text-red-700" size={18} />,
      title: "Bereit für eine neue Fahrt?",
      items: [
        "Sieh dir die neuesten Modelle an",
        "Vergleiche Fahrzeuge nebeneinander",
      ],
      buttonText: "🔍 Gebrauchtwagen suchen",
      link: "/gebrauchtwagen",
      image: ch1,
      alt: "Person searching for cars online",
    },
    {
      icon: <GitCompare className="text-red-800" size={18} />,
      title: "Vergleiche Fahrzeuge ganz einfach",
      items: [
        "Modelle nebeneinander darstellen",
        "Unterschiede schnell erkennen",
      ],
      buttonText: "Vergleiche Autos ↔",
      link: "/vergleich",
      image: ch,
      alt: "Two cars being compared",
    },
  ];

  return (
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-12 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 14 }}
              className="relative group border border-gray-800/50 rounded-lg p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm"
            >
              {/* Subtle Decorative Circle */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-red-500/10 blur-2xl rounded-full group-hover:bg-red-500/20 transition-all duration-500" />

              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1 z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-red-500/10 rounded-md group-hover:bg-red-500/20 transition">
                      {feature.icon}
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      {feature.title}
                    </h2>
                  </div>

                  <ul className="text-gray-300 space-y-1.5 mb-5 text-sm sm:text-base">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check
                          className="text-red-800 mt-0.5 flex-shrink-0 group-hover:text-red-600 transition-colors duration-300"
                          size={14}
                        />
                        <span className="group-hover:text-white transition-colors duration-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={feature.link} passHref>
                    <Button className="w-full sm:w-auto text-sm sm:text-base group-hover:bg-red-700 transition-colors duration-300">
                      {feature.buttonText}
                    </Button>
                  </Link>
                </div>

                <motion.div
                  className="hidden md:block relative w-40 h-40 rounded-lg overflow-hidden border border-gray-700/20 shadow group-hover:shadow-red-500/20 transition-all duration-500"
                  whileHover={{ scale: 1.03 }}
                >
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Glow background accents */}
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
    </section>
  );
}
