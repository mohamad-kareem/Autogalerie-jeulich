"use client";

import React from "react";

export default function ImpressumPage() {
  const companies = [
    {
      name: "Autogalerie Jülich",
      person: "Jibrail Alawie",
      street: "Alte Dürenerstraße 4",
      city: "52428 Jülich",
      country: "Deutschland",
      phone: "+49 176 32445082",
      vat: "DE 317574583",
    },
    {
      name: "Autogalerie Jülich",
      person: "Hussein Karim",
      street: "Alte Dürenerstraße 4",
      city: "52428 Jülich",
      country: "Deutschland",
      phone: "+49 1523 4205041",
      vat: "DE 305423608",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 mt-5">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Impressum
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Angaben gemäß § 5 TMG – Verantwortlich für den Inhalt dieser Seite
            sind die nachfolgend genannten Inhaber.
          </p>
        </div>

        {/* Company cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {companies.map((c, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 border border-gray-200 p-8"
            >
              {/* Gradient accent bar */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-black rounded-t-2xl" />

              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {c.name}
              </h2>
              <ul className="space-y-3 text-gray-700 text-base">
                <li>
                  <span className="font-semibold">Inhaber:</span> {c.person}
                </li>
                <li>{c.street}</li>
                <li>
                  {c.city}, {c.country}
                </li>
                <li>
                  <span className="font-semibold">Tel.:</span>{" "}
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, "")}`}
                    className="text-red-700 hover:text-red-900 hover:underline"
                  >
                    {c.phone}
                  </a>
                </li>
                <li>
                  <span className="font-semibold">
                    Umsatzsteuer-Identifikationsnr.:
                  </span>{" "}
                  {c.vat}
                </li>
              </ul>
            </div>
          ))}
        </div>

        {/* Legal note */}
        <div className="mt-16 bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10 text-gray-600 text-sm leading-relaxed">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Rechtliche Hinweise
          </h3>
          <p>
            Für die auf unseren Internetseiten veröffentlichten Inhalte und
            Werke gilt das deutsche Urheberrecht. Jede Vervielfältigung,
            Bearbeitung, Verbreitung und Verwertung erfordert die schriftliche
            Zustimmung des jeweiligen Autors oder Erstellers. Downloads und
            Kopien dieser Seiten sind ausschließlich für den privaten,
            nichtkommerziellen Gebrauch zulässig. Unsere Seiten können Inhalte
            aufweisen, die nicht vom Betreiber selbst erstellt wurden. Bei
            diesen Inhalten wurden die Urheberrechte Dritter beachtet. Inhalte,
            an denen Dritte das Urheberrecht innehaben, sind entsprechend
            gekennzeichnet. Stellen Sie auf unseren Internetseiten trotzdem
            einen Urheberrechtsverstoß fest, bitten wir, uns dies mitzuteilen.
            Wir werden den entsprechenden Inhalt dann umgehend von unseren
            Webseiten entfernen.
          </p>
        </div>
      </div>
    </main>
  );
}
