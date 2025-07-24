"use client";

import React, { useState } from "react";
import { FiSend, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function SimpleContactFormModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Submission failed");

      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      toast.success("Ihre Nachricht wurde gesendet!");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Senden. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <FiX size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Kontaktformular
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-700">
          <input
            type="text"
            name="name"
            placeholder="Name*"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
          />
          <input
            type="email"
            name="email"
            placeholder="E-Mail*"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Telefon"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
          />
          <select
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Betreff wählen*</option>
            <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
            <option value="Probefahrt vereinbaren">
              Probefahrt vereinbaren
            </option>
            <option value="Finanzierungsanfrage">Finanzierungsanfrage</option>
            <option value="Inzahlungnahme">Inzahlungnahme</option>
            <option value="Service-Termin">Service-Termin</option>
          </select>
          <textarea
            name="message"
            placeholder="Nachricht*"
            required
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-700 hover:bg-red-800 text-white py-2 rounded font-semibold flex items-center justify-center gap-2"
          >
            <FiSend />
            {isSubmitting ? "Senden..." : "Nachricht senden"}
          </button>
        </form>
      </div>
    </div>
  );
}
