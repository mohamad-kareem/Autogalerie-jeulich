"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronRight, Clock, CheckCircle } from "lucide-react";
import bclasse from "@/app/(assets)/bclasse.png";
import beetle from "@/app/(assets)/beetle.png";
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
      gültigBis: "10.07.2025",
      ctaText: "Fahrzeugdetails ansehen",
      ctaLink:
        "https://xn--autogaleriejlich-uzb.de/gebrauchtwagen/685ff99a3f637c5db42b11f4",
      highlight: "Limitiertes Angebot",
    },
    {
      id: 2,
      title: "Sommerangebot 2025",
      description: "Exklusive Ersparnisse bei ausgewählten Modellen",
      image: beetle,
      preis: "11.999€",
      gültigBis: "10.07.2025",
      ctaText: "Fahrzeugdetails ansehen",
      ctaLink:
        "https://xn--autogaleriejlich-uzb.de/gebrauchtwagen/685d0e7c3f637c5db429fbbe",
      highlight: "Limitiertes Angebot",
    },
    {
      id: 3,
      title: "Sommerangebot 2025",
      description: "Exklusive Ersparnisse bei ausgewählten Modellen",
      image: bclasse,
      preis: "5.799€",
      gültigBis: "10.07.2025",
      ctaText: "Fahrzeugdetails ansehen",
      ctaLink:
        "https://xn--autogaleriejlich-uzb.de/gebrauchtwagen/685bbd8d3f637c5db4298a3f",
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
    }, 5000); // Langsamere Animation für bessere Lesbarkeit
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
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-md"
          aria-label="Angebot schließen"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Fahrzeugbild */}
          <div className="lg:col-span-2 relative h-64 lg:h-auto">
            <Image
              src={angebote[currentOffer].image}
              alt={angebote[currentOffer].title}
              fill
              className="object-center "
              priority
              quality={100}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-3xl font-bold">
                {angebote[currentOffer].preis}
              </span>
              <p className="text-sm">Inkl. MwSt. und Zulassung</p>
            </div>
          </div>

          {/* Angebotsdetails */}
          <div className="p-6 lg:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <span className="text-xs font-semibold px-3 py-1 bg-gray-100 rounded-full text-gray-700 inline-block">
                  {angebote[currentOffer].highlight}
                </span>
                <div className="flex justify-center mt-4 space-x-2">
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

              <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                {angebote[currentOffer].title}
              </h3>
              <p className="text-gray-600 mb-6">
                {angebote[currentOffer].description}
              </p>

              <div className="flex items-center text-sm text-gray-500 mb-8">
                <Clock className="w-4 h-4 mr-2" />
                <span>Gültig bis: {angebote[currentOffer].gültigBis}</span>
              </div>
            </div>

            <div>
              <div className="mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span>Nur begrenzte Verfügbarkeit</span>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <a
                  href={angebote[currentOffer].ctaLink}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-center transition-colors flex items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {angebote[currentOffer].ctaText}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </a>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
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
