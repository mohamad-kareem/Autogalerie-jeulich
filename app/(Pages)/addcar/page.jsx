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
    <main className="min-h-screen bg-neutral-50 ">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black to-red-950 py-12 md:py-24 px-4 sm:px-6 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-[length:100px_100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 pt-15 leading-tight tracking-tight">
            Verkaufen Sie Ihr Auto <span className="text-red-400">mühelos</span>
          </h1>
          <p className="text-base sm:text-xl md:text-2xl mb-8 md:mb-10 max-w-3xl mx-auto text-gray-300 font-light leading-relaxed">
            Erhalten Sie innerhalb von Minuten ein wettbewerbsfähiges,
            unverbindliches Angebot von unserem Händler. Überspringen Sie den
            Stress von Privatverkäufen und Verhandlungen mit Händlern.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-full border border-white/20">
              <FiCheckCircle className="mr-2 md:mr-3 text-emerald-400" />
              <span className="font-medium text-sm md:text-base">
                Sofortangebot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 md:py-16 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Side - Information */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-gray-900">
                <FiInfo className="mr-2 md:mr-3 text-red-600" />
                <span className="bg-gradient-to-br from-black to-red-950 bg-clip-text text-transparent">
                  Warum uns wählen?
                </span>
              </h2>
              <ul className="space-y-3 md:space-y-5">
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
                      <div className="h-2 w-2 md:h-2.5 md:w-2.5 bg-gradient-to-r from-red-500 to-red-700 rounded-full"></div>
                    </div>
                    <div className="ml-3 md:ml-4">
                      <p className="text-gray-900 font-medium text-sm md:text-base">
                        {item.title}
                      </p>
                      <p className="text-gray-600 text-xs md:text-sm mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center text-gray-900">
                <FiUpload className="mr-2 md:mr-3 text-red-600" />
                <span className="bg-gradient-to-br from-black to-red-950 bg-clip-text text-transparent">
                  Benötigte Dokumente
                </span>
              </h2>
              <p className="text-gray-600 mb-3 md:mb-5 text-sm md:text-base leading-relaxed">
                Für das genaueste Angebot bereiten Sie bitte diese Dokumente
                vor:
              </p>
              <ul className="space-y-2 md:space-y-4">
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
                    <p className="ml-2 md:ml-3 text-gray-700 text-sm md:text-base">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-black to-red-950 p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-200 shadow-lg">
              <div className="flex items-start mb-4 md:mb-6">
                <div className="bg-white/10 p-2 md:p-3 rounded-lg md:rounded-xl backdrop-blur-sm">
                  <FiMail className="text-white text-lg md:text-xl" />
                </div>
                <div className="ml-3 md:ml-4">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    E-Mail an unser Team
                  </h3>
                  <p className="text-red-200 hover:text-white transition-colors text-sm md:text-base">
                    autogalerie.jülich@web.de
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white/10 p-2 md:p-3 rounded-lg md:rounded-xl backdrop-blur-sm">
                  <FiPhone className="text-white text-lg md:text-xl" />
                </div>
                <div className="ml-3 md:ml-4">
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Direkte Linie
                  </h3>
                  <p className="text-red-200 hover:text-white transition-colors text-sm md:text-base">
                    +49 (0)2461 9163780
                  </p>
                </div>
              </div>
              <Link
                href="/kontakt"
                className="w-full mt-6 md:mt-8 bg-white text-gray-900 font-medium py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center text-sm md:text-base"
              >
                <FiClock className="mr-2" />
                Beratung vereinbaren
              </Link>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
              <div className="bg-gradient-to-br from-black to-red-950 px-6 py-5 md:px-8 md:py-7">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  Fahrzeugbewertungsanfrage
                </h2>
                <p className="text-gray-300 font-light text-sm md:text-base">
                  Füllen Sie dieses Formular aus und erhalten Sie innerhalb von
                  24 Stunden Ihr wettbewerbsfähiges Angebot
                </p>
              </div>
              <div className="p-4 md:p-6 lg:p-8">
                <AdminCarForm />
              </div>
            </div>

            <div className="mt-6 md:mt-10 bg-white p-6 md:p-8 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 flex items-center">
                <FiTrendingUp className="mr-2 md:mr-3 text-red-600" />
                Unser effizienter Prozess
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                    <div className="bg-gray-50 p-4 md:p-6 rounded-lg md:rounded-xl border border-gray-200 hover:border-red-300 transition-all duration-300 h-full group-hover:shadow-md">
                      <div className="text-red-600 font-bold text-2xl md:text-3xl mb-2 md:mb-4">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2 text-base md:text-lg">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-20 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              Vertrauen von Tausenden von Verkäufern
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Unser Engagement für Transparenz und faire Preise macht uns zur
              ersten Wahl für anspruchsvolle Autoverkäufer in ganz Deutschland.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              {
                icon: (
                  <FiAward className="text-2xl md:text-3xl mb-2 md:mb-3 text-red-600" />
                ),
                value: "500+",
                label: "Fahrzeuge erworben",
              },
              {
                icon: (
                  <FiCheckCircle className="text-2xl md:text-3xl mb-2 md:mb-3 text-red-600" />
                ),
                value: "98%",
                label: "Zufriedenheitsrate",
              },
              {
                icon: (
                  <FiClock className="text-2xl md:text-3xl mb-2 md:mb-3 text-red-600" />
                ),
                value: "24h",
                label: "Durchschn. Antwortzeit",
              },
              {
                icon: (
                  <FiFileText className="text-2xl md:text-3xl mb-2 md:mb-3 text-red-600" />
                ),
                value: "€0",
                label: "Versteckte Gebühren",
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center">{stat.icon}</div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 uppercase text-xs tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </main>
  );
};

export default PublicAddCarPage;
