"use client";

import Image from "next/image";
import Link from "next/link";
import back from "@/app/(assets)/background.jpg";
import { ShieldCheck, PhoneCall, BadgeEuro } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="
        relative mt-16 flex min-h-screen w-full items-center overflow-hidden 
        bg-black text-white
      "
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={back}
          alt="Sportwagen auf einer Straße bei Sonnenuntergang"
          fill
          priority
          className="object-cover"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        <div
          className="
    mx-auto flex w-full max-w-7xl flex-col 
    px-4 
    pt-8 pb-16           /* mobile: text moves UP */
    sm:pt-12 sm:pb-16    /* tablet */
    lg:pt-16 lg:pb-20    /* desktop */
    2xl:px-0
    gap-8
  "
        >
          {/* Badge */}
          <div className="flex justify-center sm:justify-start">
            <div
              className="
                inline-flex w-fit items-center gap-2 rounded-full border border-white/15 
                bg-black/50 px-3 py-1 backdrop-blur
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span
                className="
                  text-[10px] sm:text-[11px] font-medium 
                  tracking-[0.25em] text-slate-200 uppercase
                  whitespace-nowrap
                "
              >
                Autogalerie&nbsp;– Jülich
              </span>
            </div>
          </div>

          {/* Headline + subtext */}
          <div
            className="
              max-w-7xl space-y-6 
              text-center sm:text-left
            "
          >
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
              Premium-Fahrzeuge.
              <span
                className="
                  mt-2 block 
                  text-[12px] 
                  sm:text-xs 
                  md:text-sm 
                  lg:text-base 
                  tracking-[0.35em] uppercase text-blue-200
                "
              >
                Klar. Direkt.
              </span>
            </h1>

            <p
              className="
                mx-auto sm:mx-0 
                max-w-xl 
                text-sm sm:text-sm md:text-base text-slate-200
              "
            >
              Auswahl, Qualität und Service auf Konzernniveau – an einem
              Standort.
            </p>
          </div>

          {/* CTAs */}
          <div
            className="
              mt-2 flex flex-wrap items-center justify-center gap-4
              sm:justify-start
            "
          >
            <Link
              href="/gebrauchtwagen"
              className="
                inline-flex items-center justify-center 
                rounded-full bg-white px-7 py-2.5 
                text-sm md:text-base font-semibold text-black 
                shadow-md transition 
                hover:bg-slate-200
              "
            >
              Fahrzeuge ansehen
            </Link>

            <Link
              href="/kontakt"
              className="
                inline-flex items-center justify-center 
                rounded-full border border-white/60 px-5 py-2.5 
                text-sm md:text-base font-semibold text-white 
                transition 
                hover:border-blue-400 hover:text-blue-200
              "
            >
              Beratung vereinbaren
            </Link>
          </div>

          {/* Trust row */}
          <div
            className="
              mt-6 flex flex-wrap items-center justify-center gap-3 
              text-[11px] sm:text-xs md:text-sm text-slate-200
              sm:justify-start
            "
          >
            <div
              className="
                flex items-center gap-2 rounded-full border border-white/10 
                bg-black/60 px-3 py-1
              "
            >
              <ShieldCheck className="h-4 w-4 text-blue-300" />
              <span>Geprüfte Fahrzeuge</span>
            </div>
            <div
              className="
                flex items-center gap-2 rounded-full border border-white/10 
                bg-black/60 px-3 py-1
              "
            >
              <BadgeEuro className="h-4 w-4 text-blue-300" />
              <span>Transparente Konditionen</span>
            </div>
            <div
              className="
                flex items-center gap-2 rounded-full border border-white/10 
                bg-black/60 px-3 py-1
              "
            >
              <PhoneCall className="h-4 w-4 text-blue-300" />
              <span>Persönliche Betreuung</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
