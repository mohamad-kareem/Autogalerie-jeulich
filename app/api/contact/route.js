"use client";

import React, { useState } from "react";
import Image from "next/image";
import Hero2 from "../../(assets)/Hero2.jpeg";
import Footbar from "@/app/(components)/mainpage/Footbar";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function ContactPage({ carId, carName, carLink }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
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
      alert("Bitte akzeptieren Sie die Datenschutzerklärung.");
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
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          privacy: false,
        });
      } else {
        console.error(data);
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <>
      <Head>
        <title>Kontakt | Auto Galerie Jülich</title>
        <meta name="robots" content="index,follow" />
        <meta
          name="description"
          content="Kontaktieren Sie die Auto Galerie Jülich – persönliche Beratung für Ihren nächsten Gebrauchtwagen in NRW."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Hero Section with Parallax Effect */}
        <div className="relative h-[60vh] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={Hero2}
              alt="Dealership Showroom"
              fill
              className="object-cover object-center"
              priority
              quality={100}
              style={{ transform: "scale(1.1)" }} // Creates subtle zoom effect
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-center text-center px-4">
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Kontaktieren Sie uns
            </motion.h1>
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-white max-w-3xl mx-auto"
            >
              Persönliche Beratung für Ihren perfekten Fahrzeugkauf
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-8"
            >
              <a
                href="#contact-form"
                className="inline-flex items-center px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-lg font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Zum Kontaktformular
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Contact Information Card */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                <div className="p-8 md:p-10">
                  <div className="flex items-center mb-8">
                    <div className="bg-red-100 p-3 rounded-full mr-4">
                      <MapPinIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Autogalerie Jülich
                    </h2>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-start">
                      <div className="bg-gray-100 p-2 rounded-full mr-4 mt-1">
                        <MapPinIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Adresse
                        </h3>
                        <p className="mt-1 text-gray-600">
                          Alte Dürenerstraße 4<br />
                          52428 Jülich
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-gray-100 p-2 rounded-full mr-4 mt-1">
                        <PhoneIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
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
                      <div className="bg-gray-100 p-2 rounded-full mr-4 mt-1">
                        <EnvelopeIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          E-Mail
                        </h3>
                        <a
                          href="mailto:info@autogalerie-juelich.de"
                          className="mt-1 text-gray-600 hover:text-red-600 transition-colors inline-flex items-center"
                        >
                          info@autogalerie-juelich.de
                          <ArrowRightIcon className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Map */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 h-96 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-100 opacity-20 z-10 pointer-events-none" />
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2515.2826803796497!2d6.37113927576914!3d50.918487653555246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bf5c0643671421%3A0x2fbe6b78cebf739a!2sAlte%20D%C3%BCrener%20Str.%204%2C%2052428%20J%C3%BClich!5e0!3m2!1sen!2sde!4v1745751132011!5m2!1sen!2sde"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-2xl"
                />
                <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium">
                  <a
                    href="https://maps.google.com?q=Alte+D%C3%BCrener+Str.+4,+52428+J%C3%BClich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-red-600"
                  >
                    Routenplanung
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              variants={itemVariants}
              id="contact-form"
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
            >
              <div className="p-8 md:p-10">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Kontaktformular
                  </h2>
                  <p className="text-gray-600">
                    Füllen Sie das Formular aus und wir melden uns innerhalb von
                    24 Stunden bei Ihnen.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Vorname*
                      </label>
                      <input
                        type="text"
                        id="first-name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        placeholder="Ihr Vorname"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last-name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nachname*
                      </label>
                      <input
                        type="text"
                        id="last-name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                        placeholder="Ihr Nachname"
                      />
                    </div>
                  </div>

                  {/* Email */}
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                      placeholder="beispiel@email.de"
                    />
                  </div>

                  {/* Phone */}
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                      placeholder="+49 (0) 123 456789"
                    />
                  </div>

                  {/* Subject */}
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tZG93biI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9zdmc+')] bg-no-repeat bg-[center_right_1rem]"
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
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ihre Nachricht*
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
                      placeholder="Ihre Nachricht an uns..."
                    ></textarea>
                  </div>

                  {/* Privacy */}
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
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Datenschutzerklärung
                        </a>{" "}
                        *
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    whileHover={{ scale: status === "idle" ? 1.02 : 1 }}
                    whileTap={{ scale: status === "idle" ? 0.98 : 1 }}
                    className={`w-full py-4 px-6 rounded-xl font-medium text-white shadow-lg transition-all duration-300 ${
                      status === "success"
                        ? "bg-green-600 hover:bg-green-700"
                        : status === "error"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-red-600 hover:bg-red-700"
                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {status === "loading" ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sende Nachricht...
                      </span>
                    ) : status === "success" ? (
                      "Nachricht erfolgreich versendet!"
                    ) : status === "error" ? (
                      "Fehler - Bitte erneut versuchen"
                    ) : (
                      "Nachricht senden"
                    )}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Opening Hours Section */}
        <div className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700"
            >
              <div className="p-10">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Öffnungszeiten</h2>
                  <p className="text-gray-300 max-w-lg mx-auto">
                    Besuchen Sie uns während unserer Öffnungszeiten oder
                    vereinbaren Sie einen individuellen Termin.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    {[
                      { day: "Montag - Freitag", time: "09:00 - 18:00 Uhr" },
                      { day: "Samstag", time: "10:00 - 14:00 Uhr" },
                      { day: "Sonntag", time: "Geschlossen" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-red-600/10 p-3 rounded-lg mr-4">
                          <ClockIcon className="h-6 w-6 text-red-400" />
                        </div>
                        <div className="flex-1 border-b border-gray-700 pb-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item.day}</span>
                            <span className="text-gray-300">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-700/50 rounded-xl p-8 flex flex-col justify-center">
                    <div className="text-center">
                      <div className="bg-red-600/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneIcon className="h-6 w-6 text-red-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        Individuelle Termine
                      </h3>
                      <p className="text-gray-300 mb-6">
                        Vereinbaren Sie einfach einen Termin außerhalb unserer
                        regulären Öffnungszeiten.
                      </p>
                      <a
                        href="tel:+4924619163780"
                        className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-colors"
                      >
                        Termin vereinbaren
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <Footbar />
      </div>
    </>
  );
}
