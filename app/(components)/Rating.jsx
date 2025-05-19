"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Rate from "../(assets)/Rate.png";
import Button from "./Button";
import Link from "next/link";

export default function Rating() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) setHasAnimated(true);
  }, [inView]);

  return (
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-16 mb-8 overflow-hidden shadow-even">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center"
      >
        {/* Left - Text */}
        <div>
          <h2 className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold text-white mb-4">
            Unsere Kunden sind mit Autogalerie Jülich zufrieden.
          </h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-6 text-gray-500">
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
            <Button>Geben Sie uns Ihr Feedback</Button>
          </Link>
        </div>

        {/* Right - Image */}
        <div className="flex justify-center">
          <div className="p-4 border-6 border-black rounded-3xl shadow-lg bg-white">
            <Image
              src={Rate}
              alt="Kundenbewertung"
              width={300}
              height={400}
              className="w-full max-w-[300px] h-auto rounded-2xl"
            />
          </div>
        </div>
      </motion.div>

      {/* Glow Effects */}
      <div className="absolute -bottom-20 -left-20 w-300 h-64 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
    </section>
  );
}
