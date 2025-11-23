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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 relative overflow-hidden px-4">
      {/* Background Glow (same as login) */}
      <div className="absolute top-0 left-1/3 w-60 h-60 bg-blue-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-sky-400/10 blur-3xl rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-800 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-8">
            {/* Icon (same style as login) */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-slate-600/70 bg-gradient-to-br from-slate-800 to-slate-900">
                <svg
                  className="w-8 h-8 text-slate-100"
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
            <h1 className="text-2xl font-bold text-center text-slate-50 mb-2 tracking-wide">
              Passwort zurücksetzen
            </h1>

            <p className="text-center text-slate-400 mb-8 text-sm">
              {submitted
                ? "Wenn Ihre E-Mail in unserem System vorhanden ist, erhalten Sie in Kürze eine Anleitung zum Zurücksetzen."
                : "Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen des Passworts zu erhalten."}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-900/40 text-red-300 border border-red-700/80 rounded-md text-sm flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            {!submitted && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200 mb-1"
                  >
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-slate-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="admin@firma.de"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-2.5 px-4 rounded-md text-sm font-medium text-slate-50 bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 transition ${
                    isLoading ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-50"
                        xmlns="http://www.w3.org/2000/svg"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Senden...
                    </>
                  ) : (
                    <>
                      Reset-Link senden <FiArrowRight className="ml-2" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back Link */}
            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-blue-400 hover:text-blue-300"
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
