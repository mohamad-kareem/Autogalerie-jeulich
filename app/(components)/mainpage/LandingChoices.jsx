"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Car, Calendar, FileText, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingChoices() {
  const processes = [
    {
      icon: Car,
      title: "Fahrzeugauswahl",
      description: "Finden Sie Ihr Wunschfahrzeug in unserer Premium-Auswahl",
      steps: [
        "Persönliche Bedarfsanalyse",
        "Individuelle Fahrzeugvorschläge",
        "Vollständige Transparenz",
      ],
      cta: "Zur Fahrzeugauswahl",
      link: "/gebrauchtwagen",
      accent: "blue",
    },
    {
      icon: Calendar,
      title: "Probezeit & Test",
      description: "Testen Sie Ihr Wunschfahrzeug unter Realbedingungen",
      steps: [
        "Probefahrt",
        "Ausführliche Fahrzeugvorführung",
        "Technische Beratung",
      ],
      cta: "Probefahrt vereinbaren",
      link: "/kontakt",
      accent: "emerald",
    },
    {
      icon: FileText,
      title: "Kaufabwicklung",
      description: "Professionelle Abwicklung bis zur Fahrzeugübergabe",
      steps: [
        "Transparente Finanzierung",
        "Rechtssichere Dokumente",
        "Persönliche Übergabe",
      ],
      cta: "Jetzt anfragen",
      link: "/kontakt",
      accent: "violet",
    },
  ];

  const accentColors = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
  };

  return (
    <section className="relative bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mb-6">
            Drei Schritte zum perfekten Fahrzeug
          </div>
          <h2 className="text-3xl sm:text-4xl font-playfair leading-tight text-gray-900 mb-4">
            So einfach funktioniert's
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Von der ersten Beratung bis zur Schlüsselübergabe – wir begleiten
            Sie professionell durch jeden Schritt.
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {processes.map((process, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-6 h-full hover:shadow-lg transition-all duration-300">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 ${
                    accentColors[process.accent]
                  } text-white rounded-lg mb-4`}
                >
                  <process.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {process.title}
                </h3>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {process.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {process.steps.map((step, i) => (
                    <li key={i} className="flex items-start text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={process.link}
                  className="inline-flex items-center font-semibold text-gray-900 hover:text-gray-700 transition-colors group/link"
                >
                  {process.cta}
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center text-white"
        >
          <h3 className="text-2xl font-bold mb-4">
            Starten Sie jetzt Ihren Fahrzeugkauf
          </h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Vereinbaren Sie ein unverbindliches Beratungsgespräch mit unseren
            Experten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Beratungstermin vereinbaren
            </Link>
            <Link
              href="/gebrauchtwagen"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-white font-semibold rounded-lg border border-gray-400 hover:bg-gray-700 transition-colors"
            >
              Fahrzeugbestand ansehen
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
