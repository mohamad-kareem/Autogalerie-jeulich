"use client";

import React, { useState } from "react";
import {
  FiPhone,
  FiMail,
  FiMessageCircle,
  FiChevronLeft,
} from "react-icons/fi";
import SimpleContactFormModal from "./SimpleContactFormModal";

export default function FloatingContact() {
  const [showForm, setShowForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleContactClick = () => {
    setShowForm(true);
    setIsOpen(false);
  };

  return (
    <>
      <div
        className="fixed z-[9999]
        bottom-0 left-1/2 -translate-x-1/2 w-fit
        md:top-1/2 md:right-0 md:left-auto md:translate-x-0 md:-translate-y-1/2 md:w-auto
        print:hidden"
      >
        <div className="relative">
          {/* Compact floating rail */}
          <div
            className="flex flex-row justify-center bg-slate-900/95 border border-slate-700/70
            backdrop-blur-md w-fit rounded-2xl
            md:flex-col md:items-center md:rounded-l-2xl
            text-slate-100 shadow-2xl overflow-hidden"
          >
            {/* Toggle button */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              aria-label="Kontaktbereich öffnen"
              className="p-2.5 hover:bg-slate-800/90 transition-colors duration-200 flex items-center justify-center"
            >
              <FiChevronLeft
                size={18}
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {/* Telefon */}
            <a
              href="tel:+4924619163780"
              className="p-2.5 hover:bg-slate-800/90 transition-colors duration-200 flex items-center justify-center"
              title="Anrufen"
            >
              <FiPhone size={18} />
            </a>
            {/* E-Mail / Kontaktformular */}
            <button
              onClick={handleContactClick}
              className="p-2.5 hover:bg-slate-800/90 transition-colors duration-200 flex items-center justify-center"
              title="Kontaktformular"
            >
              <FiMail size={18} />
            </button>
            {/* WhatsApp */}
            <a
              href="https://wa.me/4915234205041"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 hover:bg-slate-800/90 transition-colors duration-200 flex items-center justify-center"
              title="WhatsApp"
            >
              <FiMessageCircle size={18} />
            </a>
          </div>

          {/* Kontakt-Panel */}
          <div
            className={`absolute bg-white shadow-2xl overflow-hidden transform transition-all duration-250 ease-out
            left-1/2 -translate-x-1/2 bottom-full mb-1 w-80
            md:w-80 md:top-1/2 md:-translate-y-1/2 md:right-full md:bottom-auto md:rounded-xl rounded-md md:left-auto md:translate-x-0
            ${
              isOpen
                ? "translate-y-0 md:translate-x-0 opacity-100 scale-100 pointer-events-auto"
                : "translate-y-3 md:translate-x-3 opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-50 px-3 py-2.5 border-b border-slate-700/60">
              <h3 className="font-medium text-sm tracking-wide text-center uppercase">
                Kontakt
              </h3>
            </div>

            {/* Inhalt */}
            <div className="p-4 space-y-3 text-sm text-slate-700">
              <p className="  text-xs sm:text-base text-slate-600 text-center">
                Wir sind gerne für Sie da
              </p>
              <div className=" bg-slate-200 border-b-2 "></div>

              <div className="space-y-1.5">
                <p className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wide text-slate-500">
                    E-Mail :
                  </span>
                  <a
                    href="mailto:autogalerie.jülich@web.de"
                    className="text-slate-900 hover:text-slate-700 underline underline-offset-2 decoration-slate-400"
                  >
                    autogalerie.jülich@web.de
                  </a>
                </p>

                <p className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wide text-slate-500">
                    Telefon :
                  </span>
                  <a
                    href="tel:+4924619163780"
                    className="text-slate-900 hover:text-slate-700"
                  >
                    +49 (0)2461 9163780
                  </a>
                </p>

                <p className="flex flex-col gap-0.5">
                  <span className="text-[12px] uppercase tracking-wide text-slate-500">
                    WhatsApp :
                  </span>
                  <a
                    href="https://wa.me/4915234205041"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-900 hover:text-slate-700"
                  >
                    Chat öffnen
                  </a>
                </p>
              </div>

              <div className="pt-1 flex justify-center">
                <button
                  onClick={handleContactClick}
                  className="inline-flex items-center gap-1.5  bg-slate-900 text-slate-50 px-4 py-1.5 text-xs font-medium shadow-md hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-[1px]"
                >
                  <FiMail size={14} />
                  <span>Kontaktformular öffnen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kontakt-Modal */}
      <SimpleContactFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </>
  );
}
