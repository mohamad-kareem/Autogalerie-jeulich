"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("admin-login", {
        redirect: false,
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      if (result?.error) throw new Error();
      router.push("/AdminDashboard");
    } catch {
      setError("E-Mail oder Passwort ist falsch.");
      setCredentials((p) => ({ ...p, password: "" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 px-4">
      <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
        <div className="p-6">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-600 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-slate-200"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-center text-slate-100">
            Admin Login
          </h1>
          <p className="text-xs text-center text-slate-400 mb-5">
            Bitte anmelden
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 text-xs text-red-300 bg-red-900/40 border border-red-700/60 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-slate-300">E-Mail</label>
              <div className="relative mt-1">
                <FiMail className="absolute left-3 top-2.5 text-slate-500 text-sm" />
                <input
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@firma.de"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-300">Passwort</label>
                <Link
                  href="/forgotpassword"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Passwort vergessen?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-2.5 text-slate-500 text-sm" />
                <input
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="••••••••"
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
                  Anmeldung…
                </>
              ) : (
                <>
                  Fortsetzen <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
