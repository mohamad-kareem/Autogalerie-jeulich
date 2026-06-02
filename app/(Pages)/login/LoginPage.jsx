"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiMail,
  FiLock,
  FiArrowRight,
  FiAlertCircle,
  FiUser,
} from "react-icons/fi";

const inputBase =
  "h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-200/70 disabled:cursor-not-allowed disabled:opacity-60";

export default function LoginPage() {
  const router = useRouter();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("admin-login", {
        redirect: false,
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      if (result?.error) {
        throw new Error("Invalid credentials");
      }

      router.push("/AdminDashboard");
    } catch {
      setError("E-Mail oder Passwort ist falsch.");
      setCredentials((prev) => ({
        ...prev,
        password: "",
      }));
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
              <FiUser className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-950">
                Admin Login
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Bitte anmelden, um fortzufahren.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              E-Mail
            </label>

            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="admin@firma.de"
                autoComplete="email"
                className={inputBase}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-xs font-semibold text-gray-600">
                Passwort
              </label>

              <Link
                href="/forgotpassword"
                className="text-xs font-semibold text-[#146c2e] transition hover:text-[#0f5724]"
              >
                Passwort vergessen?
              </Link>
            </div>

            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={isLoading}
                placeholder="••••••••"
                autoComplete="current-password"
                className={inputBase}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-900 px-4 text-sm font-semibold text-white shadow-md shadow-black/15 transition hover:bg-green-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Anmeldung...
              </>
            ) : (
              <>
                Fortsetzen
                <FiArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="pt-1 text-center text-[11px] font-medium text-gray-400">
            Geschützter Zugang für interne Verwaltung.
          </p>
        </form>
      </section>
    </main>
  );
}
