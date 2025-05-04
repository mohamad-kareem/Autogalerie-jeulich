"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function ContactForm() {
  const searchParams = useSearchParams();

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
      carId: searchParams.get("carId") || "",
      carName: searchParams.get("carName") || "",
      carLink: searchParams.get("carLink") || "",
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Contact Info */}
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
                  <h3 className="text-lg font-medium text-gray-900">Adresse</h3>
                  <p className="mt-1 text-gray-600">
                    Alte Dürenerstraße 4<br />
                    52428 Jülich
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <PhoneIcon className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Telefon</h3>
                  <p className="mt-1 text-gray-600">+49 (0)2461 9163780</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Mo–Fr 9:00–18:00 • Sa 10:00–14:00
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <EnvelopeIcon className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">E-Mail</h3>
                  <a
                    href="mailto:anfrage@juelicherautozentrum.de"
                    className="mt-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    anfrage@juelicherautozentrum.de
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

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Kontaktformular
        </h2>
        <p className="text-gray-600 mb-6">
          Schreiben Sie uns eine Nachricht – wir melden uns schnellstmöglich bei
          Ihnen.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="first-name"
                className="block text-sm font-medium text-gray-700"
              >
                Vorname*
              </label>
              <input
                id="first-name"
                type="text"
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
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-3"
              />
            </div>
          </div>

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
              <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
              <option value="Probefahrt vereinbaren">
                Probefahrt vereinbaren
              </option>
              <option value="Finanzierungsanfrage">Finanzierungsanfrage</option>
              <option value="Inzahlungnahme">Inzahlungnahme</option>
              <option value="Service-Termin">Service-Termin</option>
            </select>
          </div>

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
  );
}
