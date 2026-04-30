"use client";

import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";

const ContactForm = ({ car, onSuccess, isMobile = false }) => {
  const formatRegistration = (value) => {
    if (!value || value.length !== 6) return "EZ unbekannt";

    const year = value.slice(0, 4);
    const month = value.slice(4, 6);

    return `${month}/${year}`;
  };

  const carTitle = `${car.make} ${car.modelDescription || car.model}`;

  const defaultMessage = `Ich interessiere mich für den ${carTitle} (${formatRegistration(
    car.firstRegistration,
  )}, ${car.mileage || 0} km)...`;

  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: defaultMessage,
    date: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        carId: car._id,
        carName: carTitle,
        carLink: typeof window !== "undefined" ? window.location.href : "",
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Anfrage konnte nicht gesendet werden");
      }

      if (data.emailSent === false) {
        console.warn("Anfrage gespeichert, aber E-Mail wurde nicht gesendet.");
      }

      toast.success("Ihre Anfrage wurde erfolgreich übermittelt!");

      setFormData(initialFormData);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Submission error:", error);

      toast.error(
        error.message ||
          "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelClass = `block ${
    isMobile ? "text-[11px]" : "text-xs"
  } font-medium text-gray-700 mb-1`;

  const fieldBase =
    "w-full rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed";

  const fieldPadding = isMobile ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  const fieldClass = `${fieldBase} ${fieldPadding}`;

  const buttonSize = isMobile ? "py-1.5 text-xs" : "py-2 text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto ${isMobile ? "space-y-2 max-w-xs" : "space-y-3"}`}
    >
      <input type="hidden" name="car" value={car._id} />

      <div
        className={`grid grid-cols-1 ${
          isMobile ? "gap-1.5" : "md:grid-cols-2 md:gap-3 gap-2"
        }`}
      >
        <div>
          <label className={labelClass}>Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>E-Mail*</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={fieldClass}
          />
        </div>
      </div>

      <div className={isMobile ? "space-y-1.5" : "space-y-2"}>
        <div>
          <label className={labelClass}>Telefon</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isSubmitting}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Wunschdatum & Uhrzeit</label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            disabled={isSubmitting}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Betreff*</label>
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={fieldClass}
        >
          <option value="">Bitte wählen</option>
          <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
          <option value="Probefahrt vereinbaren">Probefahrt vereinbaren</option>
          <option value="Finanzierungsanfrage">Finanzierungsanfrage</option>
          <option value="Inzahlungnahme">Inzahlungnahme</option>
          <option value="Service-Termin">Service-Termin</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Nachricht*</label>
        <textarea
          name="message"
          rows={isMobile ? 3 : 4}
          value={formData.message}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={`${fieldBase} ${
            isMobile ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
          } resize-vertical`}
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-blue-700 hover:to-blue-800 text-white ${buttonSize} rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed`}
        >
          <FiSend className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
          {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
        </button>
      </div>

      <p
        className={`${
          isMobile ? "text-[9px]" : "text-[10px]"
        } text-gray-500 leading-tight mt-1`}
      >
        * Pflichtfelder. Wir werden Ihre Daten nur zur Bearbeitung Ihrer Anfrage
        verwenden.
      </p>
    </form>
  );
};

export default ContactForm;
