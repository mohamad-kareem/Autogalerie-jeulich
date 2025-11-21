import React from "react";
import { FaFacebook, FaUserShield } from "react-icons/fa";
import Link from "next/link";

const Footbar = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-6 md:px-20 w-full border-t border-slate-700/70">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <svg
                className="w-10 h-10 text-blue-400 mr-2"
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
              <span className="text-xl font-bold text-white">
                Autogalerie <span className="text-blue-400">Jülich</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Ihr zuverlässiger Partner für hochwertige Fahrzeuge und
              exzellenten Service.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.facebook.com/p/Autogalerie-J%C3%BClich-100063891427082/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors duration-300 p-2 rounded-lg hover:bg-slate-800/50"
              >
                <FaFacebook className="w-5 h-5" />
              </a>
              <Link
                href="/login"
                className="text-slate-400 hover:text-blue-400 transition-colors duration-300 p-2 rounded-lg hover:bg-slate-800/50 group relative"
                title="Admin Anmeldung"
              >
                <FaUserShield className="w-5 h-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap bg-slate-900/90 backdrop-blur-sm">
                  Admin Bereich
                </span>
              </Link>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-blue-500">
              Öffnungszeiten
            </h3>
            <ul className="text-slate-400 space-y-3">
              <li className="flex items-start group">
                <svg
                  className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="group-hover:text-slate-300 transition-colors">
                  <span className="font-medium text-slate-200">
                    Montag bis Freitag:
                  </span>{" "}
                  10:00 – 18:00 Uhr
                </div>
              </li>
              <li className="flex items-start group">
                <svg
                  className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="group-hover:text-slate-300 transition-colors">
                  <span className="font-medium text-slate-200">Samstag:</span>{" "}
                  10:00 – 15:00 Uhr
                </div>
              </li>
              <li className="flex items-start group">
                <svg
                  className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="group-hover:text-slate-300 transition-colors">
                  <span className="font-medium text-slate-200">Sonntag:</span>{" "}
                  nach telefonischer Absprache
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-blue-500">
              Kontakt
            </h3>
            <ul className="text-slate-400 space-y-3">
              <li className="flex items-start group">
                <svg
                  className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href="mailto:autogalerie.jülich@web.de"
                  className="hover:text-blue-400 transition-colors duration-300"
                >
                  autogalerie.jülich@web.de
                </a>
              </li>
              <li className="flex items-start group">
                <svg
                  className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href="tel:+4924619163780"
                  className="hover:text-blue-400 transition-colors duration-300"
                >
                  +49 (0)2461 9163780
                </a>
              </li>
              <li className="flex items-start mt-6 group">
                <svg
                  className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0 group-hover:text-blue-300 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
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
                </svg>
                <div className="group-hover:text-slate-300 transition-colors">
                  <p className="font-medium text-slate-200">Adresse</p>
                  <p>Alte Dürenerstraße 4 </p>
                  <p>52428 Jülich</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 relative pb-2 after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-blue-500">
              Rechtliches
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/impressum"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-300 flex items-center group"
                >
                  <svg
                    className="w-4 h-4 text-blue-400 mr-2 transform group-hover:translate-x-1 transition-transform duration-300"
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
                  Impressum
                </a>
              </li>
              <li>
                <a
                  href="/Datenschutz"
                  className="text-slate-400 hover:text-blue-400 transition-colors duration-300 flex items-center group"
                >
                  <svg
                    className="w-4 h-4 text-blue-400 mr-2 transform group-hover:translate-x-1 transition-transform duration-300"
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
                  Datenschutz
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="pt-8 border-t border-slate-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500 text-center md:text-left">
              © 2025{" "}
              <span className="font-semibold text-slate-300">
                Autogalerie Jülich
              </span>
              . Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-slate-600 mt-2 md:mt-0">
              Professionelle Fahrzeugdienstleistungen seit Jahren
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footbar;
