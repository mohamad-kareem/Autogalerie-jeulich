"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import Rate from "../../(assets)/Rate.png";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Rating() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (inView) setHasAnimated(true);
  }, [inView]);

  return (
    <section className="w-full bg-[#f5f5f2] ">
      <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 60 }}
          animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden "
        >
          <div className="grid grid-cols-1 items-center gap-6 p-5 sm:gap-10 sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10">
            {/* Text Content */}
            <div>
              <div className="mb-3 h-[2px] w-10 bg-[#146c2e] sm:w-12" />

              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#146c2e]" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#146c2e] sm:text-[14px] sm:tracking-[0.32em]">
                  Kundenstimmen
                </p>
              </div>

              <p className="mt-4 max-w-[480px] text-[14px] font-medium leading-7 text-[#263126] sm:text-[25px] sm:leading-[35px]">
                Ehrliche Beratung und zufriedene Kunden stehen bei uns an erster
                Stelle.
              </p>

              {/* Rating chip */}
              <div className="mt-5 inline-flex items-center gap-2.5 rounded-2xl border border-black/10 bg-[#fafaf8] px-4 py-2.5">
                <div className="flex text-[#146c2e]">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className="h-4 w-4 fill-current sm:h-[18px] sm:w-[18px]"
                    />
                  ))}
                </div>
                <span className="text-sm font-black text-[#101510]">
                  4.9 / 5.0
                </span>
              </div>

              <div className="mt-5">
                <Link
                  href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black/60 px-5 py-3 text-xs font-black text-white shadow-lg shadow-green-900/25 transition hover:bg-[#0f5724]"
                >
                  Beratung vereinbaren
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Rating Image */}
            <motion.div
              className="relative flex justify-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative w-full max-w-xs rounded-[20px] border border-black/10 bg-[#fafaf8] p-3 shadow-lg shadow-black/5 sm:p-4">
                <Image
                  src={Rate}
                  alt="Kundenbewertung"
                  width={300}
                  height={360}
                  className="h-auto w-full rounded-2xl"
                  loading="lazy"
                  unoptimized
                />

                {/* Floating badge */}
                <div className="absolute -bottom-3 -right-3 rounded-full bg-[#146c2e] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg shadow-green-900/25 sm:text-xs">
                  Top Bewertet
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
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
