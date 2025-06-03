"use client";

import {
  FiInfo,
  FiShield,
  FiDollarSign,
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

const PublicAddCarPage = () => {
  return (
    <main className="bg-gradient-to-br from-black/95 to-red-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black to-red-950 py-16 md:py-28 px-4 sm:px-6 lg:px-8 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-[length:100px_100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            Verkaufen Sie Ihr Auto <br className="hidden sm:block" />
            <span className="text-red-400">mühelos</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto text-gray-300 font-light leading-relaxed">
            Erhalten Sie innerhalb von Minuten ein wettbewerbsfähiges,
            unverbindliches Angebot von unserem Händler. Überspringen Sie den
            Stress von Privatverkäufen und Verhandlungen mit Händlern.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
              <FiCheckCircle className="mr-3 text-emerald-400" />
              <span className="font-medium">Sofortangebot</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Left Side - Information */}
          <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                <FiInfo className="mr-3 text-red-600" />
                <span className="bg-gradient-to-br from-black to-red-950 bg-clip-text text-transparent">
                  Warum uns wählen?
                </span>
              </h2>
              <ul className="space-y-4">
                {[
                  {
                    title: "Stressfreier Prozess",
                    desc: "Keine Anzeigen, Besichtigungen oder Verhandlungen",
                  },
                  {
                    title: "Sofortige Zahlung",
                    desc: "Erhalten Sie die Zahlung sofort nach Annahme",
                  },
                  {
                    title: "Expertenbewertung",
                    desc: "Präzise Marktbewertung durch unsere Spezialisten",
                  },
                  {
                    title: "Vereinfachte Papierarbeit",
                    desc: "Wir erledigen alle Dokumente für Sie",
                  },
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2.5 w-2.5 bg-gradient-to-r from-red-500 to-red-700 rounded-full"></div>
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-900 font-medium">{item.title}</p>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
                <FiUpload className="mr-3 text-red-600" />
                <span className="bg-gradient-to-br from-black to-red-950 bg-clip-text text-transparent">
                  Benötigte Dokumente
                </span>
              </h2>
              <p className="text-gray-600 mb-5 text-base leading-relaxed">
                Für das genaueste Angebot bereiten Sie bitte diese Dokumente
                vor:
              </p>
              <ul className="space-y-3">
                {[
                  "Fahrzeugschein und Fahrzeugbrief",
                  "Service- und Wartungsunterlagen",
                  "Aktuelle Fotos (Innenraum, Außenansicht, Kilometerstand)",
                  "Kilometerstand und Zustandsdetails",
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-gradient-to-r from-red-500 to-red-700 rounded-full"></div>
                    </div>
                    <p className="ml-3 text-gray-700">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-black to-red-950 p-8 rounded-2xl border border-gray-200 shadow-lg">
              <div className="flex items-start mb-6">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <FiMail className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white">
                    E-Mail an unser Team
                  </h3>
                  <p className="text-red-200 hover:text-white transition-colors">
                    autogalerie.jülich@web.de
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                  <FiPhone className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white">
                    Direkte Linie
                  </h3>
                  <p className="text-red-200 hover:text-white transition-colors">
                    +49 (0)2461 9163780
                  </p>
                </div>
              </div>
              <Link
                href="/kontakt"
                className="w-full mt-8 bg-white text-gray-900 font-medium py-3 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <FiClock className="mr-2" />
                Beratung vereinbaren
              </Link>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
              <div className="bg-gradient-to-br from-black to-red-950 px-8 py-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Fahrzeugbewertungsanfrage
                </h2>
                <p className="text-gray-300 font-light">
                  Füllen Sie dieses Formular aus und erhalten Sie innerhalb von
                  24 Stunden Ihr wettbewerbsfähiges Angebot
                </p>
              </div>
              <div className="p-10  pt-4">
                <AdminCarForm />
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold mb-8 text-gray-900 flex items-center">
                <FiTrendingUp className="mr-3 text-red-600" />
                Unser effizienter Prozess
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    title: "Details einreichen",
                    desc: "Geben Sie genaue Fahrzeuginformationen und Fotos über unser sicheres Formular an",
                  },
                  {
                    step: "2",
                    title: "Angebot erhalten",
                    desc: "Erhalten Sie eine faire Marktbewertung von unseren Experten innerhalb eines Werktages",
                  },
                  {
                    step: "3",
                    title: "Verkauf abschließen",
                    desc: "Nehmen Sie unser Angebot an und wir organisieren die Abholung mit sofortiger Zahlung",
                  },
                ].map((item, index) => (
                  <div key={index} className="group">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-red-300 transition-all duration-300 h-full group-hover:shadow-md">
                      <div className="text-red-600 font-bold text-3xl mb-4">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="bg-gradient-to-b from-gray-100 to-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vertrauen von Tausenden von Verkäufern
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Unser Engagement für Transparenz und faire Preise macht uns zur
              ersten Wahl für anspruchsvolle Autoverkäufer in ganz Deutschland.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: <FiAward className="text-3xl mb-3 text-red-600" />,
                value: "500+",
                label: "Fahrzeuge erworben",
              },
              {
                icon: <FiCheckCircle className="text-3xl mb-3 text-red-600" />,
                value: "98%",
                label: "Zufriedenheitsrate",
              },
              {
                icon: <FiClock className="text-3xl mb-3 text-red-600" />,
                value: "24h",
                label: "Durchschn. Antwortzeit",
              },
              {
                icon: <FiFileText className="text-3xl mb-3 text-red-600" />,
                value: "€0",
                label: "Versteckte Gebühren",
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center">{stat.icon}</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 uppercase text-xs tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </main>
  );
};

export default PublicAddCarPage;
