"use client";

import React from "react";
import { Mail, Cookie, ShieldCheck } from "lucide-react";

export default function DatenschutzPage() {
  const sections = [
    {
      id: 1,
      title: "Kontaktaufnahme",
      icon: <Mail className="w-8 h-8 text-red-700" />,
      text: "Wenn Sie uns über unser Kontaktformular oder per E-Mail kontaktieren, werden Ihre Angaben (z. B. Name, Telefonnummer, E-Mail-Adresse) ausschließlich zur Bearbeitung Ihrer Anfrage verwendet. Eine Weitergabe an Dritte erfolgt nicht.",
    },
    {
      id: 2,
      title: "Cookies",
      icon: <Cookie className="w-8 h-8 text-red-700" />,
      text: "Unsere Website verwendet nur technisch notwendige Cookies, um die Funktionalität zu gewährleisten. Es findet kein Tracking oder Profiling statt.",
    },
    {
      id: 3,
      title: "Ihre Rechte",
      icon: <ShieldCheck className="w-8 h-8 text-red-700" />,
      text: (
        <>
          Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre
          gespeicherten personenbezogenen Daten sowie das Recht auf
          Berichtigung, Löschung oder Einschränkung der Verarbeitung. Wenden Sie
          sich hierzu bitte an die im{" "}
          <a
            href="/impressum"
            className="text-red-700 hover:text-red-900 hover:underline"
          >
            Impressum
          </a>{" "}
          angegebenen Kontaktdaten.
        </>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Datenschutzerklärung
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-lg">
            Wir legen großen Wert auf den Schutz Ihrer persönlichen Daten.
            Nachfolgend finden Sie die wichtigsten Informationen.
          </p>
        </div>

        {/* Sections */}
        <div className="grid gap-10">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8"
            >
              <div className="flex-shrink-0">{section.icon}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {section.title}
                </h2>
                <p className="text-gray-700 leading-relaxed">{section.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
