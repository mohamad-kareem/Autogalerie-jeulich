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
    md:top-1/2 md:right-0 md:left-auto md:translate-x-0 md:-translate-y-1/2 md:w-auto"
      >
        <div className="relative">
          {/* Sidebar */}
          <div
            className="flex flex-row justify-center bg-gradient-to-br from-red-950 to-red-600 w-fit rounded-2xl
              md:flex-col md:items-center md:rounded-l-2xl
              text-white shadow-2xl overflow-hidden"
          >
            {/* Toggle button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
            >
              <FiChevronLeft
                size={20}
                className={`${isOpen ? "rotate-180" : ""} transition-transform`}
              />
            </button>

            {/* Phone */}
            <a
              href="tel:+4924619163780"
              className="p-3 hover:bg-red-600 transition-colors duration-200"
              title="Call us"
            >
              <FiPhone size={20} />
            </a>

            {/* Email */}
            <button
              onClick={handleContactClick}
              className="p-3 hover:bg-red-600 transition-colors duration-200"
              title="Email us"
            >
              <FiMail size={20} />
            </button>

            {/* WhatsApp */}
            <a
              href="https://wa.me/4924619163780"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 hover:bg-red-600 transition-colors duration-200"
              title="WhatsApp"
            >
              <FiMessageCircle size={20} />
            </a>
          </div>

          {/* Contact Panel */}
          <div
            className={`absolute bg-white shadow-2xl overflow-hidden transform transition-all duration-300 ease-out
    left-1/2 -translate-x-1/2 bottom-full mb-1 w-80 
    md:w-80 md:top-0 md:right-full  md:bottom-auto md:rounded-xl rounded-xl md:left-auto md:translate-x-0
    ${
      isOpen
        ? "translate-y-0 md:translate-x-0 opacity-100 scale-100"
        : "translate-y-4 md:translate-x-4 opacity-0 scale-95 pointer-events-none"
    }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-2">
              <h3 className="font-bold text-lg text-center">Contact Us</h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-gray-600 text-sm">
                Do you have further questions? We're always available to assist
                you.
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:autogalerie.jülich@web.de"
                    className="text-red-600 hover:text-red-800"
                  >
                    autogalerie.jülich@web.de
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  <a
                    href="tel:+4924619163780"
                    className="text-red-600 hover:text-red-800"
                  >
                    +49 (0)2461 9163780
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{" "}
                  <a
                    href="https://wa.me/4924619163780"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-800"
                  >
                    Open App
                  </a>
                </p>
              </div>

              <button
                onClick={handleContactClick}
                className="w-full bg-gradient-to-r from-gray-950 to-red-800 hover:from-red-600 hover:to-red-700 text-white py-2 px-3 text-sm rounded-xl font-semibold shadow-lg transition-all hover:scale-[1.02]"
              >
                Contact us
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <SimpleContactFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />
    </>
  );
}
