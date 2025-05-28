// app/garantie/page.jsx
import React from "react";
import Link from "next/link";
import Button from "@/app/(components)/helpers/Button";
import Footbar from "@/app/(components)/mainpage/Footbar";
import Head from "next/head";
import garantieLogo from "@/app/(assets)/garantie.jpg";
import Image from "next/image";

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
  FiGlobe,
  FiDollarSign,
  FiTrendingUp,
  FiShieldOff,
} from "react-icons/fi";

export default function GarantiePage() {
  return (
    <>
      <Head>
        <title>Garantie | Auto Galerie Jülich</title>
        <meta name="robots" content="index,follow" />
        <meta
          name="description"
          content="Premium-Garantie für Gebrauchtwagen in Kooperation mit CarGarantie® - Sicherheit und Schutz für Ihr Fahrzeug"
        />
      </Head>
      <div className="min-h-screen bg-gray-100 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-black to-red-950 text-white py-20 sm:py-28 lg:py-32 text-center mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] bg-cover opacity-10" />
          <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto">
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-full text-sm sm:text-base font-medium text-white mb-6">
                <FiShield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="mr-2">Premium Protection by</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
                Unser Garantie-Versprechen
              </h1>
              <div className="w-24 h-1.5 bg-red-900 mx-auto mb-8" />
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
                Jedes Fahrzeug wird mit einer individuellen{" "}
                <span className="font-semibold text-white">
                  CarGarantie® Absicherung
                </span>{" "}
                ausgeliefert - maßgeschneidert für Ihr Auto.
              </p>
            </div>
          </div>
        </section>

        {/* Warranty Benefits */}
        <div className="relative max-w-6xl mx-auto mb-20 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <FiDollarSign className="h-8 w-8 text-red-600" />,
                title: "Kostenschutz",
                desc: "Volle Absicherung bei Reparaturen",
                bg: "bg-gradient-to-br from-white to-red-50",
              },
              {
                icon: <FiGlobe className="h-8 w-8 text-red-600" />,
                title: "Europaweit",
                desc: "Gültig in über 5.000 Partnerwerkstätten",
                bg: "bg-gradient-to-br from-white to-blue-50",
              },
              {
                icon: <FiTrendingUp className="h-8 w-8 text-red-600" />,
                title: "Wertsteigerung",
                desc: "Erhöht den Wiederverkaufswert",
                bg: "bg-gradient-to-br from-white to-green-50",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`${item.bg} rounded-xl shadow-lg border border-gray-200 p-8 text-center transition-all hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-200">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Image
              src={garantieLogo}
              alt="CarGarantie Logo"
              width={160}
              height={40}
              className="h-20 object-contain opacity-90"
            />
          </div>
        </div>

        {/* Coverage Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 max-w-6xl mx-auto mb-20">
          {/* Protection Benefits */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-red-900 p-6">
              <div className="flex items-center">
                <FiCheckCircle className="h-8 w-8 text-white mr-4" />
                <h2 className="text-2xl font-bold text-white">
                  Ihr CarGarantie® Schutz
                </h2>
              </div>
              <p className="text-red-200 mt-2">
                Individuelle Pakete für jeden Bedarf
              </p>
            </div>
            <div className="p-6 space-y-5">
              {[
                {
                  icon: <FiShield className="h-5 w-5 text-green-600" />,
                  title: "Flexible Laufzeiten",
                  desc: "12, 24 oder 36 Monate Schutz - passend zu Ihrem Fahrzeug",
                },
                {
                  icon: <FiClock className="h-5 w-5 text-green-600" />,
                  title: "Keine Vorleistungen",
                  desc: "Wir übernehmen die Abwicklung mit der Werkstatt",
                },
                {
                  icon: <FiDollarSign className="h-5 w-5 text-green-600" />,
                  title: "Transparente Konditionen",
                  desc: "Keine versteckten Kosten oder Überraschungen",
                },
                {
                  icon: <FiTruck className="h-5 w-5 text-green-600" />,
                  title: "Schnelle Hilfe",
                  desc: "24/7 Notfallservice im gesamten EU-Raum",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="mt-0.5 mr-3">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage Options */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-blue-900 p-6">
              <div className="flex items-center">
                <FiSettings className="h-8 w-8 text-white mr-4" />
                <h2 className="text-2xl font-bold text-white">Schutzumfänge</h2>
              </div>
              <p className="text-blue-200 mt-2">
                Drei maßgeschneiderte Optionen
              </p>
            </div>
            <div className="p-6 space-y-5">
              {[
                {
                  icon: <FiCpu className="h-5 w-5 text-blue-600" />,
                  title: "Basis-Schutz",
                  items: [
                    "Motor & Getriebe",
                    "Antriebsstrang",
                    "Hauptelektronik",
                  ],
                },
                {
                  icon: <FiLayers className="h-5 w-5 text-blue-600" />,
                  title: "Komfort-Paket",
                  items: [
                    "Alle Basis-Komponenten",
                    "Klimaanlage",
                    "Fahrerassistenzsysteme",
                  ],
                },
                {
                  icon: <FiShieldOff className="h-5 w-5 text-blue-600" />,
                  title: "Nicht enthalten",
                  items: [
                    "Verschleißteile",
                    "Karosserieschäden",
                    "Unfallfolgen",
                  ],
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="mt-0.5 mr-3">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.items.map((subItem, subIdx) => (
                        <span
                          key={subIdx}
                          className="bg-white px-3 py-1 rounded-full text-sm text-gray-600 border border-gray-200 shadow-sm"
                        >
                          {subItem}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200 text-center">
                <Image
                  src={garantieLogo}
                  alt="CarGarantie Logo"
                  width={160}
                  height={40}
                  className="h-8 object-contain mx-auto"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Alle Garantien werden durch CarGarantie® bereitgestellt
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="px-4 max-w-6xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-gray-900 to-red-900 text-white rounded-xl p-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold">CarGarantie® Leistungen</h3>
            </div>
            <div className="space-y-6">
              {[
                {
                  title: "Fahrzeugprüfung",
                  content:
                    "Vor Vertragsabschluss erfolgt eine detaillierte technische Untersuchung durch unsere Sachverständigen.",
                },
                {
                  title: "Europaweiter Schutz",
                  content:
                    "Die Garantie gilt in über 5.000 zertifizierten Werkstätten in ganz Europa.",
                },
                {
                  title: "Transparente Abwicklung",
                  content:
                    "Keine versteckten Kosten - alle Leistungen sind im Vertrag klar definiert.",
                },
                {
                  title: "Schnelle Hilfe",
                  content:
                    "24-Stunden-Pannenhilfe inklusive - weltweit gültig für die Vertragslaufzeit.",
                },
              ].map((item, idx) => (
                <div key={idx} className="border-l-2 border-red-400 pl-5">
                  <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-gray-300">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Note */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-20 border border-gray-200 mx-4 max-w-6xl mx-auto">
          <div className="flex items-start">
            <FiAward className="h-6 w-6 text-gray-500 mt-0.5 mr-4" />
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                Rechtliche Hinweise
              </h4>
              <p className="text-gray-600">
                Die CarGarantie® ist eine freiwillige Leistung der Auto Galerie
                Jülich in Kooperation mit unserem Partner CarGarantie®. Sie
                stellt keine gesetzliche Gewährleistung dar. Der genaue Umfang
                ergibt sich aus dem individuellen Garantievertrag. Voraussetzung
                ist ein einwandfreier technischer Zustand des Fahrzeugs bei
                Vertragsabschluss. Änderungen und Irrtümer vorbehalten. Stand:{" "}
                {new Date().toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                })}
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footbar />
    </>
  );
}
