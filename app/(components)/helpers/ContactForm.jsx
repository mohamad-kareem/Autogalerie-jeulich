"use client";
import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";

const ContactForm = ({ car, onSuccess, isMobile = false }) => {
  // Helper function to format registration date
  const formatRegistration = (value) => {
    if (!value || value.length !== 6) return "EZ unbekannt";
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    return `${month}/${year}`;
  };

  // Default message template
  const defaultMessage = `Ich interessiere mich für den ${car.make} ${
    car.modelDescription || car.model
  } (${formatRegistration(car.firstRegistration)}, ${car.mileage || 0} km)...`;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: defaultMessage,
    date: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        carId: car._id,
        carName: `${car.make} ${car.modelDescription || car.model}`,
        carLink: typeof window !== "undefined" ? window.location.href : "",
      };

      // Step 1: Save to database
      const dbResponse = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!dbResponse.ok) {
        throw new Error(
          "Datenbankfehler: Anfrage konnte nicht gespeichert werden",
        );
      }

      const dbResult = await dbResponse.json();

      // Step 2: Send email
      const emailResponse = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!emailResponse.ok) {
        throw new Error(
          dbResult.success
            ? "Anfrage gespeichert, aber E-Mail konnte nicht versendet werden"
            : "E-Mail konnte nicht versendet werden",
        );
      }

      toast.success("Ihre Anfrage wurde erfolgreich übermittelt!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: defaultMessage,
        date: "",
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Submission error:", error);

      if (error.message.includes("gespeichert")) {
        toast.success(
          "Ihre Anfrage wurde gespeichert, aber die Bestätigung konnte nicht versendet werden",
        );
      } else {
        toast.error(
          error.message ||
            "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared styles
  const labelClass = `block ${
    isMobile ? "text-[11px]" : "text-xs"
  } font-medium text-gray-700 mb-1`;
  const fieldBase =
    "w-full rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
  const fieldPadding = isMobile ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  const fieldClass = `${fieldBase} ${fieldPadding}`;

  const buttonSize = isMobile ? "py-1.5 text-xs" : "py-2 text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto ${isMobile ? "space-y-2 max-w-xs" : "space-y-3"}`}
    >
      {/* Hidden car ID field */}
      <input type="hidden" name="car" value={car._id} />

      {/* Name + Email - side by side on desktop, stacked on mobile */}
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
            className={fieldClass}
          />
        </div>
      </div>

      {/* Phone + Date */}
      <div className={isMobile ? "space-y-1.5" : "space-y-2"}>
        <div>
          <label className={labelClass}>Telefon</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
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
            className={fieldClass}
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className={labelClass}>Betreff*</label>
        <select
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
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

      {/* Message */}
      <div>
        <label className={labelClass}>Nachricht*</label>
        <textarea
          name="message"
          rows={isMobile ? 3 : 4}
          value={formData.message}
          onChange={handleChange}
          required
          className={`${fieldBase} ${
            isMobile ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
          } resize-vertical`}
        />
      </div>

      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-blue-700 hover:to-blue-800 text-white ${buttonSize} rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70`}
        >
          <FiSend className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
          {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
        </button>
      </div>

      {/* Form footer */}
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
