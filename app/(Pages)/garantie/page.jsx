// app/garantie/page.jsx
import React from "react";
import Link from "next/link";
import Button from "@/app/(components)/Button";
import Footbar from "@/app/(components)/Footbar";
import {
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiCpu,
  FiLayers,
  FiTruck,
  FiSliders,
  FiDroplet,
  FiCalendar,
  FiMail,
  FiPhone,
  FiAlertCircle,
  FiAward,
  FiMapPin,
} from "react-icons/fi";

export default function GarantiePage() {
  return (
    <>
      <div className="min-h-screen bg-neutral-50 overflow-x-hidden  ">
        {/* Hero Section - Made more compact on mobile */}
        <section className="relative bg-black text-white py-16 sm:py-24 lg:py-28 text-center mb-8 sm:mb-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] bg-cover opacity-20" />
          <div className="relative z-10 px-4 sm:px-6 max-w-4xl mx-auto">
            <span className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 text-red-500 sm:text-red-600">
              <FiShield className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Premium Protection
            </span>
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-serif font-bold leading-snug sm:leading-tight mb-4 sm:mb-6">
              Unser Garantieversprechen
            </h1>
            <div className="w-16 sm:w-24 h-1 bg-red-900 mx-auto mb-6 sm:mb-8" />
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Jedes bei uns gekaufte Fahrzeug wird mit einer{" "}
              <span className="font-semibold text-red-400 sm:text-red-600">
                12-monatigen Premium-Garantie
              </span>{" "}
              ausgeliefert.
            </p>
          </div>
        </section>

        {/* Warranty Badge - Stacked on mobile */}
        <div className="relative max-w-4xl mx-auto mb-16 sm:mb-20 px-4">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-300 rounded-xl sm:rounded-2xl blur-md opacity-30" />
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {[
                {
                  icon: (
                    <FiClock className="h-6 sm:h-8 w-6 sm:w-8 text-red-600" />
                  ),
                  title: "12 Monate",
                  desc: "Garantiedauer",
                },
                {
                  icon: (
                    <FiAward className="h-6 sm:h-8 w-6 sm:w-8 text-red-600" />
                  ),
                  title: "Deutschlandweit",
                  desc: "Gültig in allen Partnerwerkstätten",
                },
                {
                  icon: (
                    <FiMapPin className="h-6 sm:h-8 w-6 sm:w-8 text-red-600" />
                  ),
                  title: "20.000 km",
                  desc: "Oder 12 Monate (je nachdem was zuerst eintritt)",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-6 sm:p-8 text-center">
                  <div className="mx-auto bg-red-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coverage Section - Stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 px-4 max-w-7xl mx-auto mb-16 sm:mb-24">
          {/* Covered Components */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center mb-6 sm:mb-8">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-4 sm:mr-5 border border-green-200">
                  <FiCheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Abgedeckte Komponenten
                  </h2>
                  <p className="text-green-600 text-sm sm:text-base font-medium">
                    Volle Absicherung der Hauptsysteme
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    icon: <FiSettings className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Motor & Getriebe",
                    desc: "Alle wesentlichen Bauteile",
                  },
                  {
                    icon: <FiCpu className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Elektronik",
                    desc: "Steuergeräte & Sensoren",
                  },
                  {
                    icon: <FiLayers className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Antriebsstrang",
                    desc: "Differential, Antriebswellen",
                  },
                  {
                    icon: <FiTruck className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Fahrwerk",
                    desc: "Aufhängung & Federung",
                  },
                  {
                    icon: <FiSliders className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Klimaanlage",
                    desc: "Kompressor & Kältemittel",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start">
                      <span className="text-green-500 mt-0.5 mr-2 sm:mr-3">
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="font-medium text-sm sm:text-base text-gray-900">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Excluded Items */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-gray-100">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center mb-6 sm:mb-8">
                <div className="bg-red-100 p-2 sm:p-3 rounded-lg sm:rounded-xl mr-4 sm:mr-5 border border-red-200">
                  <FiXCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Nicht abgedeckt
                  </h2>
                  <p className="text-red-500 sm:text-red-600 text-sm sm:text-base font-medium">
                    Reguläre Verschleißteile
                  </p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {[
                  {
                    icon: <FiDroplet className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Bremsen",
                    items: ["Beläge", "Scheiben", "Flüssigkeit"],
                  },
                  {
                    icon: <FiCalendar className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Reifen",
                    items: ["Sommer/Winterreifen", "Notrad", "Schläuche"],
                  },
                  {
                    icon: <FiSliders className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Filter",
                    items: ["Luftfilter", "Ölfilter", "Innenraumfilter"],
                  },
                  {
                    icon: <FiDroplet className="h-4 w-4 sm:h-5 sm:w-5" />,
                    title: "Flüssigkeiten",
                    items: ["Motoröl", "Kühlmittel", "Scheibenwaschmittel"],
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start">
                      <span className="text-red-500 mt-0.5 mr-2 sm:mr-3">
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="font-medium text-sm sm:text-base text-gray-900">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                          {item.items.map((subItem, subIdx) => (
                            <span
                              key={subIdx}
                              className="bg-white px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm text-gray-600 border border-gray-200"
                            >
                              {subItem}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conditions & CTA - Stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 px-4 max-w-7xl mx-auto mb-16 sm:mb-20">
          {/* Conditions */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-black/80 to-red-800 text-white rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Garantiebedingungen
              </h3>
              <div className="space-y-4 sm:space-y-6">
                {[
                  {
                    title: "Wartungspflicht",
                    content:
                      "Einhaltung aller vom Hersteller vorgeschriebenen Wartungsintervalle und Serviceleistungen durch autorisierte Werkstätten.",
                  },
                  {
                    title: "Reparaturanforderungen",
                    content:
                      "Alle Reparaturen müssen durch unsere autorisierten Partnerwerkstätten durchgeführt werden. Selbst durchgeführte Reparaturen führen zum Garantieverlust.",
                  },
                  {
                    title: "Dokumentation",
                    content:
                      "Vorlage des vollständigen Servicehefts mit Stempel der autorisierten Werkstatt bei Garantieansprüchen erforderlich.",
                  },
                  {
                    title: "Übertragbarkeit",
                    content:
                      "Die Garantie ist nicht übertragbar bei Weiterverkauf des Fahrzeugs und erlischt in diesem Fall.",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="border-l-2 border-red-400 pl-4 sm:pl-5"
                  >
                    <h4 className="font-semibold text-base sm:text-lg mb-1 sm:mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-gray-300 text-sm sm:text-base">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Box */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-200 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Garantie in Anspruch nehmen
              </h3>
              <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
                Unser Garantieservice steht Ihnen montags bis freitags von 8:00
                bis 18:00 Uhr zur Verfügung.
              </p>

              <div className="space-y-3 sm:space-y-4">
                <Link href="/kontakt" passHref>
                  <Button className="w-full">
                    <span className="flex items-center justify-center">
                      <FiMail className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Online-Formular
                    </span>
                  </Button>
                </Link>

                <div className="bg-gray-50 p-4 sm:p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start mb-3 sm:mb-4">
                    <FiPhone className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 mr-2 sm:mr-3" />
                    <div>
                      <h4 className="font-medium text-sm sm:text-base text-gray-900">
                        Telefonische Beratung
                      </h4>
                      <p className="text-red-500 sm:text-red-600 font-medium text-sm sm:text-base">
                        +49 (0)2461 9163780
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FiMail className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 mr-2 sm:mr-3" />
                    <div>
                      <h4 className="font-medium text-sm sm:text-base text-gray-900">
                        E-Mail
                      </h4>
                      <p className="text-red-500 sm:text-red-600 font-medium text-sm sm:text-base break-all">
                        info@autogalerie-juelich.de
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex items-start">
                <FiAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-0.5 mr-2 sm:mr-3" />
                <p className="text-xs sm:text-sm text-gray-500">
                  Bitte halten Sie Ihre Fahrzeugpapiere und den Kaufvertrag
                  bereit, wenn Sie Garantieansprüche geltend machen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Note */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-6 sm:p-8 lg:p-10  mb-16 sm:mb-20  border border-gray-200">
          <div className="flex items-start">
            <FiAward className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 mt-0.5  sm:mr-4" />
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">
                Rechtliche Hinweise
              </h4>
              <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">
                Diese Garantiebedingungen stellen eine freiwillige Leistung
                unseres Unternehmens dar und gehen über die gesetzliche
                Gewährleistung hinaus. Die Garantie gilt nur für den Erstkäufer
                und ist nicht übertragbar. Voraussetzung ist die korrekte
                Wartung des Fahrzeugs gemäß Herstellervorgaben.
              </p>
              <p className="text-gray-600 text-sm sm:text-base">
                Änderungen und Irrtümer vorbehalten. Stand:{" "}
                {new Date().toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                })}
                . Die vollständigen Garantiebedingungen erhalten Sie bei
                Fahrzeugübergabe.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footbar />
    </>
  );
}
