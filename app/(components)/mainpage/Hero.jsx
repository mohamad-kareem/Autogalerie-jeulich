"use client";

import Image from "next/image";
import Link from "next/link";
import back from "@/app/(assets)/back2.png";
import { ShieldCheck, PhoneCall, BadgeEuro } from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const fullText = "Premium-Fahrzeuge.";

  useEffect(() => {
    const handleType = () => {
      const currentText = isDeleting
        ? fullText.substring(0, text.length - 1)
        : fullText.substring(0, text.length + 1);

      setText(currentText);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
        setTypingSpeed(100);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setLoopNum((n) => n + 1);
        setTypingSpeed(150);
      } else {
        setTypingSpeed(isDeleting ? 50 : 150);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <section
      className="
        relative  w-full overflow-hidden
        min-h-screen text-white
        flex items-center
        bg-slate-950
      "
    >
      {/* Desktop background image */}
      <div className="absolute inset-0 hidden sm:block">
        <Image
          src={back}
          alt="Sportwagen auf einer Straße bei Sonnenuntergang"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 w-full">
        <div
          className="
            mx-auto w-full max-w-7xl
            px-4
             pb-15
            sm:pt-12 sm:pb-16
            lg:pt-16 lg:pb-20
            2xl:px-0
          "
        >
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* 1) Badge + Headline */}
            <div className="text-center sm:text-left space-y-6">
              {/* Desktop badge only */}
              <div className="hidden sm:flex justify-center sm:justify-start">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.25em] text-slate-200 uppercase whitespace-nowrap">
                    Autogalerie&nbsp;– Jülich
                  </span>
                </div>
              </div>

              <h1
                className="
                  font-playfair leading-tight
                  text-3xl
                  sm:text-4xl
                  md:text-5xl
                  lg:text-6xl
                  xl:text-7xl
                  2xl:text-[4.5rem]
                "
              >
                <span className="inline-block min-h-[1em]">
                  {text}
                  <span className="animate-pulse">|</span>
                </span>

                <span className="mt-2 block text-[12px] sm:text-xs md:text-sm lg:text-base tracking-[0.35em] uppercase text-blue-200">
                  Klar. Direkt.
                </span>
              </h1>
            </div>

            {/* 2) Image (MOBILE card only) */}
            <div className="sm:hidden">
              <div className="relative h-[40vh] min-h-[250px] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-2xl shadow-black/40">
                <Image
                  src={back}
                  alt="Sportwagen auf einer Straße bei Sonnenuntergang"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/95 to-transparent" />

                {/* Mobile badge */}
                <div className="absolute left-3 top-3 z-20">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-medium tracking-[0.25em] text-slate-200 uppercase whitespace-nowrap">
                      Autogalerie&nbsp;– Jülich
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop description */}
            <p className="hidden sm:block max-w-xl text-slate-200 text-sm md:text-base">
              Auswahl, Qualität und Service auf Konzernniveau – an einem
              Standort.
            </p>

            {/* 3) CTAs */}
            <div className="flex w-full flex-nowrap items-center justify-center gap-3 sm:justify-start">
              <Link
                href="/gebrauchtwagen"
                className="
                  inline-flex w-1/2 sm:w-auto items-center justify-center
                  rounded-full bg-white px-5 py-2.5
                  text-sm md:text-base font-semibold text-black
                  shadow-md transition hover:bg-slate-200
                  whitespace-nowrap
                "
              >
                Fahrzeuge ansehen
              </Link>

              <Link
                href="/kontakt"
                className="
                  inline-flex w-1/2 sm:w-auto items-center justify-center
                  rounded-full border border-white/60 px-4 py-2.5
                  text-sm md:text-base font-semibold text-white
                  transition hover:border-blue-400 hover:text-blue-200
                  whitespace-nowrap
                "
              >
                Beratung vereinbaren
              </Link>
            </div>

            {/* 4) Rest */}
            <div className="space-y-6">
              {/* Mobile description */}
              <p className="sm:hidden mx-auto max-w-xl text-center text-sm text-slate-200">
                Auswahl, Qualität und Service auf Konzernniveau
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] sm:text-xs md:text-sm text-slate-200 sm:justify-start">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  <ShieldCheck className="h-4 w-4 text-blue-300" />
                  <span>Geprüfte Fahrzeuge</span>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  <BadgeEuro className="h-4 w-4 text-blue-300" />
                  <span>Transparente Konditionen</span>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1">
                  <PhoneCall className="h-4 w-4 text-blue-300" />
                  <span>Persönliche Betreuung</span>
                </div>
              </div>
            </div>
          </div>
          {/* end column */}
        </div>
      </div>
    </section>
  );
}
