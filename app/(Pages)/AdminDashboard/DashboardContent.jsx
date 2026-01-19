// app/(components)/DashboardContent.jsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FiCheckSquare,
  FiSquare,
  FiDroplet,
  FiMenu,
  FiX,
  FiFileText,
  FiClock,
} from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";

/* ─────────────────────────────────────────
   Helper functions for Termine / appointments
   ───────────────────────────────────────── */

const WEEKDAYS = [
  "sonntag",
  "montag",
  "dienstag",
  "mittwoch",
  "donnerstag",
  "freitag",
  "samstag",
];

function parseAppointmentFromTitle(title) {
  if (!title) return null;
  const lower = title.toLowerCase().trim();

  const now = new Date();
  const currentYear = now.getFullYear();

  let date = null;
  let fromWeekday = false;

  const dateMatch = lower.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const year = dateMatch[3]
      ? parseInt(
          dateMatch[3].length === 2 ? "20" + dateMatch[3] : dateMatch[3],
          10,
        )
      : currentYear;

    date = new Date(year, month, day);
  } else {
    for (let i = 0; i < WEEKDAYS.length; i++) {
      if (lower.includes(WEEKDAYS[i])) {
        const todayIndex = now.getDay();
        const targetIndex = i;

        const d = new Date(now);
        const diff = (targetIndex - todayIndex + 7) % 7;

        d.setDate(now.getDate() + diff);
        date = d;
        fromWeekday = true;
        break;
      }
    }
  }

  if (!date) return null;

  const timeMatch = lower.match(
    /(\d{1,2})\s*[:\.]\s*(\d{2})|\b(\d{1,2})\s*uhr\b/,
  );
  if (!timeMatch) return null; // no time → not a Termin

  let hours;
  let minutes;

  if (timeMatch[1] && timeMatch[2]) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
  } else if (timeMatch[3]) {
    hours = parseInt(timeMatch[3], 10);
    minutes = 0;
  }

  date.setHours(hours, minutes, 0, 0);

  if (fromWeekday && date <= now) {
    date.setDate(date.getDate() + 7);
  }

  return { title, date };
}

function extractUpcomingAppointments(board) {
  if (!board || !board.columns || !board.tasks) return [];

  const terminsColumn = Object.values(board.columns).find(
    (col) =>
      typeof col?.title === "string" &&
      col.title.toLowerCase().includes("termin"),
  );
  if (!terminsColumn) return [];

  const now = new Date();
  const HORIZON_MS = 72 * 60 * 60 * 1000;

  const appointments = [];

  (terminsColumn.taskIds || []).forEach((taskId) => {
    const t = board.tasks[taskId];
    if (!t?.title) return;

    const parsed = parseAppointmentFromTitle(t.title);
    if (!parsed) return;

    const diff = parsed.date.getTime() - now.getTime();
    if (diff > 0 && diff <= HORIZON_MS) {
      appointments.push({
        id: t.id || taskId,
        title: t.title,
        date: parsed.date,
      });
    }
  });

  appointments.sort((a, b) => a.date.getTime() - b.date.getTime());
  return appointments;
}

