"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Logo from "../../(assets)/logo1111.png";

const TITLE_TOP = "Autogalerie";
const TITLE_BOTTOM = "Jülich";

// Container variants for staggered letters (top line)
const topLineVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.9,
      staggerChildren: 0.16, // slower on big screens too
    },
  },
};

// Container variants for staggered letters (bottom line)
const bottomLineVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 2.1, // starts after top line
      staggerChildren: 0.16,
    },
  },
};

// Single letter animation
const letterVariants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.96,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function WaitingLounge() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-900 text-white">
      {/* Premium background with subtle texture – fills all sizes */}
      <div className="pointer-events-none absolute inset-0">
        {/* Very soft radial noise / glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />

        {/* Accent lights – scale nicely on large screens */}
        <div className="absolute left-1/4 top-1/4 h-64 w-64 sm:h-72 sm:w-72 lg:h-96 lg:w-96 bg-blue-500/10 blur-[90px] lg:blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 sm:h-72 sm:w-72 lg:h-96 lg:w-96 bg-blue-400/5 blur-[90px] lg:blur-[120px]" />

        {/* Subtle grid overlay with center fade – also ok on XXL */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:70px_70px] sm:bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_75%)]" />
      </div>

      {/* Centered content wrapper – responsive paddings & max width */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 text-center"
      >
        {/* Logo with premium presentation – size scales with breakpoints */}
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 sm:mb-10 md:mb-10"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/15 to-blue-400/10 blur-2xl" />
            <Image
              src={Logo}
              alt="Autogalerie Jülich"
              className="relative h-auto w-36 sm:w-44 md:w-52 lg:w-56 xl:w-44 2xl:w-64 drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        {/* Brand identity section */}
        <div className="mb-8 sm:mb-10 md:mb-12 space-y-6 sm:space-y-8">
          {/* Main title with Playfair + smooth letter-by-letter animation */}
          <div
            className="
              font-playfair
              uppercase
              leading-tight
              text-3xl
              sm:text-4xl
              md:text-5xl
              lg:text-6xl
              xl:text-7xl
              2xl:text-7xl
              tracking-[0.18em]
              sm:tracking-[0.22em]
              md:tracking-[0.25em]
            "
          >
            {/* Top line: "Autogalerie" (white) */}
            <motion.div
              variants={topLineVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap justify-center"
            >
              {TITLE_TOP.split("").map((char, index) => (
                <motion.span
                  key={`top-${index}`}
                  variants={letterVariants}
                  className="inline-block text-white"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.div>

            {/* Bottom line: "Jülich" with modern gradient */}
            <motion.div
              variants={bottomLineVariants}
              initial="hidden"
              animate="visible"
              className="mt-2 sm:mt-3 flex flex-wrap justify-center"
            >
              {TITLE_BOTTOM.split("").map((char, index) => (
                <motion.span
                  key={`bottom-${index}`}
                  variants={letterVariants}
                  className="inline-block bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Premium divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 2.9, duration: 1.2, ease: "easeOut" }}
            className="flex justify-center"
          >
            <div className="h-px w-20 sm:w-24 md:w-32 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
          </motion.div>
        </div>
      </motion.div>

      {/* Premium footer - sticky bottom, works on all sizes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.1, duration: 0.8 }}
        className="absolute bottom-0 left-0 w-full border-t border-slate-800/60 bg-gradient-to-t from-slate-950/90 to-transparent backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-5 md:py-6 text-[10px] sm:text-[11px] md:text-xs font-light tracking-wider text-gray-500 md:flex-row md:items-center md:justify-between">
          <motion.span
            whileHover={{ color: "#d4d4d4" }}
            transition={{ duration: 0.2 }}
            className="cursor-default text-center md:text-left"
          >
            © {new Date().getFullYear()} Autogalerie Jülich
          </motion.span>

          <motion.span
            whileHover={{ color: "#d4d4d4" }}
            transition={{ duration: 0.2 }}
            className="hidden cursor-default text-center md:inline md:text-center"
          >
            Premium Fahrzeughandel
          </motion.span>

          <motion.span
            whileHover={{ color: "#d4d4d4" }}
            transition={{ duration: 0.2 }}
            className="cursor-default text-center md:text-right"
          >
            Mo–Sa 9:00–18:00
          </motion.span>
        </div>
      </motion.div>

      {/* Progressive loading indicator - runs along full bottom width on any screen */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 6, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-blue-600 via-blue-400 to-blue-300"
      />
    </div>
  );
}
