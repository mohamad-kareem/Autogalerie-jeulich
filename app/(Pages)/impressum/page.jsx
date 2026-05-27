"use client";

import React from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaIdCard,
  FaBuilding,
} from "react-icons/fa";

const WRAPPER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

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
    <main className="min-h-screen bg-[#f5f6f3] py-6 sm:py-10 lg:py-14">
      <div className={WRAPPER}>
        <div className="mb-6 border-b border-black/[0.08] pb-4 text-center sm:mb-8 sm:pb-6">
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-4xl">
            Impressum
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-6 text-[#5f695f] sm:text-[15px]">
            Angaben gemäß § 5 TMG
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_10px_35px_-24px_rgba(7,17,31,0.18)] sm:rounded-3xl">
          <section className="px-4 py-5 sm:px-8 sm:py-8">
            <div className="mb-5 flex gap-3 sm:mb-7 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e] sm:h-12 sm:w-12 sm:rounded-2xl">
                <FaBuilding className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#07111f] sm:text-[22px]">
                  Betreiber und verantwortliche Person
                </h2>

                <p className="mt-1 text-[12px] leading-5 text-[#6b756b] sm:text-sm">
                  Rechtlich verantwortliche Angaben des Unternehmens
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-5">
              <InfoRow label="Firma" value={company.name} />
              <InfoRow label="Inhaber" value={company.person} />

              <div className="grid gap-1.5 border-b border-dashed border-black/[0.08] pb-3 sm:grid-cols-[180px,1fr] sm:gap-2 sm:pb-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b958b] sm:text-[12px]">
                  Adresse
                </span>

                <div className="flex items-start gap-2.5 sm:gap-3">
                  <FaMapMarkerAlt className="mt-1 h-3.5 w-3.5 shrink-0 text-[#146c2e] sm:h-4 sm:w-4" />

                  <div className="text-[13px] leading-6 text-[#101510] sm:text-[15px] sm:leading-7">
                    {company.street}
                    <br />
                    {company.city}, {company.country}
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5 border-b border-dashed border-black/[0.08] pb-3 sm:grid-cols-[180px,1fr] sm:gap-2 sm:pb-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b958b] sm:text-[12px]">
                  Telefon
                </span>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <FaPhoneAlt className="h-3.5 w-3.5 shrink-0 text-[#146c2e] sm:h-4 sm:w-4" />

                  <a
                    href={`tel:${company.phone.replace(/\s+/g, "")}`}
                    className="text-[13px] font-medium text-[#101510] transition hover:text-[#146c2e] sm:text-[15px]"
                  >
                    {company.phone}
                  </a>
                </div>
              </div>

              <div className="grid gap-1.5 sm:grid-cols-[180px,1fr] sm:gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b958b] sm:text-[12px]">
                  USt-IdNr.
                </span>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <FaIdCard className="h-3.5 w-3.5 shrink-0 text-[#146c2e] sm:h-4 sm:w-4" />

                  <span className="text-[13px] font-medium text-[#101510] sm:text-[15px]">
                    {company.vat}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black/[0.06] bg-[#fafbf9] px-4 py-5 sm:px-8 sm:py-8">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#07111f] sm:text-[22px]">
              Rechtliche Hinweise
            </h2>

            <div className="mt-3 space-y-3 text-[13px] leading-6 text-[#505950] sm:mt-5 sm:space-y-5 sm:text-[15px] sm:leading-8">
              <p>
                Für die auf unseren Internetseiten veröffentlichten Inhalte und
                Werke gilt das deutsche Urheberrecht. Jede Vervielfältigung,
                Bearbeitung, Verbreitung und Verwertung erfordert die
                schriftliche Zustimmung des jeweiligen Autors oder Erstellers.
              </p>

              <p>
                Unsere Seiten können Inhalte aufweisen, die nicht vom Betreiber
                selbst erstellt wurden. Bei diesen Inhalten wurden die
                Urheberrechte Dritter beachtet.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid gap-1.5 border-b border-dashed border-black/[0.08] pb-3 sm:grid-cols-[180px,1fr] sm:gap-2 sm:pb-5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b958b] sm:text-[12px]">
        {label}
      </span>

      <span className="text-[13px] font-medium text-[#101510] sm:text-[15px]">
        {value}
      </span>
    </div>
  );
}
