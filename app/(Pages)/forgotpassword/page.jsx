"use client";
import { useState } from "react";
import Link from "next/link";
import { FiMail, FiArrowRight } from "react-icons/fi";
import Button from "@/app/(components)/helpers/Button";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-red-950 relative overflow-hidden p-4">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-60 h-60 bg-red-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-800 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
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
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Passwort zurücksetzen
            </h1>
            <p className="text-center text-gray-400 mb-8 text-sm">
              {submitted
                ? "Wenn Ihre E-Mail in unserem System vorhanden ist, erhalten Sie in Kürze eine Anleitung zum Zurücksetzen."
                : "Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen des Passworts zu erhalten"}
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 bg-red-900/40 text-red-400 border border-red-700 rounded-md text-sm flex items-center">
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
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ihr@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition ${
                      isLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </Button>
                </div>
              </form>
            )}

            {/* Back to login */}
            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-red-500 hover:text-red-400"
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
