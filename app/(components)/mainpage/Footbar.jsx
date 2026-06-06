import React from "react";
import { FaFacebook, FaUserShield } from "react-icons/fa";
import Link from "next/link";

const Footbar = () => {
  return (
    <footer className="w-full border-t-2 border-[#ffdeb9] bg-white text-[#121812]">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8 ">
        {/* Main Content */}
        <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center">
              <svg
                className="mr-2 h-10 w-10 text-[#146c2e]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>

              <span className="text-xl font-black tracking-[-0.02em] text-[#121812]">
                Autogalerie <span className="text-[#146c2e]">Jülich</span>
              </span>
            </div>

            <p className="mb-4 text-sm font-medium leading-6 text-[#6b746b]">
              Ihr zuverlässiger Partner für hochwertige Fahrzeuge.
            </p>

            <div className="mt-6 flex space-x-3">
              <a
                href="https://www.facebook.com/p/Autogalerie-J%C3%BClich-100063891427082/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-black/10 bg-white p-2 text-[#6b746b] transition hover:border-[#146c2e]/30 hover:bg-[#f1f6f2] hover:text-[#146c2e]"
                aria-label="Facebook"
              >
                <FaFacebook className="h-5 w-5" />
              </a>

              <Link
                href="/login"
                className="group relative rounded-xl border border-black/10 bg-white p-2 text-[#6b746b] transition hover:border-[#146c2e]/30 hover:bg-[#f1f6f2] hover:text-[#146c2e]"
                title="Admin Anmeldung"
                aria-label="Admin Anmeldung"
              >
                <FaUserShield className="h-5 w-5" />

                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#121812] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                  Admin Bereich
                </span>
              </Link>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="relative mb-6 pb-2 text-lg font-black text-[#121812] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-[#146c2e]">
              Öffnungszeiten
            </h3>

            <ul className="space-y-3 text-sm font-medium text-[#6b746b]">
              <FooterInfo iconType="clock">
                <span className="font-bold text-[#121812]">
                  Montag bis Freitag:
                </span>{" "}
                10:00 – 18:00 Uhr
              </FooterInfo>

              <FooterInfo iconType="clock">
                <span className="font-bold text-[#121812]">Samstag:</span> 10:00
                – 15:00 Uhr
              </FooterInfo>

              <FooterInfo iconType="clock">
                <span className="font-bold text-[#121812]">Sonntag:</span> nach
                telefonischer Absprache
              </FooterInfo>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="relative mb-6 pb-2 text-lg font-black text-[#121812] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-[#146c2e]">
              Kontakt
            </h3>

            <ul className="space-y-3 text-sm font-medium text-[#6b746b]">
              <FooterInfo iconType="mail">
                <a
                  href="mailto:autogalerie.jülich@web.de"
                  className="transition hover:text-[#146c2e]"
                >
                  autogalerie.jülich@web.de
                </a>
              </FooterInfo>

              <FooterInfo iconType="phone">
                <a
                  href="tel:+492461916006613"
                  className="transition hover:text-[#146c2e]"
                >
                  +49 (0)2461 9163780
                </a>
              </FooterInfo>

              <FooterInfo iconType="location" className="mt-6">
                <div>
                  <p className="font-bold text-[#121812]">Adresse</p>
                  <p>Alte Dürenerstraße 4</p>
                  <p>52428 Jülich</p>
                </div>
              </FooterInfo>
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="relative mb-6 pb-2 text-lg font-black text-[#121812] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-[#146c2e]">
              Rechtliches
            </h3>

            <ul className="space-y-3">
              <LegalItem href="/impressum">Impressum</LegalItem>
              <LegalItem href="/Datenschutz">Datenschutz</LegalItem>
            </ul>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="border-t border-black/5 pt-6">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p className="text-center text-sm font-medium text-[#6b746b] md:text-left">
              © 2026{" "}
              <span className="font-bold text-[#121812]">
                Autogalerie Jülich
              </span>
              . Alle Rechte vorbehalten.
            </p>

            <p className="text-xs font-medium text-[#8b938b]">
              Professionelle Fahrzeugdienstleistungen seit Jahren
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

function FooterInfo({ children, iconType, className = "" }) {
  return (
    <li className={`group flex items-start ${className}`}>
      <FooterIcon type={iconType} />

      <div className="transition-colors group-hover:text-[#121812]">
        {children}
      </div>
    </li>
  );
}

function LegalItem({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center text-sm font-medium text-[#6b746b] transition hover:text-[#146c2e]"
      >
        <svg
          className="mr-2 h-4 w-4 text-[#146c2e] transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {children}
      </Link>
    </li>
  );
}

function FooterIcon({ type }) {
  const paths = {
    clock: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    mail: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
    phone: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    ),
    location: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </>
    ),
  };

  return (
    <svg
      className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-[#146c2e] transition-colors group-hover:text-[#0f5724]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths[type]}
    </svg>
  );
}

export default Footbar;
