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

  const labelClass = `mb-1 block font-medium text-[#263126] ${
    isMobile ? "text-[10px]" : "text-xs"
  }`;

  const fieldBase =
    "w-full rounded-xl border border-black/10 bg-white text-[#101510] outline-none transition placeholder:text-[#9aa39a] focus:border-[#146c2e] focus:ring-2 focus:ring-[#146c2e]/15 disabled:cursor-not-allowed disabled:bg-[#f3f5f1]";

  const fieldPadding = isMobile
    ? "px-2.5 py-1.5 text-[11px]"
    : "px-3.5 py-2.5 text-sm";

  const fieldClass = `${fieldBase} ${fieldPadding}`;

  const buttonSize = isMobile ? "h-9 text-[11px]" : "h-11 text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto ${isMobile ? "max-w-xs space-y-2" : "space-y-3.5"}`}
    >
      <input type="hidden" name="car" value={car._id} />

      <div
        className={`grid grid-cols-1 ${
          isMobile ? "gap-1.5" : "gap-3 md:grid-cols-2"
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

      <div className={`grid grid-cols-1 ${isMobile ? "gap-1.5" : "gap-3"}`}>
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
          rows={isMobile ? 2 : 4}
          value={formData.message}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={`${fieldBase} ${
            isMobile ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2.5 text-sm"
          } resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#146c2e] font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${buttonSize}`}
      >
        <FiSend className={isMobile ? "h-3 w-3" : "h-4 w-4"} />

        {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
      </button>

      <p
        className={`${
          isMobile ? "text-[8px]" : "text-[10px]"
        } mt-1 leading-4 text-[#6b756b]`}
      >
        * Pflichtfelder. Wir werden Ihre Daten nur zur Bearbeitung Ihrer Anfrage
        verwenden.
      </p>
    </form>
  );
};
export default ContactForm;
