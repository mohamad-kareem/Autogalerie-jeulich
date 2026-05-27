"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  X,
  Send,
  User,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  Calendar,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const inputBase =
  "h-11 w-full rounded-xl border border-black/10 bg-[#fafaf8] pl-10 pr-3 text-sm font-medium text-[#101510] outline-none transition placeholder:text-[#8b958b] focus:border-[#146c2e]/50 focus:bg-white focus:ring-4 focus:ring-[#146c2e]/10 disabled:cursor-not-allowed disabled:opacity-60";

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
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[1000000] flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-sm transition duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`w-full max-w-[520px] overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-2xl shadow-black/20 transition duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="relative bg-[#f7f9f5] px-4 py-4 sm:px-5 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-[#5f695f] transition hover:bg-[#e6f1e9] hover:text-[#146c2e] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-12">
            <div className="mb-3 h-[2px] w-10 bg-[#146c2e]" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e]">
              Kontakt aufnehmen
            </p>

            <p className="mt-2 text-sm leading-6 text-[#5f695f]">
              Antwort innerhalb von 12h
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-none sm:px-5 sm:py-5"
        >
          <InputField
            icon={<User />}
            type="text"
            name="name"
            placeholder="Ihr Name"
            required
            disabled={isSubmitting}
            value={formData.name}
            onChange={handleChange}
          />

          <InputField
            icon={<Mail />}
            type="email"
            name="email"
            placeholder="Ihre E-Mail"
            required
            disabled={isSubmitting}
            value={formData.email}
            onChange={handleChange}
          />

          <InputField
            icon={<Phone />}
            type="tel"
            name="phone"
            placeholder="Telefonnummer"
            disabled={isSubmitting}
            value={formData.phone}
            onChange={handleChange}
          />

          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#146c2e]" />

            <select
              name="subject"
              required
              disabled={isSubmitting}
              value={formData.subject}
              onChange={handleChange}
              className={`${inputBase} appearance-none pr-10`}
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

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b958b]" />
          </div>

          <div className="relative">
            <MessageSquare className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#146c2e]" />

            <textarea
              name="message"
              placeholder="Ihre Nachricht"
              required
              disabled={isSubmitting}
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="min-h-[120px] w-full resize-none rounded-xl border border-black/10 bg-[#fafaf8] px-3 py-3 pl-10 text-sm font-medium text-[#101510] outline-none transition placeholder:text-[#8b958b] focus:border-[#146c2e]/50 focus:bg-white focus:ring-4 focus:ring-[#146c2e]/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#146c2e] px-4 text-sm font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
          </button>

          <p className="text-center text-[11px] font-medium text-[#7b857b]">
            Ihre Daten werden vertraulich behandelt.
          </p>
        </form>
      </div>
    </div>
  );
}

function InputField({
  icon,
  type,
  name,
  placeholder,
  required,
  disabled,
  value,
  onChange,
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#146c2e] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className={inputBase}
      />
    </div>
  );
}

function MiniInfo({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 py-2 text-xs font-semibold text-[#5f695f]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e] [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      <span className="truncate">{text}</span>
    </div>
  );
}
