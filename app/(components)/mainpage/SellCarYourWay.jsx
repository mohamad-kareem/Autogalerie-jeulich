"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { FaSearch } from "react-icons/fa";
import { MdOutlineAttachMoney } from "react-icons/md";
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
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-16 mb-12 overflow-hidden bg-black">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center"
      >
        {/* Text Block */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
            Kaufen oder verkaufen Sie Autos – ganz nach Ihrem Wunsch
          </h2>

          {/* Feature: Browse */}
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-red-100 rounded-lg rotate-3 opacity-30" />
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <FaSearch className="text-red-600 text-lg sm:text-xl" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Entdecken Sie unsere Fahrzeugauswahl
              </h3>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Stöbern Sie in hochwertigen neuen und gebrauchten Autos. Finden
                Sie das ideale Fahrzeug für Sie.
              </p>
            </div>
          </div>

          {/* Feature: Sell */}
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-100 rounded-lg -rotate-3 opacity-30" />
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <MdOutlineAttachMoney className="text-green-600 text-lg sm:text-xl" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Verkaufen Sie uns Ihr Auto
              </h3>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Erhalten Sie ein schnelles, faires Angebot. Wir übernehmen alle
                Formalitäten für Sie.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/gebrauchtwagen" passHref>
              <Button size="lg" className="group">
                Jetzt entdecken
                <IoIosArrowForward className="ml-2 text-lg transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/Autoverkaufen" passHref>
              <Button
                size="lg"
                bgColor="bg-white"
                textColor="text-black"
                hoverColor="hover:bg-red-950"
                className="group"
              >
                Auto verkaufen
                <IoIosArrowForward className="ml-2 text-lg transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Image Illustration */}
        <div className="flex justify-center lg:justify-end ">
          <div className="relative w-full md:w-3/4 lg:w-full max-w-xl">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <Image
                src={Marketing}
                alt="Illustration Auto kaufen und verkaufen"
                fill
                className="object-contain"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

              <div className="absolute bottom-4 left-8 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 -rotate-2 flex items-center space-x-1">
                <FaSearch className="text-green-600 text-lg sm:text-xl" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Kaufen
                </span>
              </div>
              <div className="absolute top-4 right-8 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200 rotate-2 flex items-center space-x-1">
                <MdOutlineAttachMoney className="text-green-600 text-lg sm:text-xl" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Verkaufen
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Glow Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
