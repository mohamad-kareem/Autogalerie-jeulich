import React from "react";

const Footbar = () => {
  return (
    <footer className="bg-white text-black py-12 px-6 md:px-20 mt-20 w-full shadow-inner">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Opening Hours */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Öffnungszeiten
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <span className="font-medium">Montag bis Freitag:</span> 9:30 –
              18:00 Uhr
            </li>
            <li>
              <span className="font-medium">Samstag:</span> 10:00 – 15:00 Uhr
            </li>
            <li>
              <span className="font-medium">Sonntag:</span> nach telefonischer
              Absprache
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Kontakt</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <span className="font-medium">E-Mail:</span>{" "}
              info@autogalerie-juelich.de
            </li>
            <li>
              <span className="font-medium">Telefon:</span> +49 2461 9163780
            </li>
          </ul>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rechtliches
          </h3>
          <div className="flex space-x-4">
            <a
              href="#"
              className="text-base font-medium text-gray-700 hover:text-red-500 transition duration-300"
            >
              Impressum
            </a>
            <a
              href="#"
              className="text-base font-medium text-gray-700 hover:text-red-500 transition duration-300"
            >
              Datenschutz
            </a>
            <a
              href="#"
              className="text-base font-medium text-gray-700 hover:text-red-500 transition duration-300"
            >
              AGB
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-8 border-gray-200" />

      {/* Bottom Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          © 2025{" "}
          <span className="font-semibold text-black">Autogalerie Jülich</span>.
          Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
};

export default Footbar;
