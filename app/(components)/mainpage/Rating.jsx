"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Rate from "../../(assets)/Rate.png";
import Button from "../helpers/Button";
import Link from "next/link";

export default function Rating() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) setHasAnimated(true);
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
        {/* Text Content */}
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Unsere Kunden sind mit Autogalerie Jülich zufrieden.
          </h2>
          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-400 mb-6">
            Bei uns stehen Sie im Mittelpunkt! Unser Team sorgt für einen
            reibungslosen Ablauf, besten Kundenservice und kompetente Beratung.
            Ob beim Kauf oder Verkauf eines Fahrzeugs – Ihr Autohaus in Jülich
            setzt alles daran, Ihre Erwartungen zu übertreffen. Lassen Sie sich
            überzeugen und erleben Sie Service, der begeistert.
          </p>
          <Link
            href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
            passHref
          >
            <Button size="lg">Geben Sie uns Ihr Feedback</Button>
          </Link>
        </div>

        {/* Rating Image */}
        <div className="flex justify-center md:justify-end">
          <div className="p-2 sm:p-4 border-4 border-gray-800 rounded-3xl shadow-lg bg-white">
            <Image
              src={Rate}
              alt="Kundenbewertung"
              width={300}
              height={360}
              className="w-40 sm:w-48 md:w-56 lg:w-64 h-auto rounded-2xl"
              loading="lazy"
            />
          </div>
        </div>
      </motion.div>

      {/* Glow Effects */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