// TÜV Logo Component
const TuvLogo = ({ size = 28, className = "" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-blue-600" />
      <div className="absolute inset-[1px] rounded-full bg-white" />
      <div className="absolute inset-[2px] rounded-full bg-blue-600" />
      <div className="relative z-10 flex flex-col items-center mt-1">
        <span
          className="text-white font-bold leading-none"
          style={{ fontSize: size * 0.35 }}
        >
          TÜV
        </span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   Dashboard Component
   ───────────────────────────────────────── */

const DashboardContent = ({
  user,
  unreadCount,
  soldScheins,
  onDismissSchein,
}) => {
  const [visibleScheins, setVisibleScheins] = useState(soldScheins || []);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showTuevModal, setShowTuevModal] = useState(false);

  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedScheinTasks, setSelectedScheinTasks] = useState(null);
  const [taskCheckboxes, setTaskCheckboxes] = useState({});
  const [savingTasks, setSavingTasks] = useState(false);

  const { openSidebar } = useSidebar();

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setDarkMode(isDark);

    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  // whenever parent updates list
  useEffect(() => {
    setVisibleScheins(soldScheins || []);
  }, [soldScheins]);

  // Load upcoming appointments from taskboard
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/taskboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load board for Termine");
        const json = await res.json();
        const board = json.board || {};
        setUpcomingAppointments(extractUpcomingAppointments(board));
      } catch (err) {
        console.error("Fehler beim Laden der Kundentermine:", err);
        setUpcomingAppointments([]);
      }
    };

    fetchAppointments();
  }, []);

  // Open tasks modal
  const openTasksModal = (schein) => {
    setSelectedScheinTasks(schein);

    const initialCheckboxes = {};
    if (Array.isArray(schein.notes)) {
      schein.notes.forEach((note, index) => {
        const isCompleted = schein.completedTasks?.includes(note) || false;
        initialCheckboxes[index] = isCompleted;
      });
    }
    setTaskCheckboxes(initialCheckboxes);
    setShowTasksModal(true);
  };

  const handleTaskCheckboxChange = (index) => {
    setTaskCheckboxes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSaveTasks = async () => {
    if (!selectedScheinTasks?._id) return;

    setSavingTasks(true);
    try {
      const completedTasks = [];
      if (Array.isArray(selectedScheinTasks.notes)) {
        selectedScheinTasks.notes.forEach((note, index) => {
          if (taskCheckboxes[index] === true) completedTasks.push(note);
        });
      }

      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedScheinTasks._id,
          completedTasks,
        }),
      });

      if (!res.ok) throw new Error("Failed to save tasks");
      const updatedSchein = await res.json();

      setVisibleScheins((prev) =>
        prev.map((s) =>
          s._id === updatedSchein._id
            ? { ...s, completedTasks: updatedSchein.completedTasks }
            : s,
        ),
      );

      setShowTasksModal(false);
    } catch (err) {
      console.error("Fehler beim Speichern der Aufgaben:", err);
      alert("Fehler beim Speichern der Aufgaben");
    } finally {
      setSavingTasks(false);
    }
  };

  const getActiveTasksCount = (schein) => {
    if (!Array.isArray(schein.notes)) return 0;
    const completedTasks = schein.completedTasks || [];
    return schein.notes.filter((note) => !completedTasks.includes(note)).length;
  };

  /* ─────────────────────────────────────────
     Derived dashboard data
     ───────────────────────────────────────── */

  const soldOnlyScheins = useMemo(
    () =>
      (visibleScheins || []).filter(
        (schein) => schein.keySold === true && schein.dashboardHidden !== true,
      ),
    [visibleScheins],
  );

  const fuelAlertScheins = useMemo(
    () =>
      (visibleScheins || []).filter(
        (schein) =>
          schein.fuelNeeded === true && schein.dashboardHidden !== true,
      ),
    [visibleScheins],
  );

  const tuevScheins = useMemo(
    () =>
      (visibleScheins || []).filter(
        (schein) => schein?.stage === "TUEV" && schein.dashboardHidden !== true,
      ),
    [visibleScheins],
  );

  const formatSoldDate = (schein) => {
    const dateValue = schein.soldAt || schein.updatedAt || schein.createdAt;
    if (!dateValue) return "–";
    return new Date(dateValue).toLocaleDateString("de-DE");
  };

  const handleDismissSchein = async (id) => {
    setVisibleScheins((prev) => prev.filter((s) => s._id !== id));

    try {
      await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dashboardHidden: true }),
      });

      onDismissSchein?.(id);
    } catch (err) {
      console.error("Fehler beim Ausblenden auf dem Dashboard:", err);
    }
  };

  // Conditional classes based on dark mode
  const mainBgClass = darkMode ? "bg-gray-900" : "bg-slate-50";
  const textClass = darkMode ? "text-gray-100" : "text-slate-900";

  // Compact top buttons (mobile), keep desktop unchanged
  const topPillBase =
    "inline-flex items-center gap-2 rounded-md font-medium shadow-sm transition-colors whitespace-nowrap";
  const topPillPad = "px-2.5 py-1.5 sm:px-3 sm:py-2"; // compact on mobile, same-ish on desktop
  const topPillText = "text-[11px] sm:text-xs";

  return (
    <div
      className={`${mainBgClass} ${textClass} transition-colors duration-300 min-h-full flex`}
    >
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header
            className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b px-3 sm:px-6 lg:px-4 backdrop-blur transition-colors duration-300 ${
              darkMode
                ? "border-gray-700 bg-gray-800/90"
                : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <button
                onClick={openSidebar}
                className="md:hidden p-2 rounded-md hover:bg-gray-700/40 transition-colors"
                aria-label="Menü öffnen"
              >
                <FiMenu
                  className={`h-5 w-5 ${
                    darkMode ? "text-white" : "text-gray-700"
                  }`}
                />
              </button>

              {/* ✅ Mobile alignment fix: no wrap, compact, side-by-side */}
              <div className="flex items-center gap-2 flex-nowrap w-full overflow-x-auto sm:overflow-visible">
                {/* Fuel alert button */}
                {fuelAlertScheins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFuelModal(true)}
                    className={`${topPillBase} ${topPillPad} ${topPillText} ${
                      darkMode
                        ? "bg-amber-900/30 text-amber-200 hover:bg-amber-800/40 border border-amber-800/30"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 sm:h-6 sm:w-6 items-center justify-center rounded-md ${
                        darkMode ? "bg-amber-800/50" : "bg-amber-100"
                      }`}
                    >
                      <FiDroplet
                        className={`h-3.5 w-3.5 ${
                          darkMode ? "text-amber-300" : "text-amber-500"
                        }`}
                      />
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="sm:hidden">
                        {fuelAlertScheins.length} leerem Tank
                      </span>
                      <span className="hidden sm:inline">
                        {fuelAlertScheins.length}{" "}
                        {fuelAlertScheins.length === 1
                          ? "Fahrzeug"
                          : "Fahrzeuge"}{" "}
                        mit leerem Tank
                      </span>
                    </span>
                  </button>
                )}

                {/* TÜV alert button */}
                {tuevScheins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTuevModal(true)}
                    className={`${topPillBase} ${topPillPad} ${topPillText} ${
                      darkMode
                        ? "bg-blue-900/30 text-blue-200 hover:bg-blue-800/40 border border-blue-800/30"
                        : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
                    }`}
                  >
                    <TuvLogo size={26} className="shrink-0" />
                    <span className="whitespace-nowrap">
                      <span className="sm:hidden">
                        {tuevScheins.length} in TÜV
                      </span>
                      <span className="hidden sm:inline">
                        {tuevScheins.length}{" "}
                        {tuevScheins.length === 1 ? "Fahrzeug" : "Fahrzeuge"} in
                        TÜV
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 px-6 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
            {/* Sold cards */}
            {soldOnlyScheins.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {soldOnlyScheins.map((schein) => (
                  <div
                    key={schein._id}
                    className={`group relative border hover:shadow-lg transition-all duration-200 ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 hover:border-gray-500"
                        : "bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm"
                    }`}
                  >
                    <div className="h-1 bg-slate-500" />

                    <div
                      className={`p-2 sm:p-3 border-b ${
                        darkMode ? "border-gray-700" : "border-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3
                          className={`text-sm sm:text-base font-semibold break-words leading-tight min-h-[1rem] sm:min-h-[1.5rem] line-clamp-2 ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {schein.carName || "Unbekannt"}
                        </h3>

                        <button
                          onClick={() => handleDismissSchein(schein._id)}
                          title="Entfernen"
                          aria-label="Entfernen"
                          className={`ml-1 sm:ml-2 flex-shrink-0 rounded-full p-1.5
                            opacity-0 group-hover:opacity-100
                            transition-all duration-200
                            ${
                              darkMode
                                ? "bg-gray-700/40 hover:bg-yellow-600/30 text-gray-300 hover:text-yellow-300"
                                : "bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-yellow-600"
                            }
                            hover:scale-110`}
                        >
                          <FiX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>

                      <p
                        className={`text-[11px] sm:text-xs mt-0.5 ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Verkauft am {formatSoldDate(schein)}
                      </p>
                    </div>

                    <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                      <div className="flex justify-center items-center text-[14px] sm:text-base">
                        <span
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Schlüssel:
                        </span>
                        <span
                          className={`font-medium ml-1 sm:ml-2 truncate max-w-[30px] sm:max-w-[80px] ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {schein.keyNumber || "–"}
                        </span>
                      </div>

                      <div className="flex justify-center items-center text-[14px] sm:text-base">
                        <span
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Besitzer:
                        </span>
                        <span
                          className={`font-medium ml-1 sm:ml-2 truncate max-w-[60px] sm:max-w-[80px] ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {schein.owner || "–"}
                        </span>
                      </div>

                      <div className="flex justify-center items-center text-[14px] sm:text-base">
                        <span
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          FIN:
                        </span>
                        <span
                          className={`font-medium ml-1 sm:mr-14 sm:max-w-[80px] ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {schein.finNumber || "–"}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 border-t flex justify-between items-center ${
                        darkMode
                          ? "border-gray-700 bg-gray-750"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <span
                        className={`text-[12px] sm:text-xs font-medium ${
                          getActiveTasksCount(schein) === 0
                            ? darkMode
                              ? "text-yellow-300"
                              : "text-yellow-600"
                            : darkMode
                              ? "text-gray-400"
                              : "text-gray-600"
                        }`}
                      >
                        {(() => {
                          const active = getActiveTasksCount(schein);
                          return active === 0
                            ? "Bereit zur Abholung"
                            : `${active} aktive Aufgaben`;
                        })()}
                      </span>

                      <button
                        onClick={() => openTasksModal(schein)}
                        className={`text-[12px] sm:text-xs font-medium transition-colors ${
                          darkMode
                            ? "text-slate-400 hover:text-slate-300"
                            : "text-slate-600 hover:text-slate-700"
                        }`}
                      >
                        Einzelheiten
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 sm:py-12 text-center">
                <div
                  className={`mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <FiFileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <h3
                  className={`text-sm font-semibold mb-1 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Aktuell keine verkauften Fahrzeuge
                </h3>
              </div>
            )}

            {/* Upcoming appointments */}
            {upcomingAppointments.length > 0 && (
              <section className="mt-4 sm:mt-6">
                <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-600">
                    <FiClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <h2
                      className={`text-sm sm:text-base font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Bevorstehende Kundentermine
                    </h2>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {upcomingAppointments.length} Termin
                      {upcomingAppointments.length !== 1 ? "e" : ""} in den
                      nächsten 72 Stunden
                    </p>
                  </div>
                </div>

                <div
                  className={`border rounded-lg hover:border-slate-500 transition-all duration-200 w-full max-w-sm ${
                    darkMode
                      ? "bg-gray-800 border-slate-700"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="p-2 sm:p-3">
                    <div className="space-y-2 sm:space-y-3">
                      {upcomingAppointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-start gap-2 sm:gap-3"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 rounded-full mt-1 sm:mt-1.5" />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs sm:text-sm font-medium truncate ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {appt.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Tasks Modal */}
      {showTasksModal && selectedScheinTasks && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTasksModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-lg rounded-xl shadow-2xl ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } border`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-center justify-between border-b px-5 py-4 ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div>
                  <h3
                    className={`text-base font-semibold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedScheinTasks.carName || "Unbekanntes Fahrzeug"}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Aufgaben verwalten
                  </p>
                </div>
                <button
                  onClick={() => setShowTasksModal(false)}
                  className={`p-2 rounded-full ${
                    darkMode
                      ? "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="px-5 py-4 max-h-[65vh] overflow-y-auto custom-scroll">
                {Array.isArray(selectedScheinTasks.notes) &&
                selectedScheinTasks.notes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedScheinTasks.notes.map((note, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        }`}
                      >
                        <button
                          onClick={() => handleTaskCheckboxChange(index)}
                          className={`mt-0.5 flex-shrink-0 rounded ${
                            taskCheckboxes[index]
                              ? "text-blue-600"
                              : darkMode
                                ? "text-gray-500"
                                : "text-gray-400"
                          }`}
                        >
                          {taskCheckboxes[index] ? (
                            <FiCheckSquare size={20} />
                          ) : (
                            <FiSquare size={20} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-relaxed ${
                              taskCheckboxes[index]
                                ? darkMode
                                  ? "text-gray-400 line-through"
                                  : "text-gray-900 line-through"
                                : darkMode
                                  ? "text-gray-200"
                                  : "text-gray-900"
                            }`}
                          >
                            {note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                        darkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <FiFileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Keine Aufgaben für dieses Fahrzeug vorhanden.
                    </p>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center justify-between border-t px-5 py-4 ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {Object.values(taskCheckboxes).filter(Boolean).length} von{" "}
                    {selectedScheinTasks.notes?.length || 0} Aufgaben erledigt
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTasksModal(false)}
                    disabled={savingTasks}
                    className={`px-4 py-2 text-sm rounded-md border ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    } ${savingTasks ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveTasks}
                    disabled={savingTasks}
                    className={`px-4 py-2 text-sm rounded-md ${
                      savingTasks
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {savingTasks ? "Speichern..." : "Speichern"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Professional TÜV Modal */}
      {showTuevModal && tuevScheins.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTuevModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-lg rounded-lg shadow-xl ${
                darkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TuvLogo />
                    <div>
                      <h3
                        className={`text-base font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        TÜV-Prüfungen
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTuevModal(false)}
                    className={`p-1.5 rounded ${
                      darkMode
                        ? "hover:bg-gray-700 text-gray-400"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Vehicle List */}
              <div className="max-h-[60vh] overflow-y-auto custom-scroll">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`text-left text-xs font-medium border-b ${
                        darkMode
                          ? "border-gray-700 text-gray-400"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <th className="py-3 pl-4 sm:pl-6">Fahrzeug</th>

                      {/* ✅ Hide FIN on mobile only */}
                      <th className="hidden sm:table-cell py-3 px-14">FIN</th>

                      <th className="py-3">Besitzer</th>
                      <th className="py-3 pr-4 sm:pr-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tuevScheins.map((car) => {
                      const passed = !!car?.stageMeta?.tuev?.passed;

                      return (
                        <tr
                          key={car._id}
                          className={`border-b ${
                            darkMode
                              ? "border-gray-700 hover:bg-gray-750"
                              : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-3 pl-4 sm:pl-6">
                            <div className="font-medium text-sm">
                              {car.carName || "Unbekannt"}
                            </div>
                          </td>

                          {/* ✅ Hide FIN on mobile only */}
                          <td className="hidden sm:table-cell py-3">
                            <div
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {car.finNumber || "–"}
                            </div>
                          </td>

                          <td className="py-3">
                            <div
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {car.owner || "–"}
                            </div>
                          </td>

                          <td className="py-3 pr-4 sm:pr-6">
                            <div className="flex justify-end items-center gap-2">
                              <div
                                className={`text-xs px-2.5 py-1 rounded ${
                                  passed
                                    ? darkMode
                                      ? "bg-green-900/40 text-green-300 border border-green-800/30"
                                      : "bg-green-100 text-green-800 border border-green-200"
                                    : darkMode
                                      ? "bg-red-900/40 text-red-300 border border-red-800/30"
                                      : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                              >
                                {passed ? "Bestanden" : "Ausstehend"}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary and Action */}
              <div
                className={`px-6 py-4 border-t ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/Fahrzeugverwaltung"
                      className={`text-xs px-3 py-2 rounded border transition-colors ${
                        darkMode
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Alle anzeigen
                    </Link>
                    <button
                      onClick={() => setShowTuevModal(false)}
                      className={`text-xs px-3 py-2 rounded ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Professional Fuel Modal */}
      {showFuelModal && fuelAlertScheins.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFuelModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-lg rounded-lg shadow-xl ${
                darkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${
                        darkMode ? "bg-amber-900/30" : "bg-amber-100"
                      }`}
                    >
                      <FiDroplet
                        className={`h-5 w-5 ${
                          darkMode ? "text-amber-300" : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-base font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Tankalarm
                      </h3>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {fuelAlertScheins.length} Fahrzeug
                        {fuelAlertScheins.length !== 1 ? "e" : ""} benötig
                        {fuelAlertScheins.length !== 1 ? "en" : "t"} Auftanken
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFuelModal(false)}
                    className={`p-1.5 rounded ${
                      darkMode
                        ? "hover:bg-gray-700 text-gray-400"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              {/* Vehicle List */}
              <div className="max-h-[60vh] overflow-y-auto custom-scroll">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`text-left text-xs font-medium border-b ${
                        darkMode
                          ? "border-gray-700 text-gray-400"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <th className="py-3 pl-4 sm:pl-6">Fahrzeug</th>

                      {/* ✅ Hide FIN on mobile only */}
                      <th className="hidden sm:table-cell py-3 px-14">FIN</th>

                      <th className="py-3">Besitzer</th>
                      <th className="py-3 pr-4 sm:pr-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelAlertScheins.map((car) => (
                      <tr
                        key={car._id}
                        className={`border-b ${
                          darkMode
                            ? "border-gray-700 hover:bg-gray-750"
                            : "border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <td className="py-3 pl-4 sm:pl-6">
                          <div className="font-medium text-sm">
                            {car.carName || "Unbekannt"}
                          </div>
                        </td>

                        {/* ✅ Hide FIN on mobile only */}
                        <td className="hidden sm:table-cell py-3">
                          <div
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {car.finNumber || "–"}
                          </div>
                        </td>

                        <td className="py-3">
                          <div
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {car.owner || "–"}
                          </div>
                        </td>

                        <td className="py-3 pr-4 sm:pr-6">
                          <div className="flex justify-center">
                            <div
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded ${
                                darkMode
                                  ? "bg-amber-900/40 text-amber-300 border border-amber-800/30"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              <FiDroplet size={12} />
                              <span>Leer</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Action */}
              <div
                className={`px-6 py-4 border-t ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/Fahrzeugverwaltung"
                      className={`text-xs px-3 py-2 rounded border transition-colors ${
                        darkMode
                          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Alle anzeigen
                    </Link>
                    <button
                      onClick={() => setShowFuelModal(false)}
                      className={`text-xs px-3 py-2 rounded ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardContent;
