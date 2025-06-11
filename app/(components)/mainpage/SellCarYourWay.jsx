"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaSearch, FaCarAlt } from "react-icons/fa";
import { MdOutlineAttachMoney, MdSell } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import Image from "next/image";
import Marketing from "../../(assets)/Marketing.png";
import Button from "../helpers/Button";
import Link from "next/link";

export default function SellCarYourWay() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) {
      setHasAnimated(true);
    }
  }, [inView]);

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-16 overflow-hidden bg-black pt-30 pb-30">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10"
      >
        {/* Text Block */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-red-800 leading-tight">
              Kaufen oder verkaufen Sie Autos – ganz nach Ihrem Wunsch
            </h2>
            <p className="text-gray-300 text-lg">
              Einfach, transparent und fair - Ihr Auto, Ihre Entscheidung
            </p>
          </div>

          {/* Features Container */}
          <div className="space-y-6">
            {/* Feature: Browse */}
            <motion.div
              className="flex items-start space-x-4 p-4 bg-gray-900/30 rounded-xl hover:bg-gray-800/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-red-500/20 rounded-lg rotate-3 blur-sm" />
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-md">
                  <FaCarAlt className="text-red-600 text-xl" />
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Entdecken Sie unsere Fahrzeugauswahl
                </h3>
                <p className="text-gray-300 mt-2">
                  Stöbern Sie in hochwertigen neuen und gebrauchten Autos.
                  Finden Sie das ideale Fahrzeug für Sie.
                </p>
              </div>
            </motion.div>

            {/* Feature: Sell */}
            <motion.div
              className="flex items-start space-x-4 p-4 bg-gray-900/30 rounded-xl hover:bg-gray-800/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-green-500/20 rounded-lg -rotate-3 blur-sm" />
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-md">
                  <MdSell className="text-green-600 text-xl" />
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Verkaufen Sie uns Ihr Auto
                </h3>
                <p className="text-gray-300 mt-2">
                  Erhalten Sie ein schnelles, faires Angebot. Wir übernehmen
                  alle Formalitäten für Sie.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/gebrauchtwagen" passHref>
              <Button
                size="lg"
                className="group flex items-center"
                bgColor="bg-gradient-to-r from-red-600 to-red-800"
                hoverColor="hover:from-red-700 hover:to-red-900"
              >
                <span>Jetzt entdecken</span>
                <IoIosArrowForward className="ml-2 text-lg transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/Autoverkaufen" passHref>
              <Button
                size="lg"
                className="group flex items-center"
                bgColor="bg-gradient-to-r from-green-600 to-green-800"
                hoverColor="hover:from-green-700 hover:to-green-900"
              >
                <span>Auto verkaufen</span>
                <IoIosArrowForward className="ml-2 text-lg transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Image Illustration */}
        <motion.div
          className="relative flex justify-center"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="relative w-full max-w-xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-900 ml-15">
            <Image
              src={Marketing}
              alt="Illustration Auto kaufen und verkaufen"
              fill
              className="object-contain"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Interactive tags */}
            <motion.div
              className="absolute bottom-6 left-6 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 -rotate-3 flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <FaSearch className="text-red-600 text-xl" />
              <span className="text-sm font-bold text-gray-800">Kaufen</span>
            </motion.div>

            <motion.div
              className="absolute top-6 right-6 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 rotate-3 flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <MdOutlineAttachMoney className="text-green-600 text-xl" />
              <span className="text-sm font-bold text-gray-800">Verkaufen</span>
            </motion.div>

            {/* Floating car elements */}
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-red-400/20 rounded-full blur-md"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-400/20 rounded-full blur-md"></div>
          </div>
        </motion.div>
      </motion.div>

      {/* Glow Effects */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-gradient-to-r from-red-500/20 to-red-500/20 rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}
