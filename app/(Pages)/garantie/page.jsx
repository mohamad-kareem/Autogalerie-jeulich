// app/garantie/page.jsx
import Button from "@/app/(components)/Button";
import Footbar from "@/app/(components)/Footbar";
import Link from "next/link";
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
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiMinus,
} from "react-icons/fi";

export default function GarantiePage() {
  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="relative bg-black/90 text-white py-30 text-center mb-10">
          <div className="absolute inset-0 bg-opacity-50 bg-[url('/pattern.png')]"></div>
          <div className="container mx-auto px-6 relative z-10">
            <span className="inline-flex items-center bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6 text-red-600">
              <FiShield className="h-4 w-4 mr-1.5" />
              Premium Protection
            </span>
            <h1 className="text-5xl font-serif font-bold leading-tight text-white sm:text-6xl mb-5">
              Unser Garantieversprechen
            </h1>
            <div className="w-24 h-1 bg-red-900 mx-auto mb-8"></div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Jedes bei uns gekaufte Fahrzeug wird mit einer{" "}
              <span className="font-semibold text-red-600">
                12-monatigen Premium-Garantie
              </span>{" "}
              ausgeliefert - für absoluten Fahrspaß ohne Sorgen.
            </p>
          </div>
        </section>

        {/* Warranty Badge */}
        <div className="relative max-w-4xl mx-auto mb-20">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-300 rounded-2xl blur-md opacity-30"></div>
          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid md:grid-cols-3 divide-x divide-gray-100">
              <div className="p-8 text-center">
                <div className="mx-auto bg-red-50/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FiClock className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  12 Monate
                </h3>
                <p className="text-gray-500">Garantiedauer</p>
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto bg-red-50/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FiAward className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Deutschlandweit
                </h3>
                <p className="text-gray-500">
                  Gültig in allen Partnerwerkstätten
                </p>
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto bg-red-50/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FiMapPin className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  20.000 km
                </h3>
                <p className="text-gray-500">
                  Oder 12 Monate (je nachdem was zuerst eintritt)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-24">
          {/* Covered Components */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-10">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-xl mr-5 border border-green-200">
                  <FiCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Abgedeckte Komponenten
                  </h2>
                  <p className="text-green-600 font-medium">
                    Volle Absicherung der Hauptsysteme
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <FiSettings />,
                    title: "Motor & Getriebe",
                    desc: "Alle wesentlichen Bauteile",
                  },
                  {
                    icon: <FiCpu />,
                    title: "Elektronik",
                    desc: "Steuergeräte & Sensoren",
                  },
                  {
                    icon: <FiLayers />,
                    title: "Antriebsstrang",
                    desc: "Differential, Antriebswellen",
                  },
                  {
                    icon: <FiTruck />,
                    title: "Fahrwerk",
                    desc: "Aufhängung & Federung",
                  },
                  {
                    icon: <FiSliders />,
                    title: "Klimaanlage",
                    desc: "Kompressor & Kältemittel",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50/50 p-4 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start">
                      <span className="text-green-500 mt-0.5 mr-3 flex-shrink-0">
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-10">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-br from-red-200 to-red-50 p-3 rounded-xl mr-5 border border-red-200">
                  <FiXCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Nicht abgedeckt
                  </h2>
                  <p className="text-red-600 font-medium">
                    Reguläre Verschleißteile
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  {
                    icon: <FiDroplet />,
                    title: "Bremsen",
                    items: ["Beläge", "Scheiben", "Flüssigkeit"],
                  },
                  {
                    icon: <FiCalendar />,
                    title: "Reifen",
                    items: ["Sommer/Winterreifen", "Notrad", "Schläuche"],
                  },
                  {
                    icon: <FiSliders />,
                    title: "Filter",
                    items: ["Luftfilter", "Ölfilter", "Innenraumfilter"],
                  },
                  {
                    icon: <FiDroplet />,
                    title: "Flüssigkeiten",
                    items: ["Motoröl", "Kühlmittel", "Scheibenwaschmittel"],
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50/50 p-4 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-start">
                      <span className="text-red-500 mt-0.5 mr-3 flex-shrink-0">
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.items.map((subItem, subIndex) => (
                            <span
                              key={subIndex}
                              className="bg-white px-2.5 py-1 rounded-full text-sm text-gray-600 border border-gray-200"
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

        {/* Conditions & CTA */}
        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-black/80 to-red-800 rounded-2xl p-10 text-white">
              <h3 className="text-2xl font-bold mb-6">Garantiebedingungen</h3>
              <div className="space-y-6">
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
                ].map((item, index) => (
                  <div key={index} className="border-l-2 border-red-400 pl-5">
                    <h4 className="font-semibold text-lg mb-1.5">
                      {item.title}
                    </h4>
                    <p className="text-gray-300">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-10 h-full flex flex-col">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Garantie in Anspruch nehmen
                </h3>
                <p className="text-gray-600 mb-6">
                  Unser Garantieservice steht Ihnen montags bis freitags von
                  8:00 bis 18:00 Uhr zur Verfügung.
                </p>

                <div className="space-y-4">
                  <Link href="/kontakt" passHref>
                    <Button>
                      <span className="flex items-center">
                        <FiMail className="h-5 w-5 mr-2" />
                        Online-Formular
                      </span>
                    </Button>
                  </Link>

                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mt-4">
                    <div className="flex items-start mb-4">
                      <FiPhone className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Telefonische Beratung
                        </h4>
                        <p className="text-red-600 font-medium">
                          +49 (0)2461 9163780
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiMail className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">E-Mail</h4>
                        <p className="text-red-600 font-medium">
                          info@autogalerie-juelich.de
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-start">
                  <FiAlertCircle className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-gray-500">
                    Bitte halten Sie Ihre Fahrzeugpapiere und den Kaufvertrag
                    bereit, wenn Sie Garantieansprüche geltend machen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Note */}
        <div className="bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
          <div className="flex items-start">
            <FiAward className="h-6 w-6 text-gray-500 mt-0.5 mr-4 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                Rechtliche Hinweise
              </h4>
              <p className="text-gray-600 mb-4">
                Diese Garantiebedingungen stellen eine freiwillige Leistung
                unseres Unternehmens dar und gehen über die gesetzliche
                Gewährleistung hinaus. Die Garantie gilt nur für den Erstkäufer
                und ist nicht übertragbar. Voraussetzung ist die korrekte
                Wartung des Fahrzeugs gemäß Herstellervorgaben.
              </p>
              <p className="text-gray-600">
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
