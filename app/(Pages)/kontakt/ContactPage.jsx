"use client";

import React, { useState } from "react";
import Image from "next/image";
import Hero2 from "../../(assets)/Hero2.jpeg";
import Footbar from "@/app/(components)/mainpage/Footbar";
import Head from "next/head";
import { toast } from "react-hot-toast";
import Button from "@/app/(components)/helpers/Button";

export default function ContactPage({ carId, carName, carLink }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    date: "",
    privacy: false,
  });
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.privacy) {
      toast.error("Bitte akzeptieren Sie die Datenschutzerklärung.");
      return;
    }

    setStatus("loading");

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
      carId,
      carName,
      carLink,
      date: formData.date || null,
    };

    try {
      const submitRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!submitRes.ok) throw new Error("Database submission failed");

      const emailRes = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (emailRes.ok) {
        setStatus("success");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          date: "",
          privacy: false,
        });
        toast.success("Nachricht erfolgreich gesendet!");
      } else {
        throw new Error("Email sending failed");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("Fehler beim Senden. Bitte erneut versuchen.");
    }
  };

  return (
    <>
      <Head>
        <title>Kontakt | Auto Galerie Jülich</title>
        <meta name="robots" content="index,follow" />
        <meta
          name="description"
          content="Kontaktieren Sie die Auto Galerie Jülich für Fragen zu unseren Fahrzeugen und Services."
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-200 text-gray-900">
        {/* Hero Section */}
        {/* Hero Section */}
        {/* Hero Section */}
        <section className="relative w-full h-[250px] md:h-[350px] lg:h-[450px] mt-16 overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={Hero2}
              alt="Auto Galerie Jülich"
              className="object-fill object-center"
              priority
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
          </div>

          {/* Text content */}
          <div className="relative z-10 flex items-center justify-center h-full mt-25">
            <div className="text-center px-4 sm:px-8">
              <h1 className="text-2xl sm:text-5xl font-bold text-white drop-shadow">
                Kontaktieren Sie uns
              </h1>
              <p className="mt-4 text-sm md:text-xl text-gray-200 max-w-2xl mx-auto drop-shadow">
                Wir beraten Sie gerne persönlich – schreiben Sie uns oder
                besuchen Sie uns vor Ort.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="w-full py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-gray-100 rounded-2xl shadow-xl p-8 md:p-10">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Kontaktformular
                  </h2>
                  <p className="mt-3 text-gray-600">
                    Füllen Sie das Formular aus und wir melden uns umgehend bei
                    Ihnen.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Vorname*
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nachname*
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        E-Mail Adresse*
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Telefonnummer
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Betreff*
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
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

                  {formData.subject === "Probefahrt vereinbaren" && (
                    <div>
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Gewünschter Termin
                      </label>
                      <input
                        id="date"
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ihre Nachricht*
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-400 rounded-lg transition bg-gray-100"
                    ></textarea>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="privacy"
                        name="privacy"
                        type="checkbox"
                        checked={formData.privacy}
                        onChange={handleChange}
                        required
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="privacy" className="text-gray-700">
                        Ich akzeptiere die{" "}
                        <a
                          href="/datenschutz"
                          className="text-red-600 hover:text-red-800 font-medium underline"
                        >
                          Datenschutzerklärung
                        </a>
                        *
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={status === "loading"}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      status === "success"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : status === "error"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    }`}
                  >
                    {status === "loading"
                      ? "Wird gesendet..."
                      : status === "success"
                      ? "Erfolgreich gesendet!"
                      : status === "error"
                      ? "Fehler - Bitte erneut versuchen"
                      : "Nachricht senden"}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div className="bg-gray-100 rounded-2xl shadow-xl p-8 md:p-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Schnellkontakt
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sie können uns auch direkt über WhatsApp kontaktieren:
                  </p>
                  <a
                    href="https://wa.me/4924619163780"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-500 hover:bg-green-600 transition-colors"
                  >
                    <svg
                      className="h-6 w-6 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Nachricht
                  </a>
                </div>
                <div className="bg-gray-100 rounded-2xl shadow-xl p-8 md:p-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Kontaktinformationen
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-50 p-3 rounded-lg">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          Adresse
                        </h4>
                        <p className="mt-1 text-gray-600">
                          Alte Dürener Str. 4
                          <br />
                          52428 Jülich
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-50 p-3 rounded-lg">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          Telefon
                        </h4>
                        <p className="mt-1 text-gray-600">
                          <a
                            href="tel:+4924611234567"
                            className="hover:text-red-600"
                          >
                            +49 (0)2461 9163780
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-50 p-3 rounded-lg">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          E-Mail
                        </h4>
                        <p className="mt-1 text-gray-600">
                          <a
                            href="mailto:autogalerie.jülich@web.de"
                            className="hover:text-red-600"
                          >
                            autogalerie.jülich@web.de
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-red-50 p-3 rounded-lg">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          Öffnungszeiten
                        </h4>
                        <p className="mt-1 text-gray-600">
                          Montag - Freitag: 8:00 - 18:00
                          <br />
                          Samstag: 9:00 - 14:00
                          <br />
                          Sonntag: Geschlossen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="w-full bg-gray-100 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              So finden Sie zu uns
            </h2>
            <div className="aspect-w-16 aspect-h-9 w-full h-96 md:h-[500px] rounded-2xl shadow-xl overflow-hidden border border-gray-400">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2515.2826803796497!2d6.37113927576914!3d50.918487653555246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bf5c0643671421%3A0x2fbe6b78cebf739a!2sAlte%20D%C3%BCrener%20Str.%204%2C%2052428%20J%C3%BClich!5e0!3m2!1sen!2sde!4v1745751132011!5m2!1sen!2sde"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        <Footbar />
      </div>
    </>
  );
}
