"use client";

import React, { useState } from "react";
import Image from "next/image";
import Hero2 from "../../(assets)/Hero2.jpeg";
import Footbar from "@/app/(components)/mainpage/Footbar";
import Head from "next/head";

import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function ContactPage({ carId, carName, carLink }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!privacy) {
      alert("Bitte akzeptieren Sie die Datenschutzerklärung.");
      return;
    }

    setStatus("loading");

    const payload = {
      name: `${firstName} ${lastName}`,
      email,
      phone,
      subject,
      message,
      carId,
      carName,
      carLink,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
        setPrivacy(false);
      } else {
        console.error(data);
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <>
      <Head>
        <title>Home | Auto Galerie Jülich</title>
        <meta name="robots" content="index,follow" />
        <meta
          name="description"
          content="Auto Galerie Jülich – Beste Gebrauchtwagen in NRW."
        />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className="relative bg-black h-[400px] sm:h-[400px]">
          <div className="absolute inset-0 overflow-hidden opacity-60">
            {/* Small screens (fill + cover) */}
            <div className="relative h-[400px] sm:h-[400px] lg:hidden">
              <Image
                src={Hero2}
                alt="Dealership Showroom"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Large screens (standard image with aspect ratio) */}
            <div className="hidden lg:block">
              <Image
                src={Hero2}
                alt="Dealership Showroom"
                width={1920}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-4xl">
              Kontaktieren Sie uns
            </h1>
            <p className="mt-6 text-2xl text-white max-w-3xl mx-auto">
              Wir beraten Sie gerne persönlich zu Ihrem nächsten Fahrzeug.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Autogalerie Jülich
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <MapPinIcon className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Adresse
                        </h3>
                        <p className="mt-1 text-gray-600">
                          Alte Dürenerstraße 4<br />
                          52428 Jülich
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <PhoneIcon className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Telefon
                        </h3>
                        <p className="mt-1 text-gray-600">
                          +49 (0)2461 9163780
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          Mo–Fr 9:00–18:00 • Sa 10:00–14:00
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          E-Mail
                        </h3>
                        <a
                          href="mailto:anfrage@juelicherautozentrum.de"
                          className="mt-1 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          info@autogalerie-juelich.de
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-96">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2515.2826803796497!2d6.37113927576914!3d50.918487653555246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bf5c0643671421%3A0x2fbe6b78cebf739a!2sAlte%20D%C3%BCrener%20Str.%204%2C%2052428%20J%C3%BClich!5e0!3m2!1sen!2sde!4v1745751132011!5m2!1sen!2sde"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-xl"
                ></iframe>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Kontaktformular
              </h2>
              <p className="text-gray-600 mb-6">
                Schreiben Sie uns eine Nachricht – wir melden uns
                schnellstmöglich bei Ihnen.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Vorname*
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="last-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nachname*
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    E-Mail Adresse*
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Telefonnummer
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Betreff*
                  </label>
                  <select
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Allgemeine Anfrage">
                      Allgemeine Anfrage
                    </option>
                    <option value="Probefahrt vereinbaren">
                      Probefahrt vereinbaren
                    </option>
                    <option value="Finanzierungsanfrage">
                      Finanzierungsanfrage
                    </option>
                    <option value="Inzahlungnahme">Inzahlungnahme</option>
                    <option value="Service-Termin">Service-Termin</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Ihre Nachricht*
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
                  ></textarea>
                </div>

                {/* Privacy */}
                <div className="flex items-start">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    required
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 mt-1"
                  />
                  <label
                    htmlFor="privacy"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Ich habe die{" "}
                    <a
                      href="/datenschutz"
                      className="text-red-600 hover:text-red-800"
                    >
                      Datenschutzerklärung
                    </a>{" "}
                    gelesen und akzeptiere sie.*
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-md font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {status === "loading"
                    ? "Sende..."
                    : status === "success"
                    ? "Gesendet!"
                    : status === "error"
                    ? "Fehler – erneut versuchen"
                    : "Nachricht senden"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Öffnungszeiten */}
        <div className=" py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 max-w-4xl mx-auto">
              <div className="p-8 sm:p-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Öffnungszeiten
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-6 w-6 text-red-600 mr-4" />
                      <div className="flex-1 border-b border-gray-200 pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Montag - Freitag</span>
                          <span>09:00 - 18:00 Uhr</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-6 w-6 text-red-600 mr-4" />
                      <div className="flex-1 border-b border-gray-200 pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Samstag</span>
                          <span>10:00 - 14:00 Uhr</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-6 w-6 text-red-600 mr-4" />
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Sonntag</span>
                          <span>Geschlossen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-red-800 mb-2">
                        Außerhalb der Öffnungszeiten?
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Vereinbaren Sie einfach einen individuellen Termin mit
                        uns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footbar />
      </div>
    </>
  );
}
