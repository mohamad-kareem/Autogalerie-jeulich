"use client";

import React from "react";
import { Mail, Cookie, ShieldCheck } from "lucide-react";

const WRAPPER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

export default function DatenschutzPage() {
  const sections = [
    {
      id: 1,
      title: "Kontaktaufnahme",
      icon: <Mail className="h-5 w-5 text-[#146c2e] sm:h-6 sm:w-6" />,
      text: "Wenn Sie uns über unser Kontaktformular oder per E-Mail kontaktieren, werden Ihre Angaben ausschließlich zur Bearbeitung Ihrer Anfrage verwendet.",
    },
    {
      id: 2,
      title: "Cookies",
      icon: <Cookie className="h-5 w-5 text-[#146c2e] sm:h-6 sm:w-6" />,
      text: "Unsere Website verwendet nur technisch notwendige Cookies, um die Funktionalität der Seite sicherzustellen.",
    },
    {
      id: 3,
      title: "Ihre Rechte",
      icon: <ShieldCheck className="h-5 w-5 text-[#146c2e] sm:h-6 sm:w-6" />,
      text: (
        <>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung oder Löschung
          Ihrer gespeicherten personenbezogenen Daten. Weitere Informationen
          finden Sie im{" "}
          <a
            href="/impressum"
            className="font-medium text-[#146c2e] transition hover:underline"
          >
            Impressum
          </a>
          .
        </>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f3] py-6 sm:py-10 lg:py-14">
      <div className={WRAPPER}>
        <div className="mb-6 border-b border-black/[0.08] pb-4 text-center sm:mb-8 sm:pb-6">
          <h1 className="text-[26px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-4xl">
            Datenschutzerklärung
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-[#5f695f] sm:text-[15px] sm:leading-7">
            Wir legen großen Wert auf den Schutz Ihrer persönlichen Daten.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-5">
          {sections.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_35px_-24px_rgba(7,17,31,0.18)] sm:rounded-3xl sm:p-7"
            >
              <div className="flex gap-3 sm:gap-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] sm:h-14 sm:w-14 sm:rounded-2xl">
                  {section.icon}
                </div>

                <div className="min-w-0">
                  <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#07111f] sm:text-2xl">
                    {section.title}
                  </h2>

                  <div className="mt-1.5 text-[13px] leading-6 text-[#505950] sm:mt-3 sm:text-[15px] sm:leading-8">
                    {section.text}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
