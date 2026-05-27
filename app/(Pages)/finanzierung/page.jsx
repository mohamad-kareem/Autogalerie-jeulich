// app/finanzierung/page.jsx
import React from "react";
import Image from "next/image";
import Head from "next/head";
import Footbar from "@/app/(components)/mainpage/Footbar";
import finance from "@/app/(assets)/finance.jpg";

import {
  FaUniversity,
  FaInfoCircle,
  FaHandshake,
  FaChartLine,
  FaFileAlt,
  FaShieldAlt,
} from "react-icons/fa";

export default function FinanzierungPage() {
  const steps = [
    {
      number: "1",
      title: "Beratungsgespräch",
      description:
        "Gemeinsam besprechen wir Ihre Wünsche und finanziellen Möglichkeiten.",
    },
    {
      number: "2",
      title: "Angebotserstellung",
      description:
        "Sie erhalten ein klares Finanzierungsangebot mit allen Konditionen.",
    },
    {
      number: "3",
      title: "Dokumentenprüfung",
      description:
        "Wir unterstützen Sie bei den notwendigen Unterlagen für die Bank.",
    },
    {
      number: "4",
      title: "Finanzierungszusage",
      description:
        "Nach positiver Prüfung erhalten Sie die Zusage des Kreditinstituts.",
    },
  ];

  const benefits = [
    {
      icon: FaUniversity,
      title: "Bankenunabhängig",
      description:
        "Wir vergleichen passende Finanzierungsmöglichkeiten für Sie.",
    },
    {
      icon: FaInfoCircle,
      title: "Ehrliche Beratung",
      description: "Klare Informationen ohne unnötigen Verkaufsdruck.",
    },
    {
      icon: FaFileAlt,
      title: "Dokumentenservice",
      description:
        "Wir helfen Ihnen bei der Vorbereitung der benötigten Unterlagen.",
    },
    {
      icon: FaChartLine,
      title: "Attraktive Konditionen",
      description:
        "Passende Raten und Laufzeiten abhängig von Ihrer Situation.",
    },
    {
      icon: FaShieldAlt,
      title: "Sicherheit",
      description: "Ihre Daten werden vertraulich und sorgfältig behandelt.",
    },
    {
      icon: FaHandshake,
      title: "Langfristige Betreuung",
      description: "Auch nach Abschluss bleiben wir Ihr Ansprechpartner.",
    },
  ];

  const cards = [
    {
      icon: FaHandshake,
      title: "Persönliche Beratung",
      description:
        "Individuelle Lösungen passend zu Ihrem Budget und Fahrzeugwunsch.",
    },
    {
      icon: FaChartLine,
      title: "Transparente Konditionen",
      description:
        "Klare Übersicht über Rate, Laufzeit, Anzahlung und Gesamtkosten.",
    },
    {
      icon: FaShieldAlt,
      title: "Diskrete Abwicklung",
      description: "Ihre persönlichen Daten behandeln wir vertraulich.",
    },
  ];

  return (
    <>
      <Head>
        <title>Finanzierung | Auto Galerie Jülich</title>

        <meta name="robots" content="index,follow" />

        <meta
          name="description"
          content="Individuelle Fahrzeugfinanzierung bei Auto Galerie Jülich."
        />
      </Head>

      <main className="min-h-screen overflow-x-hidden bg-[#f5f6f3]">
        {/* HERO */}
        <section className="w-full py-6 sm:py-12">
          <div className="w-full bg-[#eef6f0] py-7 shadow-sm sm:py-12 lg:py-14">
            <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-12">
                <div>
                  <div className="mb-3 h-[2px] w-10 bg-[#146c2e] sm:w-12" />

                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#146c2e] sm:text-[13px]">
                    Finanzierung
                  </p>

                  <h1 className="max-w-[450px] text-[28px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#101510] sm:text-[34px] lg:text-[38px]">
                    Individuelle Fahrzeugfinanzierung
                  </h1>
                </div>

                <div className="rounded-3xl border border-[#146c2e]/10 bg-white/70 p-4 shadow-sm shadow-green-900/5 backdrop-blur sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
                      <FaUniversity className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146c2e]">
                        Finanzierungsservice
                      </p>

                      <p className="text-[14px] font-medium text-[#101510] sm:text-base">
                        Transparent und passend zu Ihrem Budget
                      </p>
                    </div>
                  </div>

                  <p className="text-[13px] leading-6 text-[#263126] sm:text-[15px] sm:leading-7">
                    Wir unterstützen Sie bei der passenden Finanzierung für Ihr
                    Wunschfahrzeug. Gemeinsam finden wir eine Lösung mit fairen
                    Raten und verständlichen Konditionen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="mx-auto max-w-[1180px] px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
            <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="mb-3 h-[2px] w-10 bg-[#146c2e]" />

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#146c2e]">
                  Ablauf
                </p>

                <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#101510] sm:text-[30px]">
                  Unser Finanzierungsprozess
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#263126] sm:text-[14px]">
                  Von der ersten Beratung bis zur Finanzierungszusage begleiten
                  wir Sie Schritt für Schritt.
                </p>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-3 rounded-2xl border border-black/5 bg-[#fafbf9] p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[15px] font-semibold text-[#146c2e]">
                      {step.number}
                    </div>

                    <div>
                      <h3 className="text-[14px] font-semibold text-[#101510] sm:text-[15px]">
                        {step.title}
                      </h3>

                      <p className="mt-1 text-[12px] leading-5 text-[#263126] sm:text-[13px]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-black/10  shadow-sm">
              <Image
                src={finance}
                alt="Finanzierungsprozess"
                className="h-fit  w-fit object-fill"
                width={700}
                priority
              />
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mx-auto max-w-[1180px] px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          <div className="rounded-3xl bg-[#101510] p-5 text-white shadow-xl shadow-black/10 sm:p-8">
            <div className="mb-6 text-left sm:text-center">
              <div className="mb-3 h-[2px] w-10 bg-[#22c55e] sm:mx-auto" />

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#22c55e]">
                Vorteile
              </p>

              <h2 className="text-[24px] font-semibold tracking-[-0.03em] sm:text-[30px]">
                Unsere Finanzierungsvorteile
              </h2>

              <p className="mx-auto mt-2 max-w-[650px] text-[13px] leading-6 text-white/70 sm:text-[14px]">
                Verständlich, transparent und passend zu Ihrer Situation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item, index) => (
                <DarkBenefit key={index} {...item} />
              ))}
            </div>
          </div>
        </section>

        {/* CARDS */}
        <section className="mx-auto max-w-[1180px] px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="mb-3 h-[2px] w-10 bg-[#146c2e]" />

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#146c2e]">
              Ihr Vorteil
            </p>

            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#101510] sm:text-[30px]">
              Ihr Weg zur passenden Finanzierung
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-3">
            {cards.map((item, index) => (
              <LightCard key={index} {...item} />
            ))}
          </div>
        </section>
      </main>

      <Footbar />
    </>
  );
}

function DarkBenefit({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 sm:p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#4ade80]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-[15px] font-semibold text-white sm:text-base">
        {title}
      </h3>

      <p className="mt-1 text-[12px] leading-5 text-white/65 sm:text-[13px]">
        {description}
      </p>
    </div>
  );
}

function LightCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-3xl border border-[#146c2e]/10 bg-white p-4 shadow-sm shadow-green-900/5 sm:p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#101510] sm:text-base">
        {title}
      </h3>

      <p className="mt-1 text-[12px] leading-5 text-[#263126] sm:text-[13px]">
        {description}
      </p>
    </div>
  );
}
