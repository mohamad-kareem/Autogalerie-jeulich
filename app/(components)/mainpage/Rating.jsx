"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Rate from "../../(assets)/Rate.png";
import Button from "../helpers/Button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Rating() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) setHasAnimated(true);
  }, [inView]);

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-16 overflow-hidden bg-black">
      {/* Background elements */}

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10"
      >
        {/* Text Content */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-yellow-300">
              Kundenzufriedenheit
            </h2>
          </div>

          <p className="text-base sm:text-lg leading-relaxed text-gray-300">
            Bei uns stehen Sie im Mittelpunkt! Unser Team sorgt für einen
            reibungslosen Ablauf, besten Kundenservice und kompetente Beratung.
            Ob beim Kauf oder Verkauf eines Fahrzeugs – Ihr Autohaus in Jülich
            setzt alles daran, Ihre Erwartungen zu übertreffen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
              passHref
            >
              <Button size="lg" className="group">
                <span className="group-hover:text-yellow-300 transition-colors">
                  Geben Sie uns Ihr Feedback
                </span>
              </Button>
            </Link>

            <div className="flex items-center gap-2 text-yellow-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                  />
                ))}
              </div>
              <span className="text-sm font-medium">5.0/5.0</span>
            </div>
          </div>
        </div>

        {/* Rating Image - Now with better sizing */}
        <motion.div
          className="relative flex justify-center"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="relative p-1 bg-gradient-to-br from-yellow-400 to-red-500 rounded-3xl shadow-2xl w-full max-w-xs">
            <div className="bg-black p-3 sm:p-4 rounded-2xl">
              <Image
                src={Rate}
                alt="Kundenbewertung"
                width={300}
                height={360}
                className="w-full h-auto rounded-xl"
                loading="lazy"
                unoptimized
              />
            </div>

            {/* Floating badge - now smaller */}
            <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-xs sm:text-sm shadow-lg">
              TOP BEWERTET
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Glow Effects */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-full blur-[80px] pointer-events-none" />
    </section>
  );
}

function StarIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
