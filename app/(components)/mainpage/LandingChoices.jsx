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
    <section className="w-full bg-[#f5f5f2] py-10 sm:py-14">
      {/* Full-width colored panel */}
      <div className="w-full bg-[#fff0e2] py-10 shadow-sm sm:py-12 lg:py-14">
        {/* Content stays constrained */}
        <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-12">
            {/* Heading — left side */}
            <div>
              <div className="mb-3 h-[2px] w-10 bg-[#d97706] sm:w-12" />

              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#d97706] sm:text-[14px] sm:tracking-[0.32em]">
                Fahrzeugkauf
              </p>

              <h2 className="mt-4 max-w-[480px] text-[14px] font-medium leading-7 text-[#263126] sm:text-[25px] sm:leading-[35px]">
                Was benötigen Sie für den Autokauf?
              </h2>
            </div>

            {/* Requirements grid — right side */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {requirements.map((item, index) => (
                <div key={index} className="flex gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fef3e2] text-[#d97706]">
                    <item.icon className="h-[22px] w-[22px]" />
                  </div>

                  <div>
                    <h3 className="text-[15px] font-black tracking-[-0.02em] text-[#101510] sm:text-base">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 text-[12px] font-semibold leading-5 text-[#263126] sm:text-[13px]">
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
