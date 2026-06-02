"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiCheck, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

const inputBase =
  "h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-200/70 disabled:cursor-not-allowed disabled:opacity-60";

export default function ResetPasswordPage({ token }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    if (password !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || "Passwort konnte nicht zurückgesetzt werden",
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirm("");

      setTimeout(() => {
        router.push("/login");
      }, 2500);
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
              {success ? (
                <FiCheck className="h-5 w-5 text-[#146c2e]" />
              ) : (
                <FiLock className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e]">
                Passwort
              </p>

              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">
                {success ? "Passwort aktualisiert" : "Neues Passwort setzen"}
              </h1>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                {success
                  ? "Ihr Passwort wurde geändert. Sie werden zur Anmeldung weitergeleitet."
                  : "Bitte geben Sie ein neues Passwort für Ihr Konto ein."}
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
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <FiCheck className="h-4 w-4 shrink-0" />
              <span>Passwort erfolgreich aktualisiert.</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleReset} className="space-y-3">
              {/* New password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  Neues Passwort
                </label>

                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={inputBase}
                  />
                </div>

                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  Mindestens 8 Zeichen.
                </p>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-xs font-semibold text-gray-600"
                >
                  Passwort bestätigen
                </label>

                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={inputBase}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white shadow-md shadow-black/15 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Aktualisierung...
                  </>
                ) : (
                  <>
                    Passwort zurücksetzen
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back link */}
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
