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

export default function FinanzierungPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative bg-black/90 text-white py-32 text-center">
        <div className="absolute inset-0 bg-opacity-50 bg-[url('/pattern.png')]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
            Fahrzeugfinanzierung
          </h1>
          <div className="w-24 h-1 bg-red-900 mx-auto mb-8"></div>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
            Wir unterstützen Sie bei der optimalen Finanzierungslösung in
            Zusammenarbeit mit Ihrem Kreditinstitut.
          </p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <p className="text-gray-600 text-lg mb-2">FINANZIERUNGSLÖSUNGEN</p>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">
            Individuelle Finanzierungsmodelle für Ihren Fahrzeugkauf
          </h2>
          <div className="w-16 h-0.5 bg-red-900 mx-auto mb-12"></div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
            Als erfahrener Partner vermitteln wir zwischen Ihnen und Ihrem
            Kreditinstitut, um Ihnen attraktive Finanzierungsbedingungen für Ihr
            Wunschfahrzeug zu ermöglichen.
          </p>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={<FaUniversity className="w-5 h-5" />}
              title="Bankenunabhängige Beratung"
              description="Wir arbeiten mit allen Kreditinstituten zusammen und helfen Ihnen, die besten Konditionen zu finden."
            />
            <InfoCard
              icon={<FaChartLine className="w-5 h-5" />}
              title="Transparente Konditionen"
              description="Vollständige Offenlegung aller Kosten und Raten - keine versteckten Gebühren."
            />
            <InfoCard
              icon={<FaFileAlt className="w-5 h-5" />}
              title="Dokumentenvorbereitung"
              description="Wir stellen alle notwendigen Unterlagen für Ihre Finanzierungsanfrage zusammen."
            />
            <InfoCard
              icon={<FaHandshake className="w-5 h-5" />}
              title="Langfristige Partnerschaft"
              description="Betreuung über die gesamte Laufzeit Ihrer Finanzierung."
            />
            <InfoCard
              icon={<FaShieldAlt className="w-5 h-5" />}
              title="Sicherheit & Diskretion"
              description="Ihre Daten behandeln wir mit höchster Vertraulichkeit nach DSGVO-Standards."
            />
            <InfoCard
              icon={<FaInfoCircle className="w-5 h-5" />}
              title="Umfassende Beratung"
              description="Klären Sie alle Fragen zu Ballonfinanzierung, Leasing oder Vollfinanzierung."
            />
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-serif font-bold text-center mb-16 text-gray-900">
            Unser Finanzierungsprozess
          </h2>
          <div className="space-y-12">
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
      </section>
    </div>
  );
}

const InfoCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-sm shadow-sm hover:shadow-md transition-all border border-gray-100 h-full">
    <div className="inline-flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-sm mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

const ProcessStep = ({ number, title, description }) => (
  <div className="flex">
    <div className="flex-shrink-0 mr-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white font-serif text-xl">
        {number}
      </div>
    </div>
    <div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);
