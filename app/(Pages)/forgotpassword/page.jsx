"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMail, FiArrowRight } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) throw new Error("Fehler beim Senden des Reset-Links");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 px-4">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-1/3 w-48 h-48 bg-sky-400/10 blur-3xl rounded-full" />

      <div className="w-full max-w-sm relative z-10">
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-slate-600 bg-slate-900">
                <svg
                  className="w-7 h-7 text-slate-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-center text-slate-100">
              Passwort zurücksetzen
            </h1>

            {/* Info text (unchanged content) */}
            <p className="text-center text-slate-400 text-xs mt-2 mb-5 leading-relaxed">
              {submitted
                ? "Wenn Ihre E-Mail in unserem System vorhanden ist, erhalten Sie in Kürze eine Anleitung zum Zurücksetzen."
                : "Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen des Passworts zu erhalten."}
            </p>

            {/* Error */}
            {error && (
              <div className="mb-4 text-xs text-red-300 bg-red-900/40 border border-red-700/70 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {/* Form */}
            {!submitted && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-2.5 text-slate-500 text-sm" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@firma.de"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-md transition disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Senden…
                    </>
                  ) : (
                    <>
                      Reset-Link senden <FiArrowRight />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back */}
            <div className="mt-5 text-center text-xs">
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Zurück zur Anmeldung
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
