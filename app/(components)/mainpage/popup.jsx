"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronRight, Clock, CheckCircle } from "lucide-react";
import corsa1 from "@/app/(assets)/corsa1.png";
import test from "@/app/(assets)/test.png";

import micra from "@/app/(assets)/micra.png";

const PreisPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const angebote = [
    {
      id: 1,
      title: "Sommerangebot 2025",
      description: "Exklusive Ersparnisse bei ausgewählten Modellen",
      image: micra,
      preis: "9.999€",
      gültigBis: "29.07.2025",
      ctaText: "Fahrzeugdetails ansehen",
      ctaLink:
        "https://xn--autogaleriejlich-uzb.de/gebrauchtwagen/685ff99a3f637c5db42b11f4",
      highlight: "Limitiertes Angebot",
    },
    {
      id: 2,
      title: "Sommerangebot 2025",
      description: "Exklusive Ersparnisse bei ausgewählten Modellen",
      image: test,
      preis: "10.999€",
      gültigBis: "29.07.2025",
      ctaText: "Fahrzeugdetails ansehen",
      ctaLink:
        "https://xn--autogaleriejlich-uzb.de/gebrauchtwagen/68793479e4a8d63b6d1f8d57",
      highlight: "Limitiertes Angebot",
    },
    {
      id: 3,
      title: "Sommerangebot 2025",
      description: "Exklusive Ersparnisse bei ausgewählten Modellen",
      image: corsa1,
      preis: "6.999 €",
      gültigBis: "29.07.2025",
      ctaText: "Fahrzeugdetails ansehen",
      ctaLink:
        "https://xn--autogaleriejlich-uzb.de/gebrauchtwagen/686415c73f637c5db42c8d8d",
      highlight: "Limitiertes Angebot",
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % angebote.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden transition-transform duration-300 ${
          isClosing ? "scale-95" : "scale-100"
        }`}
      >
        {/* Schließen-Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-20 p-1 sm:p-2 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-md"
          aria-label="Angebot schließen"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Fahrzeugbild - Mobile first */}
          <div className="relative h-48 sm:h-64 w-full lg:w-2/3 lg:h-auto aspect-video lg:aspect-auto">
            <Image
              src={angebote[currentOffer].image}
              alt={angebote[currentOffer].title}
              fill
              className="object-center"
              priority
              quality={100}
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />

            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 text-white">
              <span className="text-xl sm:text-3xl font-bold">
                {angebote[currentOffer].preis}
              </span>
              <p className="text-xs sm:text-sm">Inkl. MwSt. und Zulassung</p>
            </div>
          </div>

          {/* Angebotsdetails */}
          <div className="p-4 sm:p-6 lg:p-6 flex flex-col justify-between w-full lg:w-1/3">
            <div>
              <div className="mb-2 sm:mb-4">
                <span className="text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1 bg-gray-100 rounded-full text-gray-700 inline-block">
                  {angebote[currentOffer].highlight}
                </span>
                <div className="flex justify-center mt-2 sm:mt-4 space-x-1 sm:space-x-2">
                  {angebote.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOffer(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentOffer ? "bg-gray-900" : "bg-gray-300"
                      }`}
                      aria-label={`Angebot ${index + 1} anzeigen`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-2 sm:mt-4 mb-1 sm:mb-2">
                {angebote[currentOffer].title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {angebote[currentOffer].description}
              </p>

              <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span>Gültig bis: {angebote[currentOffer].gültigBis}</span>
              </div>
            </div>

            <div>
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" />
                  <span>Nur begrenzte Verfügbarkeit</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 sm:space-y-3">
                <a
                  href={angebote[currentOffer].ctaLink}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-center transition-colors flex items-center justify-center text-sm sm:text-base"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {angebote[currentOffer].ctaText}
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                </a>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 sm:px-6 sm:py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Weiter browsen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreisPopup;
