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
import Footbar from "@/app/(components)/Footbar";

export default function FinanzierungPage() {
  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section - Compact on mobile */}
        <section className="relative bg-black text-white py-16 sm:py-20 md:py-28 lg:py-32 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] bg-cover opacity-20" />
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-serif font-bold leading-tight mb-4 sm:mb-6 mt-10 sm:mt-2">
              Fahrzeugfinanzierung
            </h1>
            <div className="w-16 sm:w-20 h-1 bg-red-900 mx-auto mb-4 sm:mb-6" />
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Wir unterstützen Sie bei der optimalen Finanzierungslösung in
              Zusammenarbeit mit Ihrem Kreditinstitut.
            </p>
          </div>
        </section>

        {/* Value Proposition - Adjusted spacing */}
        <section className="py-12 sm:py-16 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
            <p className="text-gray-600 text-xs sm:text-sm uppercase tracking-wider mb-2 sm:mb-3">
              Finanzierungslösungen
            </p>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-gray-900 mb-4 sm:mb-6">
              Individuelle Finanzierungsmodelle
            </h2>
            <div className="w-12 sm:w-16 h-0.5 bg-red-900 mx-auto mb-6 sm:mb-8" />
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Als erfahrener Partner vermitteln wir zwischen Ihnen und Ihrem
              Kreditinstitut, um Ihnen attraktive Finanzierungsbedingungen für
              Ihr Wunschfahrzeug zu ermöglichen.
            </p>
          </div>
        </section>

        {/* Info Section - Stacked cards on mobile */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard
                icon={<FaUniversity className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Bankenunabhängige Beratung"
                description="Wir arbeiten mit allen Kreditinstituten zusammen und helfen Ihnen, die besten Konditionen zu finden."
              />
              <InfoCard
                icon={<FaChartLine className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Transparente Konditionen"
                description="Vollständige Offenlegung aller Kosten und Raten - keine versteckten Gebühren."
              />
              <InfoCard
                icon={<FaFileAlt className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Dokumentenvorbereitung"
                description="Wir stellen alle notwendigen Unterlagen für Ihre Finanzierungsanfrage zusammen."
              />
              <InfoCard
                icon={<FaHandshake className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Langfristige Partnerschaft"
                description="Betreuung über die gesamte Laufzeit Ihrer Finanzierung."
              />
              <InfoCard
                icon={<FaShieldAlt className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Sicherheit & Diskretion"
                description="Ihre Daten behandeln wir mit höchster Vertraulichkeit nach DSGVO-Standards."
              />
              <InfoCard
                icon={<FaInfoCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Umfassende Beratung"
                description="Klären Sie alle Fragen zu Ballonfinanzierung, Leasing oder Vollfinanzierung."
              />
            </div>
          </div>
        </section>

        {/* Process Section  */}

        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Process steps */}
              <div className="w-full lg:w-1/2">
                <h2 className="text-xl sm:text-3xl font-serif font-bold text-center lg:text-left mb-8 sm:mb-12 text-gray-900">
                  Unser Finanzierungsprozess
                </h2>
                <div className="space-y-8 sm:space-y-10 lg:space-y-12">
                  <ProcessStep
                    number="1"
                    title="Beratungsgespräch"
                    description="Gemeinsam ermitteln wir Ihre Wünsche und finanziellen Rahmenbedingungen."
                  />
                  <ProcessStep
                    number="2"
                    title="Angebotserstellung"
                    description="Sie erhalten ein detailliertes Finanzierungsangebot mit allen relevanten Konditionen."
                  />
                  <ProcessStep
                    number="3"
                    title="Dokumentenprüfung"
                    description="Wir prüfen gemeinsam mit Ihnen alle notwendigen Unterlagen für die Bank."
                  />
                  <ProcessStep
                    number="4"
                    title="Finanzierungsbestätigung"
                    description="Nach positiver Prüfung erhalten Sie die Zusage Ihres Kreditinstituts."
                  />
                </div>
              </div>
              {/* Left image */}
              <div className="w-full lg:w-1/2">
                <div className="relative w-full h-64 sm:h-80 lg:h-full">
                  <Image
                    src={finance}
                    alt="Finanzierungsprozess"
                    className="rounded-md object-cover shadow-md"
                    priority
                    width={2200}
                    height={2200}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footbar />
    </>
  );
}

// InfoCard Component - More compact on mobile
const InfoCard = ({ icon, title, description }) => (
  <div className="bg-white p-4 sm:p-6 rounded-md shadow-sm hover:shadow-md transition-all border border-gray-100 h-full flex flex-col">
    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-red-100 text-red-600 rounded-md mb-3 sm:mb-4">
      {icon}
    </div>
    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-800">
      {title}
    </h3>
    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
      {description}
    </p>
  </div>
);

// ProcessStep Component - Adjusted spacing
const ProcessStep = ({ number, title, description }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mr-3 sm:mr-4 lg:mr-6">
      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-serif text-base sm:text-lg lg:text-xl">
        {number}
      </div>
    </div>
    <div>
      <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 mb-1 sm:mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
        {description}
      </p>
    </div>
  </div>
);
