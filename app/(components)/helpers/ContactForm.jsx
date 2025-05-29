"use client";
import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";

const ContactForm = ({ car, onSuccess }) => {
  const formatRegistration = (value) => {
    if (!value || value.length !== 6) return "EZ unbekannt";
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    return `${month}/${year}`;
  };

  const defaultMessage = `Ich interessiere mich für den ${car.make} ${
    car.modelDescription || car.model
  } (${formatRegistration(car.firstRegistration)}, ${car.mileage || 0} km)...`;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: defaultMessage,
    date: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          carId: car._id,
          carName: `${car.make} ${car.modelDescription || car.model}`,
          carLink: typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      toast.success("Nachricht erfolgreich gesendet!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        date: "",
      });
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Fehler beim Senden der Nachricht");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 ">
      <input type="hidden" name="car" value={car._id} />

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name*
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
        />
      </div>

      {/* E-Mail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail*
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
        />
      </div>

      {/* Telefon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefon
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
        />
      </div>

      {/* Betreff */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Betreff*
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
        >
          <option value="">Bitte wählen</option>
          <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
          <option value="Probefahrt vereinbaren">Probefahrt vereinbaren</option>
          <option value="Finanzierungsanfrage">Finanzierungsanfrage</option>
          <option value="Inzahlungnahme">Inzahlungnahme</option>
          <option value="Service-Termin">Service-Termin</option>
        </select>
      </div>
      {/* Wunschdatum */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wunschdatum & Uhrzeit
        </label>
        <input
          type="datetime-local"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
        />
      </div>

      {/* Nachricht */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nachricht*
        </label>
        <textarea
          name="message"
          rows="4"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 text-sm"
          placeholder={defaultMessage}
        ></textarea>
      </div>

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-medium flex items-center justify-center gap-2 text-base"
        >
          <FiSend className="w-5 h-5" />
          {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
        </button>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-500">
        * Pflichtfelder. Wir werden Ihre Daten nur zur Bearbeitung Ihrer Anfrage
        verwenden.
      </p>
    </form>
  );
};

export default ContactForm;
