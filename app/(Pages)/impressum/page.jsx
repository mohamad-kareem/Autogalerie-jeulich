"use client";

import React from "react";

export default function ImpressumPage() {
  const company = {
    name: "Autogalerie Jülich",
    person: "Hussein Karim",
    street: "Alte Dürenerstraße 4",
    city: "52428 Jülich",
    country: "Deutschland",
    phone: "+49 1523 4205041",
    vat: "DE 305423608",
  };

  return (
    <main className="bg-white py-12 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Impressum
          </h1>
          <p className="mt-2 text-gray-600">Angaben gemäß § 5 TMG</p>
        </div>

        {/* Company details */}
        <section className="mb-12">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Betreiber und verantwortliche Person
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-gray-700">
            <div className="font-medium">Firma</div>
            <div>{company.name}</div>

            <div className="font-medium">Inhaber</div>
            <div>{company.person}</div>

            <div className="font-medium">Adresse</div>
            <div>
              {company.street}
              <br />
              {company.city}, {company.country}
            </div>

            <div className="font-medium">Telefon</div>
            <div>
              <a
                href={`tel:${company.phone.replace(/\s+/g, "")}`}
                className="text-gray-800 hover:underline"
              >
                {company.phone}
              </a>
            </div>

            <div className="font-medium">USt-IdNr.</div>
            <div>{company.vat}</div>
          </div>
        </section>

        {/* Legal notice */}
        <section className="border-t border-gray-200 pt-8 text-gray-600 text-sm leading-relaxed">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            Rechtliche Hinweise
          </h2>
          <p className="mb-3">
            Für die auf unseren Internetseiten veröffentlichten Inhalte und
            Werke gilt das deutsche Urheberrecht. Jede Vervielfältigung,
            Bearbeitung, Verbreitung und Verwertung erfordert die schriftliche
            Zustimmung des jeweiligen Autors oder Erstellers. Downloads und
            Kopien dieser Seiten sind ausschließlich für den privaten,
            nichtkommerziellen Gebrauch zulässig.
          </p>
          <p>
            Unsere Seiten können Inhalte aufweisen, die nicht vom Betreiber
            selbst erstellt wurden. Bei diesen Inhalten wurden die Urheberrechte
            Dritter beachtet. Inhalte, an denen Dritte das Urheberrecht
            innehaben, sind entsprechend gekennzeichnet. Stellen Sie auf unseren
            Internetseiten trotzdem einen Urheberrechtsverstoß fest, bitten wir,
            uns dies mitzuteilen. Wir werden den entsprechenden Inhalt dann
            umgehend von unseren Webseiten entfernen.
          </p>
        </section>
      </div>
    </main>
  );
}
