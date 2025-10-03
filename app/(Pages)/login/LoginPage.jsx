"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import Button from "@/app/(components)/helpers/Button";

export default function LoginPage({ callbackUrl }) {
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

      if (result?.error) throw new Error("Invalid credentials");
      if (result?.ok) router.push("/AdminDashboard");
    } catch (err) {
      setError("Die eingegebene E-Mail oder das Passwort ist falsch.");
      setCredentials((prev) => ({ ...prev, password: "" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-red-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-60 h-60 bg-red-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-8">
            {/* Logo / Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-800 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
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
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-center text-gray-400 mb-8 text-sm">
              Bitte melden Sie sich mit Ihren Zugangsdaten an
            </p>

            {/* Error Message */}
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
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
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="admin@firma.de"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Passwort
                  </label>
                  <Link
                    href="/forgotpassword"
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    Passwort vergessen?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                    className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Submit Button */}
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
                      Anmeldung...
                    </>
                  ) : (
                    <>
                      Fortsetzen <FiArrowRight className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
