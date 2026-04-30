"use client";

import React, { useEffect, useState } from "react";
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

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function SimpleContactFormModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(initialFormData);
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

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Submission failed");
      }

      if (data.emailSent === false) {
        console.warn("Anfrage gespeichert, aber E-Mail wurde nicht gesendet.");
      }

      toast.success("Ihre Nachricht wurde erfolgreich gesendet!");

      setFormData(initialFormData);
      onClose();
    } catch (error) {
      console.error("Contact form submit error:", error);
      toast.error("Fehler beim Senden. Bitte versuchen Sie es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[1000000] flex items-center justify-center px-2 transition-all duration-300 ${
        isVisible ? "bg-black/60" : "bg-black/0"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full max-w-xs transform rounded-lg bg-white shadow-xl transition-all duration-300 md:max-w-md ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="rounded-t-lg border-b border-slate-700/60 bg-gradient-to-r from-slate-900 to-slate-800 p-3 text-slate-50 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold md:text-lg">
                Kontaktieren Sie uns
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-200/80 md:text-xs">
                Antwort innerhalb von 12h
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-slate-200/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Schließen"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-2.5 p-3 text-xs md:p-4 md:text-sm"
        >
          <div className="relative">
            <FiUser
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              disabled={isSubmitting}
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-xs focus:border-slate-900/60 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:opacity-70 md:py-2 md:text-sm"
            />
          </div>

          <div className="relative">
            <FiMail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="email"
              name="email"
              placeholder="Ihre E-Mail"
              required
              disabled={isSubmitting}
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-xs focus:border-slate-900/60 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:opacity-70 md:py-2 md:text-sm"
            />
          </div>

          <div className="relative">
            <FiPhone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Telefon"
              disabled={isSubmitting}
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 py-1.5 pl-8 pr-2 text-xs focus:border-slate-900/60 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:opacity-70 md:py-2 md:text-sm"
            />
          </div>

          <div className="relative">
            <FiFileText
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              name="subject"
              required
              disabled={isSubmitting}
              value={formData.subject}
              onChange={handleChange}
              className="w-full appearance-none rounded border border-slate-200 bg-white py-1.5 pl-8 pr-6 text-xs focus:border-slate-900/60 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:opacity-70 md:py-2 md:text-sm"
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

            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <svg
                className="h-3 w-3 text-slate-400"
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

          <div className="relative">
            <FiMessageSquare
              className="absolute left-3 top-3 text-slate-400"
              size={14}
            />
            <textarea
              name="message"
              placeholder="Nachricht"
              required
              disabled={isSubmitting}
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="w-full resize-none rounded border border-slate-200 py-1.5 pl-8 pr-2 text-xs focus:border-slate-900/60 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:opacity-70 md:py-2 md:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded bg-gradient-to-r from-slate-900 to-slate-800 py-2 text-xs font-medium text-slate-50 shadow-sm transition-all duration-200 hover:from-slate-800 hover:to-slate-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 md:py-2.5 md:text-sm"
          >
            <FiSend size={14} />
            {isSubmitting ? "Wird gesendet..." : "Senden"}
          </button>

          <p className="text-center text-[10px] text-slate-500 md:text-[11px]">
            Ihre Daten werden vertraulich behandelt.
          </p>
        </form>
      </div>
    </div>
  );
}
