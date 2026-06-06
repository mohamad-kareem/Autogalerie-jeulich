"use client";

import React, { useState } from "react";
import Head from "next/head";
import { toast } from "react-hot-toast";
import Footbar from "@/app/(components)/mainpage/Footbar";
import {
  User,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  Calendar,
  Send,
  ChevronDown,
} from "lucide-react";

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  date: "",
  privacy: false,
};

const inputBase =
  "h-10 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3 text-[13px] font-medium text-[#101510] outline-none transition placeholder:text-[#8b958b] focus:border-[#146c2e]/40 focus:bg-white focus:ring-4 focus:ring-[#146c2e]/10 sm:h-12 sm:rounded-2xl sm:px-4 sm:text-sm";

export default function ContactPage({ carId, carName, carLink }) {
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState("idle");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.privacy) {
      toast.error("Bitte akzeptieren Sie die Datenschutzerklärung.");
      return;
    }

    setStatus("loading");

    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!submitRes.ok) {
        throw new Error("Database submission failed");
      }

      const emailRes = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!emailRes.ok) {
        throw new Error("Email sending failed");
      }

      setStatus("success");
      resetForm();
      toast.success("Nachricht erfolgreich gesendet!");
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("Fehler beim Senden. Bitte erneut versuchen.");
    }
  };

  return (
    <>
      <Head>
        <title>Kontakt | Autogalerie Jülich</title>

        <meta
          name="description"
          content="Kontaktieren Sie die Autogalerie Jülich."
        />
      </Head>

      <main className="min-h-screen bg-[#f5f5f2] pt-4 text-[#101510] sm:pt-10">
        <div className="mx-auto w-full max-w-[1180px] px-3 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
            <section className="rounded-[20px] border border-white/80 bg-white p-4 shadow-lg shadow-black/5 sm:rounded-[28px] sm:p-7">
              <div className="mb-4 sm:mb-6">
                <div className="mb-2 h-[2px] w-10 bg-[#146c2e] sm:mb-3 sm:w-12" />

                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#146c2e] sm:text-[10px] sm:tracking-[0.24em]">
                  Kontaktformular
                </p>

                <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.05em] text-[#07111f] sm:mt-3 sm:text-[32px]">
                  Schreiben Sie uns
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <InputField
                    icon={<User />}
                    label="Vorname"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ihr Vorname"
                    required
                  />

                  <InputField
                    icon={<User />}
                    label="Nachname"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Ihr Nachname"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <InputField
                    icon={<Mail />}
                    label="E-Mail"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ihre@email.de"
                    required
                  />

                  <InputField
                    icon={<Phone />}
                    label="Telefon"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+49 ..."
                  />
                </div>

                <div>
                  <Label text="Betreff" icon={<FileText />} required />

                  <div className="relative mt-1.5 sm:mt-2">
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={`${inputBase} appearance-none pr-9 sm:pr-10`}
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

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b958b] sm:right-4" />
                  </div>
                </div>

                {formData.subject === "Probefahrt vereinbaren" && (
                  <div>
                    <Label text="Gewünschter Termin" icon={<Calendar />} />

                    <input
                      type="datetime-local"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className={`${inputBase} mt-1.5 sm:mt-2`}
                    />
                  </div>
                )}

                <div>
                  <Label
                    text="Ihre Nachricht"
                    icon={<MessageSquare />}
                    required
                  />

                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Wie können wir Ihnen helfen?"
                    className="mt-1.5 min-h-[115px] w-full resize-none rounded-xl border border-black/10 bg-[#fafaf8] px-3 py-3 text-[13px] font-medium text-[#101510] outline-none transition placeholder:text-[#8b958b] focus:border-[#146c2e]/40 focus:bg-white focus:ring-4 focus:ring-[#146c2e]/10 sm:mt-2 sm:min-h-[170px] sm:rounded-2xl sm:px-4 sm:py-4 sm:text-sm"
                  />
                </div>

                <label className="flex items-start gap-3 rounded-xl bg-[#f7f9f5] p-3 sm:rounded-2xl sm:p-4">
                  <input
                    type="checkbox"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleChange}
                    required
                    className="mt-1 h-4 w-4 rounded border-black/20 accent-[#146c2e]"
                  />

                  <span className="text-[11px] font-medium leading-5 text-[#5f695f] sm:text-xs sm:leading-6">
                    Ich akzeptiere die{" "}
                    <a
                      href="/Datenschutz"
                      className="font-semibold text-[#146c2e] underline underline-offset-2"
                    >
                      Datenschutzerklärung
                    </a>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#146c2e] px-5 text-[13px] font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:text-sm"
                >
                  <Send className="h-4 w-4" />

                  {status === "loading"
                    ? "Wird gesendet..."
                    : "Nachricht senden"}
                </button>
              </form>
            </section>

            <aside className="flex flex-col gap-3 self-start">
              <ContactCard
                href="tel:+492461 916006613"
                icon={<Phone />}
                title="Anrufen"
                text="02461 916006613"
              />

              <ContactCard
                href="https://wa.me/4915234205041"
                icon={<MessageSquare />}
                title="WhatsApp"
                text="Direkt schreiben"
                external
              />

              <ContactCard
                href="mailto:autogalerie.jülich@web.de"
                icon={<Mail />}
                title="E-Mail"
                text="autogalerie.jülich@web.de"
              />
            </aside>
          </div>

          <section className="mt-4 overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-lg shadow-black/5 sm:mt-6 sm:rounded-[28px]">
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

            <div className="border-t border-gray-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    className="rounded bg-black/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-900"
                  >
                    Route
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 sm:mt-16">
          <Footbar />
        </div>
      </main>
    </>
  );
}

function Label({ text, icon, required }) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-semibold text-[#101510] sm:text-sm">
      <span className="text-[#146c2e] [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {text}
      {required && <span className="text-[#146c2e]">*</span>}
    </label>
  );
}

function InputField({
  icon,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <Label text={label} icon={icon} required={required} />

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`${inputBase} mt-1.5 sm:mt-2`}
      />
    </div>
  );
}

function ContactCard({ href, icon, title, text, external = false }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex h-[76px] items-center gap-3 rounded-[18px] border border-white/80 bg-white px-4 shadow-md shadow-black/5 transition hover:border-[#146c2e]/20"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e6f1e9] text-[#146c2e] transition group-hover:bg-[#146c2e] group-hover:text-white">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>

      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-none text-[#07111f]">
          {title}
        </p>

        <p className="mt-1 truncate text-[11px] font-medium text-[#5f695f]">
          {text}
        </p>
      </div>
    </a>
  );
}
