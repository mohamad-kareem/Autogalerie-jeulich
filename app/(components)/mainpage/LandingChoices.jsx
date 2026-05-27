"use client";

import { CreditCard, FileText, BadgeCheck, Car } from "lucide-react";

export default function PurchaseRequirements() {
  const requirements = [
    {
      icon: FileText,
      title: "Gültiger Ausweis",
      description:
        "Ein gültiger Personalausweis oder Reisepass des Käufers für die Kaufabwicklung und Zulassung.",
    },
    {
      icon: CreditCard,
      title: "Finanzierung oder Zahlung",
      description:
        "Eine gesicherte Finanzierung, EC-Karte oder Überweisungsnachweis. Gerne beraten wir Sie zu passenden Finanzierungsoptionen.",
    },
    {
      icon: BadgeCheck,
      title: "Bonitätsnachweis",
      description:
        "Bei Finanzierung benötigen wir einen Einkommens- oder Bonitätsnachweis für die schnelle Bearbeitung Ihrer Anfrage.",
    },
    {
      icon: Car,
      title: "Zulassungsunterlagen",
      description:
        "eVB-Nummer Ihrer Versicherung sowie bei Bedarf das alte Kennzeichen. Wir übernehmen die Zulassung gerne für Sie.",
    },
  ];

  return (
    <section className="w-full bg-[#f5f5f2] py-8 sm:py-14">
      {/* Full-width colored panel */}
      <div className="w-full bg-[#fff0e2] py-8 shadow-sm sm:py-12 lg:py-14">
        {/* Content stays constrained */}
        <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-12">
            {/* Heading — left side */}
            <div>
              <div className="mb-3 h-[2px] w-10 bg-[#d97706] sm:w-12" />

              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#d97706] sm:text-[14px] sm:tracking-[0.32em]">
                Fahrzeugkauf
              </p>

              <h2 className="max-w-[320px] text-[24px] font-black leading-[1.1] tracking-[-0.04em] text-[#101510] sm:mt-4 sm:max-w-[480px] sm:text-[14px] sm:font-medium sm:leading-7 sm:tracking-normal sm:text-[#263126] lg:text-[25px] lg:leading-[35px]">
                Was benötigen Sie für den Autokauf?
              </h2>
            </div>

            {/* Requirements grid — right side */}
            <div className="grid grid-cols-1 gap-3 sm:gap-x-8 sm:gap-y-6 sm:grid-cols-2">
              {requirements.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded-2xl border border-[#d97706]/10 bg-white/50 p-3 shadow-sm shadow-orange-900/5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3e2] text-[#d97706] sm:h-12 sm:w-12 sm:rounded-2xl">
                    <item.icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                  </div>

                  <div>
                    <h3 className="text-[14px] font-black tracking-[-0.02em] text-[#101510] sm:text-base">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-[11px] font-semibold leading-[18px] text-[#263126] sm:mt-1.5 sm:text-[12px] sm:leading-5 lg:text-[13px]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
