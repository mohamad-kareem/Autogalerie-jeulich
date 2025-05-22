"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import steps from "../../utils/Why.js";
import Button from "../helpers/Button";
import Link from "next/link";

export default function WhyUs() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = rect.top - windowHeight / 2;
      const end = rect.bottom - windowHeight / 2;
      const progress = Math.min(Math.max((0 - start) / (end - start), 0), 1);

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-16 overflow-hidden shadow-even mb-8">
      <div
        ref={containerRef}
        className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto mx-auto relative z-10"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-center mb-12 text-white">
          So funktioniert der Autoankauf bei Autogalerie Jülich
        </h2>

        {/* Static Gray Line */}
        <div className="hidden md:block absolute top-[220px] bottom-[250px] left-1/2 transform -translate-x-1/2 w-[2px] bg-gray-300 z-0" />

        {/* Dynamic Red Line */}
        <div
          className="hidden md:block absolute top-[220px] left-1/2 transform -translate-x-1/2 w-[2px] bg-red-600 z-10 transition-all duration-300"
          style={{
            height: `calc(${scrollProgress} * (95% - 400px))`,
          }}
        />

        {/* Timeline Items */}
        <div className="relative flex flex-col gap-20 md:gap-32 z-20">
          {steps.map((step, index) => {
            const stepReached = scrollProgress >= index / steps.length;
            return (
              <div
                key={step.id}
                className={`relative flex flex-col md:flex-row items-center md:items-stretch md:justify-between gap-6 sm:gap-10 md:gap-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Image */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <Image
                    src={step.image}
                    alt={`Schritt ${step.id}`}
                    width={300}
                    height={200}
                    className="rounded-xl shadow-lg max-w-full h-auto"
                  />
                </div>

                {/* Text */}
                <div className="bg-gradient-to-br from-black to-red-950 rounded-xl shadow-md p-6 sm:p-8 max-w-md w-full md:w-1/2 relative z-10 text-center md:text-left">
                  <h3 className="font-bold text-lg sm:text-xl mb-2 text-white">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {step.description}
                  </p>
                </div>

                {/* Step Number */}
                <div
                  className={`hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-4 items-center justify-center font-bold z-30 transition-all duration-300 ${
                    stepReached
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-800 border-gray-300"
                  }`}
                >
                  {step.id}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="mt-10 text-center">
          <div className="flex justify-center mb-4">
            <Link href="/gebrauchtwagen" passHref>
              <Button>Kostenlose Fahrzeugbewertung</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
    </section>
  );
}
