"use client";

import React, { useState, useEffect } from "react";
import {
  FiSend,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

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

      toast.success("Ihre Nachricht wurde erfolgreich gesendet!");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Senden. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-2 transition-all duration-300 ${
        isVisible ? "bg-black/60" : "bg-black/0"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-xs md:max-w-md transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-700 text-white p-3 md:p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm md:text-lg font-bold">
                Kontaktieren Sie uns
              </h2>
              <p className="text-red-100 text-[10px] md:text-xs mt-0.5">
                Antwort innerhalb von 12h
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 md:p-4 space-y-2.5 text-xs md:text-sm"
        >
          {/* Name */}
          <div className="relative">
            <FiUser
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded pl-8 pr-2 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <FiMail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="email"
              name="email"
              placeholder="Ihre E-Mail"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded pl-8 pr-2 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <FiPhone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Telefon"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded pl-8 pr-2 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Subject */}
          <div className="relative">
            <FiFileText
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <select
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded pl-8 pr-6 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Betreff auswählen</option>
              <option value="Allgemeine Anfrage">Allgemeine Anfrage</option>
              <option value="Probefahrt vereinbaren">
                Probefahrt vereinbaren
              </option>
              <option value="Finanzierungsanfrage">Finanzierungsanfrage</option>
              <option value="Inzahlungnahme">Inzahlungnahme</option>
              <option value="Service-Termin">Service-Termin</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="relative">
            <FiMessageSquare
              className="absolute left-3 top-3 text-gray-400"
              size={14}
            />
            <textarea
              name="message"
              placeholder="Nachricht"
              required
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full border border-gray-200 rounded pl-8 pr-2 py-1.5 md:py-2 text-xs md:text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 md:py-2.5 rounded font-medium flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow text-xs md:text-sm"
          >
            <FiSend size={14} />
            {isSubmitting ? "Wird gesendet..." : "Senden"}
          </button>

          {/* Privacy */}
          <p className="text-[10px] md:text-[11px] text-gray-500 text-center">
            Ihre Daten werden vertraulich behandelt.
          </p>
        </form>
      </div>
    </div>
  );
}
