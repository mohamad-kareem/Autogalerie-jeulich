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
      icon: <Search className="text-red-600" size={20} />,
      title: "Bereit für eine neue Fahrt?",
      items: [
        "Sieh dir die neuesten Modelle an",
        "Vergleiche Fahrzeuge nebeneinander",
      ],
      buttonText: "🔍 Gebrauchtwagen suchen",
      link: "/gebrauchtwagen",
      image: ch1,
      alt: "Person searching for cars online",
      accentColor: "red",
    },
    {
      icon: <GitCompare className="text-blue-600" size={20} />,
      title: "Vergleiche Fahrzeuge ganz einfach",
      items: [
        "Modelle nebeneinander darstellen",
        "Unterschiede schnell erkennen",
      ],
      buttonText: "Vergleiche Autos ↔",
      link: "/vergleich",
      image: ch,
      alt: "Two cars being compared",
      accentColor: "blue",
    },
  ];

  return (
    <section className="relative w-full py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-0 overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-15 lg:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Entdecken Sie unsere{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-black">
              Premium-Services
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Finden Sie Ihr perfektes Fahrzeug mit unseren exklusiven Tools
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-y-8 gap-x-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative group rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 hover:border-gray-200"
            >
              {/* Decorative top stripe */}
              <div
                className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-${feature.accentColor}-500 to-${feature.accentColor}-300 rounded-t-xl`}
              />

              <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-8 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg shadow-sm bg-${feature.accentColor}-50`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                      {feature.title}
                    </h3>
                  </div>

                  <ul className="text-gray-600 space-y-2.5 mb-6 text-base sm:text-lg">
                    {feature.items.map((item, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-3"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Check
                          className={`mt-1 flex-shrink-0 text-${feature.accentColor}-600 group-hover:scale-110 transition-all duration-300`}
                          size={16}
                        />
                        <span className="group-hover:text-gray-900 transition-colors duration-300">
                          {item}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <Link href={feature.link} passHref>
                    <Button>{feature.buttonText}</Button>
                  </Link>
                </div>

                <motion.div
                  className="hidden md:block relative w-44 h-44 lg:w-52 lg:h-52 rounded-lg overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md transition-all duration-500"
                  whileHover={{ scale: 1.05 }}
                >
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-white/5 to-transparent" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Subtle decorative backgrounds */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent -z-10" />
    </section>
  );
}
