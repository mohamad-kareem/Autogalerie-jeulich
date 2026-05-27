// app/garantie/page.jsx
import React from "react";
import Head from "next/head";
import Image from "next/image";
import Footbar from "@/app/(components)/mainpage/Footbar";
import garantieLogo from "@/app/(assets)/garantie.jpg";

import {
  FiShield,
  FiClock,
  FiCheckCircle,
  FiSettings,
  FiCpu,
  FiLayers,
  FiTruck,
  FiGlobe,
  FiDollarSign,
  FiTrendingUp,
  FiShieldOff,
  FiAward,
} from "react-icons/fi";

const GREEN = "#146c2e";

export default function GarantiePage() {
  const benefits = [
    {
      icon: FiDollarSign,
      title: "Kostenschutz",
      desc: "Absicherung bei unerwarteten Reparaturkosten.",
    },
    {
      icon: FiGlobe,
      title: "Europaweit",
      desc: "Schutz über ausgewählte Partnerwerkstätten.",
    },
    {
      icon: FiTrendingUp,
      title: "Mehr Sicherheit",
      desc: "Mehr Vertrauen beim Fahrzeugkauf.",
    },
  ];

  const protection = [
    {
      icon: FiShield,
      title: "Flexible Laufzeiten",
      desc: "12, 24 oder 36 Monate Schutz passend zu Ihrem Fahrzeug.",
    },
    {
      icon: FiClock,
      title: "Schnelle Bearbeitung",
      desc: "Unterstützung bei der Abwicklung im Garantiefall.",
    },
    {
      icon: FiDollarSign,
      title: "Transparente Konditionen",
      desc: "Klare und verständliche Garantiebedingungen.",
    },
    {
      icon: FiTruck,
      title: "Zuverlässige Hilfe",
      desc: "Unterstützung bei technischen Problemen.",
    },
  ];

  const packages = [
    {
      icon: FiCpu,
      title: "Basis-Schutz",
      items: ["Motor", "Getriebe", "Antriebsstrang"],
    },
    {
      icon: FiLayers,
      title: "Komfort-Paket",
      items: ["Elektronik", "Klimaanlage", "Komfortsysteme"],
    },
    {
      icon: FiShieldOff,
      title: "Nicht enthalten",
      items: ["Verschleißteile", "Karosserieschäden", "Unfallschäden"],
    },
  ];

  const services = [
    {
      title: "Fahrzeugprüfung",
      content:
        "Vor Abschluss wird das Fahrzeug technisch geprüft und bewertet.",
    },
    {
      title: "Individueller Schutz",
      content:
        "Die Garantie wird passend zu Fahrzeug und Laufleistung gewählt.",
    },
    {
      title: "Klare Abwicklung",
      content: "Alle Leistungen und Bedingungen werden transparent festgelegt.",
    },
    {
      title: "Persönliche Betreuung",
      content:
        "Wir begleiten Sie auch nach dem Fahrzeugkauf zuverlässig weiter.",
    },
  ];

  return (
    <>
      <Head>
        <title>Garantie | Auto Galerie Jülich</title>

        <meta name="robots" content="index,follow" />

        <meta
          name="description"
          content="Garantie für Gebrauchtwagen bei Auto Galerie Jülich."
        />
      </Head>

      <main className="min-h-screen overflow-x-hidden bg-[#f5f6f3]">
        {/* HERO */}
        <section className="w-full py-6 sm:py-12">
          <div className="w-full bg-[#eef6f0] py-7 shadow-sm sm:py-12 lg:py-14">
            <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-12">
                <div>
                  <div className="mb-3 h-[2px] w-10 bg-[#146c2e] sm:w-12" />

                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#146c2e] sm:text-[13px]">
                    Garantie
                  </p>

                  <h1 className="max-w-[420px] text-[28px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#101510] sm:text-[34px] lg:text-[40px]">
                    Unser Garantie-Versprechen
                  </h1>
                </div>

                <div className="rounded-3xl border border-[#146c2e]/10 bg-white/70 p-4 shadow-sm shadow-green-900/5 backdrop-blur sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
                      <FiShield className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146c2e]">
                        CarGarantie
                      </p>

                      <p className="text-[14px] font-medium text-[#101510] sm:text-base">
                        Sicherheit für Ihren Fahrzeugkauf
                      </p>
                    </div>
                  </div>

                  <p className="text-[13px] leading-6 text-[#263126] sm:text-[15px] sm:leading-7">
                    Viele unserer Fahrzeuge können mit einer individuellen
                    CarGarantie® Absicherung ausgeliefert werden. Der genaue
                    Umfang richtet sich nach Fahrzeug und Garantiepaket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mx-auto max-w-[1180px] px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
            {benefits.map((item, index) => (
              <InfoCard key={index} {...item} />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Image
              src={garantieLogo}
              alt="CarGarantie Logo"
              width={180}
              height={60}
              className="h-14 w-auto object-contain opacity-90 sm:h-20"
            />
          </div>
        </section>

        {/* MAIN CARDS */}
        <section className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 pb-8 sm:px-6 sm:pb-12 lg:grid-cols-2 lg:px-8">
          <Panel
            icon={FiCheckCircle}
            title="Ihr CarGarantie® Schutz"
            subtitle="Individuelle Pakete für jeden Bedarf"
          >
            {protection.map((item, index) => (
              <SmallFeature key={index} {...item} />
            ))}
          </Panel>

          <Panel
            icon={FiSettings}
            title="Schutzumfänge"
            subtitle="Abhängig vom Fahrzeug und Garantiepaket"
          >
            {packages.map((item, index) => (
              <PackageCard key={index} {...item} />
            ))}

            <div className="border-t border-black/10 pt-4 text-center">
              <Image
                src={garantieLogo}
                alt="CarGarantie Logo"
                width={150}
                height={45}
                className="mx-auto h-8 w-auto object-contain"
              />

              <p className="mt-2 text-[11px] text-[#263126]/70">
                Der genaue Umfang ergibt sich aus dem individuellen
                Garantievertrag.
              </p>
            </div>
          </Panel>
        </section>

        {/* SERVICES */}
        <section className="mx-auto max-w-[1180px] px-4 pb-8 sm:px-6 sm:pb-12 lg:px-8">
          <div className="rounded-3xl bg-[#101510] p-5 text-white shadow-xl shadow-black/10 sm:p-8">
            <div className="mb-6">
              <div className="mb-3 h-[2px] w-10 bg-[#22c55e]" />

              <h2 className="text-[24px] font-semibold tracking-[-0.03em] sm:text-[30px]">
                CarGarantie® Leistungen
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {services.map((item, index) => (
                <div key={index} className="border-l-2 border-[#22c55e] pl-4">
                  <h3 className="text-[15px] font-semibold">{item.title}</h3>

                  <p className="mt-1 text-[12px] leading-5 text-white/70 sm:text-[13px]">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEGAL */}
        <section className="mx-auto max-w-[1180px] px-4 pb-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e]">
                <FiAward className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-[#101510]">
                  Rechtliche Hinweise
                </h3>

                <p className="mt-2 text-[12px] leading-6 text-[#263126] sm:text-[13px]">
                  Die CarGarantie® ist eine freiwillige Leistung der Auto
                  Galerie Jülich in Kooperation mit unserem Partner
                  CarGarantie®. Sie stellt keine gesetzliche Gewährleistung dar.
                  Der genaue Umfang ergibt sich aus dem individuellen
                  Garantievertrag.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footbar />
    </>
  );
}

function InfoCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-3xl border border-[#146c2e]/10 bg-white/70 p-4 shadow-sm shadow-green-900/5 sm:p-5">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-[#101510] sm:text-base">
        {title}
      </h3>

      <p className="mt-1 text-[12px] leading-5 text-[#263126] sm:text-[13px]">
        {desc}
      </p>
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <div className="bg-[#eef6f0] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#146c2e] shadow-sm">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#101510] sm:text-[22px]">
              {title}
            </h2>

            <p className="text-[12px] text-[#263126]">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">{children}</div>
    </div>
  );
}

function SmallFeature({ icon: Icon, title, desc }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-black/5 bg-[#fafbf9] p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e]">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <h3 className="text-[14px] font-semibold text-[#101510]">{title}</h3>

        <p className="mt-1 text-[12px] leading-5 text-[#263126]">{desc}</p>
      </div>
    </div>
  );
}

function PackageCard({ icon: Icon, title, items }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#fafbf9] p-3">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e]">
          <Icon className="h-4 w-4" />
        </div>

        <h3 className="text-[14px] font-semibold text-[#101510]">{title}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className="rounded-full border border-[#146c2e]/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#263126]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
