// app/(components)/AdminDashboard.jsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiXCircle, FiMessageSquare, FiMenu } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSidebar } from "@/app/(components)/SidebarContext";
import CarsTable from "./CarsTable";
import SubmissionsTable from "./SubmissionsTable";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [viewMode, setViewMode] = useState("submissions"); // "submissions" | "cars"
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { openSidebar } = useSidebar();
  // Initialize dark mode like on your other pages
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const bgClass = darkMode ? "bg-gray-900" : "bg-slate-50";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const cardBg = darkMode ? "bg-gray-900/80" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-slate-200";

  if (status === "loading") {
    return (
      <div
        className={`flex justify-center items-center h-screen transition-colors duration-300 ${bgClass}`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            darkMode ? "border-slate-400" : "border-slate-700"
          }`}
        />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div
        className={`flex justify-center items-center h-screen transition-colors duration-300 ${bgClass}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-lg w-full mx-4 rounded-2xl border shadow-xl px-6 py-8 text-center ${
            darkMode
              ? "bg-gray-900/90 border-gray-700"
              : "bg-white border-slate-200"
          }`}
        >
          <FiXCircle
            className={`mx-auto mb-4 text-5xl ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <h2 className={`text-xl md:text-2xl font-bold mb-2 ${textPrimary}`}>
            Zugriff verweigert
          </h2>
          <p className={`text-sm ${textSecondary}`}>
            Sie sind nicht berechtigt, diese Seite zu sehen. Bitte wenden Sie
            sich an Ihren Administrator.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgClass} px-2 py-3 sm:px-4 sm:py-4 lg:px-6`}
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-3 sm:mb-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1
                className={`flex items-center gap-2 text-lg sm:text-xl font-bold ${textPrimary}`}
              >
                {/* Mobile hamburger */}
                <button
                  onClick={openSidebar}
                  className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                  aria-label="Menü öffnen"
                >
                  <FiMenu className="h-4 w-4" />
                </button>
                Posteingang
              </h1>
            </div>
          </div>
        </motion.header>

        {/* View toggle (Kontaktanfragen / Fahrzeuge) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mb-3 sm:mb-4 rounded-lg border px-1 py-1 flex max-w-sm transition-colors duration-300 ${borderColor} ${cardBg}`}
        >
          <button
            onClick={() => setViewMode("submissions")}
            className={`flex-1 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 ${
              viewMode === "submissions"
                ? darkMode
                  ? "bg-slate-600 text-white shadow"
                  : "bg-slate-700 text-white shadow"
                : darkMode
                ? "text-slate-300 hover:bg-gray-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FiMessageSquare className="text-sm" />
            <span>Kontaktanfragen</span>
            {unreadCount > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  darkMode
                    ? "bg-slate-700 text-slate-100"
                    : "bg-slate-300 text-slate-800"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode("cars")}
            className={`flex-1 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-1.5 ${
              viewMode === "cars"
                ? darkMode
                  ? "bg-slate-600 text-white shadow"
                  : "bg-slate-700 text-white shadow"
                : darkMode
                ? "text-slate-300 hover:bg-gray-800"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FaCar className="text-sm" />
            <span>Fahrzeuge</span>
          </button>
        </motion.div>

        {/* Main content */}
        <div className="mb-4">
          {viewMode === "cars" ? (
            <CarsTable darkMode={darkMode} />
          ) : (
            <SubmissionsTable
              setUnreadCount={setUnreadCount}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
