// app/finanzierung/page.jsx
import React from "react";
import {
  FaUniversity,
  FaInfoCircle,
  FaHandshake,
  FaChartLine,
  FaFileAlt,
  FaShieldAlt,
} from "react-icons/fa";
import Image from "next/image";
import finance from "@/app/(assets)/finance.jpg";
import Footbar from "@/app/(components)/mainpage/Footbar";
import Head from "next/head";

export default function FinanzierungPage() {
  return (
    <>
      <Head>
        <title>Finanzierung | Auto Galerie Jülich</title>
        <meta name="robots" content="index,follow" />
        <meta
          name="description"
          content="Individuelle Fahrzeugfinanzierung - maßgeschneiderte Lösungen für Ihren Autokauf"
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 overflow-x-hidden">
        {/* Hero Section with Gradient */}
        <section className="relative bg-gradient-to-br from-black/30  to-slate-800 text-white py-24 sm:py-32 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] bg-cover opacity-10" />
          <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto">
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-full text-sm sm:text-base font-medium text-white mb-6">
                <FaUniversity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span>Finanzierungsservice</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
                Individuelle Fahrzeugfinanzierung
              </h1>
              <div className="w-24 h-1.5 bg-slate-900 mx-auto mb-8" />
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                Maßgeschneiderte Lösungen in Zusammenarbeit mit führenden
                Kslateitinstituten
              </p>
            </div>
          </div>
        </section>

        {/* Process Section with Image */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-1/2">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
                    Unser Finanzierungsprozess
                  </h2>
                  <div className="w-16 h-1 bg-slate-900 mb-6" />
                  <p className="text-gray-600">
                    Einfach, transparent und kundenorientiert - von der ersten
                    Beratung bis zur Zusage
                  </p>
                </div>

                <div className="space-y-8">
                  {[
                    {
                      number: "1",
                      title: "Beratungsgespräch",
                      description:
                        "Gemeinsam ermitteln wir Ihre Wünsche und finanziellen Rahmenbedingungen.",
                    },
                    {
                      number: "2",
                      title: "Angebotserstellung",
                      description:
                        "Sie erhalten ein detailliertes Finanzierungsangebot mit allen relevanten Konditionen.",
                    },
                    {
                      number: "3",
                      title: "Dokumentenprüfung",
                      description:
                        "Wir prüfen gemeinsam mit Ihnen alle notwendigen Unterlagen für die Bank.",
                    },
                    {
                      number: "4",
                      title: "Finanzierungsbestätigung",
                      description:
                        "Nach positiver Prüfung erhalten Sie die Zusage Ihres Kslateitinstituts.",
                    },
                  ].map((step) => (
                    <div key={step.number} className="flex items-start">
                      <div className="flex-shrink-0 mr-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-900 to-slate-950 text-white flex items-center justify-center font-serif text-xl">
                          {step.number}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2">
                <Image
                  src={finance}
                  alt="Finanzierungsprozess"
                  className="rounded-xl shadow-2xl"
                  width={800}
                  height={600}
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-900 to-slate-900 text-white">
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-4">
                Unsere Finanzierungsvorteile
              </h2>
              <div className="w-16 h-1 bg-slate-400 mx-auto mb-6" />
              <p className="text-gray-300 max-w-3xl mx-auto text-lg">
                Warum Sie Ihre Finanzierung über uns abschließen sollten
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <FaUniversity className="text-xl" />,
                  title: "Bankenunabhängig",
                  description:
                    "Wir arbeiten mit allen Kslateitinstituten für die besten Konditionen",
                },
                {
                  icon: <FaInfoCircle className="text-xl" />,
                  title: "Ehrliche Beratung",
                  description: "Transparente Informationen ohne Verkaufsdruck",
                },
                {
                  icon: <FaFileAlt className="text-xl" />,
                  title: "Dokumentenservice",
                  description:
                    "Wir bereiten alle notwendigen Unterlagen für Sie vor",
                },
                {
                  icon: <FaChartLine className="text-xl" />,
                  title: "Attraktive Zinsen",
                  description:
                    "Zugang zu speziellen Konditionen durch unsere Partnerschaften",
                },
                {
                  icon: <FaShieldAlt className="text-xl" />,
                  title: "Sicherheit",
                  description:
                    "Ihre Daten behandeln wir mit höchster Vertraulichkeit",
                },
                {
                  icon: <FaHandshake className="text-xl" />,
                  title: "Langfristige Betreuung",
                  description:
                    "Wir bleiben auch nach Abschluss Ihr Ansprechpartner",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-white">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Value Proposition Cards */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
                Ihr Weg zur optimalen Finanzierung
              </h2>
              <div className="w-16 h-1 bg-slate-900 mx-auto mb-6" />
              <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                Wir vermitteln zwischen Ihnen und Ihrem Kslateitinstitut für
                attraktive Konditionen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-lg p-8 border border-gray-200 transform transition-all hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <FaHandshake className="text-slate-600 text-xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Persönliche Beratung
                </h3>
                <p className="text-gray-600">
                  Individuelle Lösungen basierend auf Ihren finanziellen
                  Rahmenbedingungen
                </p>
              </div>

              <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-lg p-8 border border-gray-200 transform transition-all hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <FaChartLine className="text-slate-600 text-xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Transparente Konditionen
                </h3>
                <p className="text-gray-600">
                  Klare Offenlegung aller Kosten und Raten - keine versteckten
                  Gebühren
                </p>
              </div>

              <div className="bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-lg p-8 border border-gray-200 transform transition-all hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <FaShieldAlt className="text-slate-600 text-xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Diskrete Abwicklung
                </h3>
                <p className="text-gray-600">
                  Höchste Vertraulichkeit Ihrer Daten
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footbar />
    </>
  );
}
