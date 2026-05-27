"use client";

import {
  FiInfo,
  FiUpload,
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiClock,
  FiTrendingUp,
  FiFileText,
  FiAward,
} from "react-icons/fi";
import AdminCarForm from "@/app/(components)/CarForm/index";
import Footer from "@/app/(components)/mainpage/Footbar";
import Link from "next/link";

const WRAPPER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

const PublicAddCarPage = () => {
  const reasons = [
    {
      title: "Stressfreier Prozess",
      desc: "Keine Anzeigen, Besichtigungen oder langen Verhandlungen.",
    },
    {
      title: "Schnelle Rückmeldung",
      desc: "Wir prüfen Ihre Angaben und melden uns zeitnah zurück.",
    },
    {
      title: "Faire Bewertung",
      desc: "Realistische Einschätzung durch unsere Erfahrung im Fahrzeughandel.",
    },
    {
      title: "Einfache Abwicklung",
      desc: "Wir unterstützen Sie bei Dokumenten, Übergabe und Verkauf.",
    },
  ];

  const documents = [
    "Fahrzeugschein und Fahrzeugbrief",
    "Service- und Wartungsunterlagen",
    "Aktuelle Fotos von außen und innen",
    "Kilometerstand und Zustandsdetails",
  ];

  const process = [
    {
      step: "1",
      title: "Details einreichen",
      desc: "Fahrzeugdaten und Bilder bequem über das Formular senden.",
    },
    {
      step: "2",
      title: "Angebot erhalten",
      desc: "Wir prüfen Ihr Fahrzeug und melden uns mit einer fairen Einschätzung.",
    },
    {
      step: "3",
      title: "Verkauf abschließen",
      desc: "Bei Interesse klären wir gemeinsam Übergabe, Zahlung und Unterlagen.",
    },
  ];

  const stats = [
    {
      icon: <FiAward className="h-6 w-6 text-[#146c2e]" />,
      value: "500+",
      label: "Fahrzeuge bewertet",
    },
    {
      icon: <FiCheckCircle className="h-6 w-6 text-[#146c2e]" />,
      value: "Fair",
      label: "Transparente Angebote",
    },
    {
      icon: <FiClock className="h-6 w-6 text-[#146c2e]" />,
      value: "24h",
      label: "Schnelle Rückmeldung",
    },
    {
      icon: <FiFileText className="h-6 w-6 text-[#146c2e]" />,
      value: "0€",
      label: "Unverbindliche Anfrage",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f5f6f3]">
      {/* HERO */}
      <section className="w-full py-6 sm:py-10 lg:py-14">
        <div className={WRAPPER}>
          <div className="rounded-3xl bg-[#eef6f0] px-4 py-8 shadow-sm sm:px-8 sm:py-12 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-4 h-[2px] w-12 bg-[#146c2e]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#146c2e] sm:text-[12px]">
                Fahrzeug verkaufen
              </p>

              <h1 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.05em] text-[#07111f] sm:text-5xl">
                Verkaufen Sie Ihr Auto einfach und transparent
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-7 text-[#5f695f] sm:text-[16px]">
                Senden Sie uns Ihre Fahrzeugdaten. Wir prüfen Ihr Fahrzeug und
                melden uns mit einer fairen, unverbindlichen Einschätzung.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#146c2e]/15 bg-white px-4 py-2 text-[13px] font-semibold text-[#146c2e]">
                  <FiCheckCircle className="h-4 w-4" />
                  Unverbindliche Anfrage
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#146c2e]/15 bg-white px-4 py-2 text-[13px] font-semibold text-[#146c2e]">
                  <FiClock className="h-4 w-4" />
                  Schnelle Rückmeldung
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className={`${WRAPPER} pb-10 sm:pb-14`}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] lg:gap-8">
          {/* LEFT */}
          <aside className="space-y-5">
            <InfoBox
              icon={<FiInfo />}
              title="Warum uns wählen?"
              items={reasons}
            />

            <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
                  <FiUpload className="h-5 w-5" />
                </div>

                <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#07111f]">
                  Benötigte Dokumente
                </h2>
              </div>

              <p className="mb-4 text-[13px] leading-6 text-[#5f695f]">
                Für eine genaue Einschätzung bereiten Sie bitte folgende
                Informationen vor:
              </p>

              <ul className="space-y-3">
                {documents.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-[13px] text-[#263126]"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#146c2e]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-[#101510] p-5 text-white shadow-xl shadow-black/10 sm:p-6">
              <ContactRow
                icon={<FiMail />}
                title="E-Mail"
                value="autogalerie.jülich@web.de"
              />

              <div className="my-5 border-t border-white/10" />

              <ContactRow
                icon={<FiPhone />}
                title="Telefon"
                value="+49 (0)2461 9163780"
              />

              <Link
                href="/kontakt"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold text-[#101510] transition hover:bg-[#eef6f0]"
              >
                <FiClock className="h-4 w-4" />
                Beratung vereinbaren
              </Link>
            </div>
          </aside>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_18px_60px_-35px_rgba(7,17,31,0.22)]">
              <div className="bg-[#101510] px-5 py-5 sm:px-7">
                <h2 className="text-[21px] font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                  Fahrzeugbewertungsanfrage
                </h2>

                <p className="mt-1 text-[13px] leading-6 text-white/70 sm:text-sm">
                  Füllen Sie das Formular aus. Wir melden uns schnellstmöglich
                  mit einer Einschätzung.
                </p>
              </div>

              <div className="p-2 sm:p-4">
                <AdminCarForm />
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
                  <FiTrendingUp className="h-5 w-5" />
                </div>

                <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-[#07111f]">
                  Unser Ablauf
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {process.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-black/[0.06] bg-[#fafbf9] p-4"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1e9] text-[14px] font-semibold text-[#146c2e]">
                      {item.step}
                    </div>

                    <h4 className="text-[15px] font-semibold text-[#07111f]">
                      {item.title}
                    </h4>

                    <p className="mt-1 text-[12px] leading-5 text-[#5f695f]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-t border-black/[0.06] bg-white py-10 sm:py-14">
        <div className={WRAPPER}>
          <div className="mb-8 text-center">
            <h2 className="text-[26px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-4xl">
              Einfach. Fair. Transparent.
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-[#5f695f]">
              Wir legen Wert auf klare Kommunikation und eine zuverlässige
              Abwicklung beim Fahrzeugankauf.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl border border-black/[0.06] bg-[#fafbf9] p-4 text-center sm:p-5"
              >
                <div className="mb-3 flex justify-center">{stat.icon}</div>

                <div className="text-[24px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-3xl">
                  {stat.value}
                </div>

                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b756b]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

function InfoBox({ icon, title, items }) {
  return (
    <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f1e9] text-[#146c2e]">
          {icon}
        </div>

        <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#07111f]">
          {title}
        </h2>
      </div>

      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#146c2e]" />

            <div>
              <p className="text-[14px] font-semibold text-[#101510]">
                {item.title}
              </p>

              <p className="mt-0.5 text-[12px] leading-5 text-[#5f695f]">
                {item.desc}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactRow({ icon, title, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#4ade80]">
        {icon}
      </div>

      <div>
        <h3 className="text-[14px] font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-[13px] text-white/70">{value}</p>
      </div>
    </div>
  );
}

export default PublicAddCarPage;
