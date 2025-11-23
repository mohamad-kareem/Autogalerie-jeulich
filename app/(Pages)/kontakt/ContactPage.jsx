"use client";

import React, { useState } from "react";
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

      <div className="min-h-screen flex flex-col bg-gray-50 py-4 mt-16">
        {/* Main Content - Professional Desktop */}
        <div className="flex-1 py-6">
          <div className="max-w-4xl mx-auto px-4">
            {/* Professional Compact Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Kontaktformular
                </h2>
                <p className="text-sm text-gray-600">
                  Senden Sie uns eine Nachricht
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vorname*
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                      placeholder="Ihr Vorname"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nachname*
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                      placeholder="Ihr Nachname"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-Mail*
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                      placeholder="ihre@email.de"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                      placeholder="+49 ..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betreff*
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gewünschter Termin
                    </label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ihre Nachricht*
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition resize-none"
                    placeholder="Wie können wir Ihnen helfen?"
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleChange}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label className="text-xs text-gray-700 leading-relaxed">
                    Ich akzeptiere die{" "}
                    <a
                      href="/Datenschutz"
                      className="text-slate-600 hover:text-slate-800 font-medium underline"
                    >
                      Datenschutzerklärung
                    </a>
                    *
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className={`w-full py-3 text-sm font-semibold rounded transition-colors ${
                    status === "loading"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-slate-600 hover:bg-slate-700 text-white"
                  }`}
                >
                  {status === "loading"
                    ? "Wird gesendet..."
                    : "Nachricht senden"}
                </Button>
              </form>
            </div>
            {/* Compact Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-16 mt-16">
              {/* Anrufen */}
              <a
                href="tel:+4924619163780"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
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
                <span className="font-medium">Anrufen</span>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/4915234205041"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>

              {/* Email */}
              <a
                href="mailto:autogalerie.jülich@web.de"
                className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors shadow-sm text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
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
                <span className="font-medium">E-Mail</span>
              </a>
            </div>
            {/* Professional Compact Map */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden ">
              <div className="h-64 md:h-80">
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
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Auto Galerie Jülich
                    </p>
                    <p className="text-sm text-gray-600">
                      Alte Dürener Str. 4, 52428 Jülich
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://maps.google.com/?q=Alte+Dürener+Str.+4,52428+Jülich"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors text-sm font-medium"
                    >
                      Route
                    </a>
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
