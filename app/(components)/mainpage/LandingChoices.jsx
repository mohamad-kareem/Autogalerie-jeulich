"use client";

import { motion } from "framer-motion";
import Button from "../helpers/Button";
import Link from "next/link";
import { Car, GitCompare, Search, Check } from "lucide-react";
import Image from "next/image";
import ch from "@/app/(assets)/ch.png";
import ch1 from "@/app/(assets)/ch1.png";

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
      image: ch,
      alt: "Person searching for cars online",
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
      image: ch1,
      alt: "Two cars being compared",
    },
  ];

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-16 overflow-hidden">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto relative z-10">
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
              className="backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              {/* Decorative elements */}
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-red-500/10 blur-xl group-hover:bg-red-500/20 transition-all duration-500" />

              <div className="flex flex-col h-full md:flex-row md:items-center gap-6">
                <div className="flex-1 z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors duration-300">
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
                          className="text-red-800 mt-0.5 flex-shrink-0 group-hover:text-red-600 transition-colors duration-300"
                          size={16}
                        />
                        <span className="group-hover:text-white transition-colors duration-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto z-10">
                    <Link href={feature.link} passHref>
                      <Button className="w-full sm:w-auto group-hover:bg-red-700 transition-colors duration-300">
                        {feature.buttonText}
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Enhanced Image container */}
                <motion.div
                  className="bg-neutral-950 hidden md:block relative w-44 h-44 flex-shrink-0 rounded-xl overflow-hidden border border-gray-700/20 shadow-lg group-hover:shadow-red-500/20 transition-all duration-500"
                  whileHover={{ scale: 1.05 }}
                >
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    className="object-cover group-hover:scale-105 transition-transform duration-500 pt-8"
                    sizes="(max-width: 768px) 100vw, 176px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
                </motion.div>
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
