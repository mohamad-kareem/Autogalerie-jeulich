"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import steps from "../../utils/Why.js";

export default function WhyUs() {
  return (
    <section className="w-full bg-[#f5f5f2] py-10 sm:py-14">
      <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
        <div className="rounded-[26px] bg-white px-4 py-8 shadow-xl shadow-black/5 sm:px-6 sm:py-10 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 h-[2px] w-12 bg-[#146c2e]" />

              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#146c2e]">
                Autoankauf
              </p>

              <h2 className="text-[28px] font-black leading-[0.95] tracking-[-0.045em] text-[#07111f] sm:text-[38px]">
                Auto verkaufen.
                <br />
                Schnell & unkompliziert.
              </h2>
            </div>

            <p className="max-w-md text-[13px] font-semibold leading-6 text-[#263126]/70 sm:text-sm">
              Faire Bewertung, schnelle Abwicklung und persönliche Beratung —
              direkt bei Autogalerie Jülich.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="group overflow-hidden rounded-[24px] border border-black/8 bg-[#fafaf8] transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
              >
                {/* Image */}
                <div className="relative h-[180px] overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width:768px) 100vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-[#146c2e] shadow-md">
                    0{index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3 p-5">
                  <h3 className="text-[18px] font-black leading-snug tracking-[-0.03em] text-[#101510]">
                    {step.title}
                  </h3>

                  <p className="text-[13px] font-semibold leading-6 text-[#263126]/70">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[24px] bg-[#eef6f0] px-5 py-5 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="text-[18px] font-black text-[#101510]">
                Kostenlose Fahrzeugbewertung
              </h3>

              <p className="mt-1 text-[13px] font-semibold text-[#263126]/70">
                Unverbindlich & schnell online anfragen.
              </p>
            </div>

            <Link
              href="/Autoverkaufen"
              className="inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#146c2e] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:bg-[#0f5724]"
            >
              Jetzt anfragen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
