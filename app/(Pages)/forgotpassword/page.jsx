"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiMail,
  FiArrowRight,
  FiLock,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";

const inputBase =
  "h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-200/70 disabled:cursor-not-allowed disabled:opacity-60";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      if (!res.ok) {
        throw new Error("Fehler beim Senden des Reset-Links");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f6f4] px-4 py-6">
      <section className="w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/10">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
              {submitted ? (
                <FiCheck className="h-5 w-5 text-[#146c2e]" />
              ) : (
                <FiLock className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">
                Passwort zurücksetzen
              </h1>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                {submitted
                  ? "Wenn Ihre E-Mail vorhanden ist, erhalten Sie in Kürze eine Anleitung."
                  : "Geben Sie Ihre E-Mail-Adresse ein, um einen Reset-Link zu erhalten."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {submitted && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <FiCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Die Anfrage wurde gesendet. Bitte prüfen Sie Ihr
                E-Mail-Postfach.
              </span>
            </div>
          )}

          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  E-Mail-Adresse
                </label>

                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    placeholder="admin@firma.de"
                    autoComplete="email"
                    className={inputBase}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-900 px-4 text-sm font-semibold text-white shadow-md shadow-black/15 transition hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Senden...
                  </>
                ) : (
                  <>
                    Reset-Link senden
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#146c2e] transition hover:text-[#0f5724]"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
