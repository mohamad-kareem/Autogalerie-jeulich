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
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) setHasAnimated(true);
  }, [inView]);

  return (
    <section className="relative w-full py-10 px-4 sm:py-16 sm:px-6 lg:px-16 overflow-hidden bg-gray-50">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-20 h-20 sm:w-32 sm:h-32 bg-blue-400/20 rounded-full blur-xl sm:blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 sm:w-40 sm:h-40 bg-blue-400/20 rounded-full blur-xl sm:blur-3xl"></div>
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10"
      >
        {/* Text content */}
        <div className="space-y-6 md:space-y-8 order-2 md:order-1">
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-black to-blue-800 leading-snug md:leading-tight">
              Kaufen oder verkaufen Sie Autos – ganz nach Ihrem Wunsch
            </h2>
            <p className="text-gray-700 text-base md:text-lg">
              Einfach, transparent und fair – Ihr Auto, Ihre Entscheidung.
            </p>
          </div>

          {/* Feature items */}
          <div className="space-y-4 md:space-y-6">
            {/* Feature 1 */}
            <motion.div
              className="flex items-start space-x-3 p-3 sm:p-4 bg-white rounded-lg md:rounded-xl hover:bg-gray-200 transition-colors shadow"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-blue-200 rounded-md md:rounded-lg rotate-3 blur-sm" />
                <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-md md:rounded-lg shadow-md">
                  <FaCarAlt className="text-blue-950 text-lg sm:text-xl" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                  Entdecken Sie unsere Fahrzeugauswahl
                </h3>
                <p className="text-gray-700 mt-1 text-sm sm:text-base">
                  Stöbern Sie in hochwertigen neuen und gebrauchten Autos.
                  Finden Sie das ideale Fahrzeug für Sie.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              className="flex items-start space-x-3 p-3 sm:p-4 bg-white rounded-lg md:rounded-xl hover:bg-gray-200 transition-colors shadow"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-green-200 rounded-md md:rounded-lg -rotate-3 blur-sm" />
                <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-md md:rounded-lg shadow-md">
                  <MdSell className="text-blue-600 text-lg sm:text-xl" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                  Verkaufen Sie uns Ihr Auto
                </h3>
                <p className="text-gray-700 mt-1 text-sm sm:text-base">
                  Erhalten Sie ein schnelles, faires Angebot. Wir übernehmen
                  alle Formalitäten für Sie.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-1 md:pt-2">
            <Link href="/gebrauchtwagen" passHref>
              <Button
                size="md sm:lg"
                className="group flex items-center w-full sm:w-auto justify-center"
                bgColor="bg-gradient-to-r from-blue-950 to-blue-800"
                hoverColor="hover:from-blue-700 hover:to-blue-900"
              >
                <span>Jetzt entdecken</span>
                <IoIosArrowForward className="ml-2 text-base sm:text-lg transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/Autoverkaufen" passHref>
              <Button
                size="md sm:lg"
                className="group flex items-center w-full sm:w-auto justify-center"
                bgColor="bg-gradient-to-r from-slate-600 to-slate-800"
                hoverColor="hover:from-slate-700 hover:to-slate-900"
              >
                <span>Auto verkaufen</span>
                <IoIosArrowForward className="ml-2 text-base sm:text-lg transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Image section */}
        <motion.div
          className="relative flex justify-center order-1 md:order-2 mb-8 md:mb-0"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="relative w-full max-w-xl aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-lg md:shadow-2xl border-2 md:border-4 border-gray-300">
            <Image
              src={Marketing}
              alt="Illustration Auto kaufen und verkaufen"
              fill
              className="object-contain"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
            <div className="absolute  " />

            {/* Tag: Kaufen */}
            <motion.div
              className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white px-3 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg shadow-md border border-gray-200 -rotate-3 flex items-center space-x-1 sm:space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <FaSearch className="text-blue-600 text-base sm:text-xl" />
              <span className="text-xs sm:text-sm font-bold text-gray-800">
                Kaufen
              </span>
            </motion.div>

            {/* Tag: Verkaufen */}
            <motion.div
              className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white px-3 py-1 sm:px-4 sm:py-2 rounded-md sm:rounded-lg shadow-md border border-gray-200 rotate-3 flex items-center space-x-1 sm:space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <MdOutlineAttachMoney className="text-green-600 text-base sm:text-xl" />
              <span className="text-xs sm:text-sm font-bold text-gray-800">
                Verkaufen
              </span>
            </motion.div>

            {/* Blurblue circle effects */}
            <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-10 h-10 sm:w-16 sm:h-16 bg-blue-400/20 rounded-full blur-md"></div>
            <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-20 sm:h-20 bg-blue-400/20 rounded-full blur-md"></div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-40 sm:h-40 bg-blue-400/20 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none" />
    </section>
  );
}
