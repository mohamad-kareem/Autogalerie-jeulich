// app/(components)/DashboardContent.jsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiKey,
  FiFileText,
  FiClock,
  FiUsers,
  FiArchive,
  FiInbox,
  FiUserPlus,
  FiPieChart,
  FiPackage,
  FiGrid,
  FiChevronRight,
  FiMenu,
  FiX,
  FiCamera,
  FiAlertTriangle,
  FiSun,
  FiMoon,
  FiCheck,
  FiCheckSquare,
  FiSquare,
  FiDroplet,
  FiMapPin,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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

function getNextWeekdayDate(targetIndex) {
  const now = new Date();
  const current = now.getDay(); // 0 = Sonntag, ... 6 = Samstag
  let diff = (targetIndex - current + 7) % 7;
  if (diff === 0) diff = 7; // always "next" occurrence
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return d;
}

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
    let year = dateMatch[3]
      ? parseInt(
          dateMatch[3].length === 2 ? "20" + dateMatch[3] : dateMatch[3],
          10
        )
      : currentYear;

    date = new Date(year, month, day);
  } else {
    for (let i = 0; i < WEEKDAYS.length; i++) {
      if (lower.includes(WEEKDAYS[i])) {
        const todayIndex = now.getDay();
        const targetIndex = i;

        const d = new Date(now);
        let diff = (targetIndex - todayIndex + 7) % 7;

        d.setDate(now.getDate() + diff);
        date = d;
        fromWeekday = true;
        break;
      }
    }
  }

  if (!date) return null;

  const timeMatch = lower.match(/(\d{1,2})\s*[:\.]?\s*(\d{2})?\s*uhr/);
  let hours = 10;
  let minutes = 0;

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    if (timeMatch[2]) {
      minutes = parseInt(timeMatch[2], 10);
    }
  }

  date.setHours(hours, minutes, 0, 0);

  if (fromWeekday && date <= now) {
    date.setDate(date.getDate() + 7);
  }

  return {
    title,
    date,
  };
}

function extractUpcomingAppointments(board) {
  if (!board || !board.columns || !board.tasks) return [];

  const columns = board.columns;
  const tasks = board.tasks;

  const terminsColumn = Object.values(columns).find(
    (col) =>
      typeof col?.title === "string" &&
      col.title.toLowerCase().includes("termin")
  );

  if (!terminsColumn) return [];

  const now = new Date();
  const HORIZON_MS = 72 * 60 * 60 * 1000;

  const appointments = [];

  (terminsColumn.taskIds || []).forEach((taskId) => {
    const t = tasks[taskId];
    if (!t || !t.title) return;

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

/* ─────────────────────────────────────────
   Dashboard Component
   ───────────────────────────────────────── */

const DashboardContent = ({
  user,
  unreadCount,
  soldScheins,
  onDismissSchein,
}) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [visibleScheins, setVisibleScheins] = useState(soldScheins || []);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // NEW: Fuel modal state
  const [showFuelModal, setShowFuelModal] = useState(false);

  // Task modal states
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedScheinTasks, setSelectedScheinTasks] = useState(null);
  const [taskCheckboxes, setTaskCheckboxes] = useState({});
  const [savingTasks, setSavingTasks] = useState(false);

  // Initialize dark mode
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
        const appointments = extractUpcomingAppointments(board);
        setUpcomingAppointments(appointments);
      } catch (err) {
        console.error("Fehler beim Laden der Kundentermine:", err);
        setUpcomingAppointments([]);
      }
    };

    fetchAppointments();
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

  // Open tasks modal
  const openTasksModal = (schein) => {
    setSelectedScheinTasks(schein);

    // Initialize checkboxes based on completedTasks
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

  // Handle checkbox change
  const handleTaskCheckboxChange = (index) => {
    setTaskCheckboxes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Save completed tasks
  const handleSaveTasks = async () => {
    if (!selectedScheinTasks?._id) return;

    setSavingTasks(true);
    try {
      const completedTasks = [];
      if (Array.isArray(selectedScheinTasks.notes)) {
        selectedScheinTasks.notes.forEach((note, index) => {
          if (taskCheckboxes[index] === true) {
            completedTasks.push(note);
          }
        });
      }

      const res = await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedScheinTasks._id,
          completedTasks: completedTasks,
        }),
      });

      if (!res.ok) throw new Error("Failed to save tasks");

      const updatedSchein = await res.json();

      setVisibleScheins((prev) =>
        prev.map((s) =>
          s._id === updatedSchein._id
            ? { ...s, completedTasks: updatedSchein.completedTasks }
            : s
        )
      );

      setShowTasksModal(false);
    } catch (err) {
      console.error("Fehler beim Speichern der Aufgaben:", err);
      alert("Fehler beim Speichern der Aufgaben");
    } finally {
      setSavingTasks(false);
    }
  };

  // Get active (incomplete) tasks count
  const getActiveTasksCount = (schein) => {
    if (!Array.isArray(schein.notes)) return 0;

    const completedTasks = schein.completedTasks || [];
    return schein.notes.filter((note) => !completedTasks.includes(note)).length;
  };

  const adminOnlyRoutes = [
    "/kaufvertrag/archiv",
    "/Reg",
    "/Zeiterfassungsverwaltung",
    "/excel",
  ];

  const firstName = user?.name?.split(" ")[0] || "Admin";
  const isAdmin = user?.role === "admin";

  const navItems = [
    {
      href: "/aufgabenboard",
      icon: <FiGrid className="text-yellow-500" />,
      label: "Trello",
      badge: null,
    },
    {
      href: "/schlussel",
      icon: <FiKey className="text-slate-400" />,
      label: "Schlüssel",
      badge: null,
    },
    {
      href: "/kaufvertrag/liste",
      icon: <FiFileText className="text-green-400" />,
      label: "Verträge",
      badge: null,
    },
    {
      href: "/kaufvertrag/archiv",
      icon: <FiArchive className="text-purple-400" />,
      label: "Archiv",
      badge: null,
    },
    {
      href: "/Auto-scheins",
      icon: <FiCamera className="text-orange-400" />,
      label: "Fahrzeugscheine",
      badge: null,
    },
    {
      href: "/Rotkennzeichen",
      icon: <FiMapPin className="text-red-400" />,
      label: "Rotkennzeichen",
      badge: null,
    },
    {
      href: "/punsh",
      icon: <FiClock className=" text-sky-400" />,
      label: "Stempeluhr",
      badge: null,
    },
    {
      href: "/kaufvertrag/auswahl",
      icon: <FiFileText className="text-teal-400" />,
      label: "Neuer Vertrag",
      badge: null,
    },
    {
      href: "/Zeiterfassungsverwaltung",
      icon: <FiClock className="text-yellow-400" />,
      label: "Zeiterfassung",
      badge: null,
    },
    {
      href: "/Posteingang",
      icon: <FiInbox className="text-pink-400" />,
      label: "Posteingang",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: "/Autoteil",
      icon: <FiPackage className="text-indigo-400" />,
      label: "Teile-Reklamation",
      badge: null,
    },
    {
      href: "/Reg",
      icon: <FiUserPlus className="text-rose-400" />,
      label: "Admin hinzufügen",
      badge: null,
    },
  ];

  const isActiveRoute = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  const SidebarLink = ({ href, icon, label, badge }) => {
    const active = isActiveRoute(href);

    return (
      <Link href={href}>
        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 mx-2 cursor-pointer transition-all duration-200
          ${
            active
              ? `${
                  darkMode
                    ? "bg-slate-900/50 text-slate-100 border-r-2 border-slate-400"
                    : "bg-slate-50 text-slate-700 border-r-2 border-slate-600"
                }`
              : `${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-lg ${
                active ? "scale-110" : ""
              } transition-transform`}
            >
              {icon}
            </span>
            <span className="font-medium text-sm">{label}</span>
          </div>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold min-w-6 text-center ${
                active
                  ? `${
                      darkMode
                        ? "bg-slate-700 text-slate-100"
                        : "bg-slate-100 text-slate-700"
                    }`
                  : "bg-red-500 text-white"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col transition-colors duration-300">
      <div
        className={`flex items-center gap-3 px-[1.92rem] py-[0.85rem] border-b transition-colors duration-300 ${
          darkMode ? "border-gray-700" : "border-slate-200"
        }`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700">
          <FiGrid className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold truncate transition-colors duration-300 ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Autogalerie Jülich
          </p>
          <p
            className={`text-xs truncate transition-colors duration-300 ${
              darkMode ? "text-gray-400" : "text-slate-500"
            }`}
          >
            {firstName}
          </p>
        </div>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto pb-20">
        <div className="space-y-1">
          {navItems
            .filter((item) => {
              if (adminOnlyRoutes.includes(item.href) && !isAdmin) {
                return false;
              }
              return true;
            })
            .map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
              />
            ))}
        </div>
      </nav>

      {/* Dark Mode Toggle at the bottom */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button
          onClick={toggleDarkMode}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-300 border ${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-600"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {darkMode ? (
              <>
                <FiSun className="text-lg text-yellow-400" />
                <span className="font-medium text-sm">Hell</span>
              </>
            ) : (
              <>
                <FiMoon className="text-lg text-slate-400" />
                <span className="font-medium text-sm">Dunkel</span>
              </>
            )}
          </div>
          <div
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
              darkMode
                ? "bg-slate-600 justify-end"
                : "bg-slate-400 justify-start"
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300" />
          </div>
        </button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────
     Dashboard data derived from visibleScheins
     ───────────────────────────────────────── */

  const soldOnlyScheins = useMemo(
    () =>
      (visibleScheins || []).filter(
        (schein) => schein.keySold === true && schein.dashboardHidden !== true
      ),
    [visibleScheins]
  );

  const fuelAlertScheins = useMemo(
    () =>
      (visibleScheins || []).filter(
        (schein) =>
          schein.fuelNeeded === true && schein.dashboardHidden !== true
      ),
    [visibleScheins]
  );

  const formatSoldDate = (schein) => {
    const dateValue = schein.soldAt || schein.updatedAt || schein.createdAt;
    if (!dateValue) return "–";
    return new Date(dateValue).toLocaleDateString("de-DE");
  };

  const formatAppointmentDateTime = (date) => {
    try {
      return (
        date.toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }) +
        " • " +
        date.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return "";
    }
  };

  const handleDismissSchein = async (id) => {
    setVisibleScheins((prev) => prev.filter((s) => s._id !== id));

    try {
      await fetch("/api/carschein", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          dashboardHidden: true,
        }),
      });

      if (onDismissSchein) {
        onDismissSchein(id);
      }
    } catch (err) {
      console.error("Fehler beim Ausblenden auf dem Dashboard:", err);
    }
  };

  // Conditional classes based on dark mode
  const mainBgClass = darkMode ? "bg-gray-900" : "bg-slate-50";
  const textClass = darkMode ? "text-gray-100" : "text-slate-900";
  const sidebarBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const sidebarBorderClass = darkMode ? "border-gray-700" : "border-slate-200";

  return (
    <div
      className={`min-h-screen ${mainBgClass} ${textClass} transition-colors duration-300`}
    >
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex md:w-64 lg:w-55 border-r transition-colors duration-300 ${sidebarBgClass} ${sidebarBorderClass} relative`}
        >
          <SidebarContent />
        </aside>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.aside
                className={`fixed inset-y-0 left-0 z-50 w-64 border-r shadow-xl md:hidden transition-colors duration-300 ${sidebarBgClass} ${sidebarBorderClass}`}
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "tween", duration: 0.2 }}
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main area */}
        <div className="flex flex-1 flex-col">
          {/* Top bar - Mobile optimized */}
          <header
            className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b px-3 sm:px-6 lg:px-4 backdrop-blur transition-colors duration-300 ${
              darkMode
                ? "border-gray-700 bg-gray-800/90"
                : "border-slate-200 bg-white/90"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-300 ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                } md:hidden`}
                onClick={() => setMobileSidebarOpen(true)}
              >
                <FiMenu className="h-4 w-4" />
              </button>

              {/* Fuel alert - now opens modal */}
              <div className="flex items-center">
                {fuelAlertScheins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFuelModal(true)}
                    className={`inline-flex items-center gap-1 sm:gap-1 border px-2 py-1 sm:px-3 sm:py-1 text-xs font-medium shadow-sm transition-colors mr-12 ${
                      darkMode
                        ? "border-amber-900 bg-amber-900/50 text-amber-200 hover:bg-amber-800 hover:border-amber-600"
                        : "border-amber-200 bg-amber-50/90 text-amber-800 hover:bg-amber-100 hover:border-amber-300"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full flex-shrink-0 ${
                        darkMode ? "bg-amber-800" : "bg-amber-100"
                      }`}
                    >
                      <FiAlertTriangle
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          darkMode ? "text-amber-400" : "text-amber-500"
                        }`}
                      />
                    </span>
                    <span className="text-xs">
                      {fuelAlertScheins.length}{" "}
                      {fuelAlertScheins.length === 1 ? "Fahrzeug" : "Fahrzeuge"}{" "}
                      mit leerem Tank
                    </span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Main content - Mobile optimized */}
          <main className="flex-1 px-6 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
            {/* Verkauft-Karten - Mobile responsive grid */}
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
                    {/* Status bar */}
                    <div className="h-1 bg-slate-500" />

                    {/* Header */}
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

                    {/* Compact details */}
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
                          className={`font-medium ml-1 sm:mr-7 sm:max-w-[80px] ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {schein.finNumber || "–"}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
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
                        className={`text-[12px] sm:text-xs font-medium hover:text-slate-300 transition-colors ${
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
                  <FiFileText
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      darkMode ? "text-gray-400" : "text-gray-400"
                    }`}
                  />
                </div>
                <h3
                  className={`text-sm font-semibold mb-1 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Keine verkauften Scheine
                </h3>
                <p
                  className={`text-xs max-w-xs px-4 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Keine Fahrzeugscheine als verkauft markiert.
                </p>
              </div>
            )}

            {/* Bevorstehende Kundentermine */}
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
                      nächsten 48 Stunden
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
                              <p
                                className={`text-[10px] sm:text-xs font-medium ${
                                  darkMode ? "text-slate-400" : "text-slate-600"
                                }`}
                              >
                                {formatAppointmentDateTime(appt.date)}
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
              {/* Modal Header */}
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

              {/* Modal Body */}
              <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">
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
                      <FiFileText
                        className={`h-6 w-6 ${
                          darkMode ? "text-gray-400" : "text-gray-400"
                        }`}
                      />
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

              {/* Modal Footer */}
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

      {/* Fuel Alert Modal */}
      {showFuelModal && fuelAlertScheins.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFuelModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-lg rounded-xl shadow-2xl border ${
                darkMode
                  ? "bg-gray-900 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between px-5 py-3 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      darkMode ? "bg-amber-900/60" : "bg-amber-50"
                    }`}
                  >
                    <FiDroplet
                      className={darkMode ? "text-amber-300" : "text-amber-500"}
                    />
                  </span>
                  <div>
                    <h3
                      className={`text-sm sm:text-base font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Fahrzeuge mit leerem Tank
                    </h3>
                    <p
                      className={`text-[11px] sm:text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {fuelAlertScheins.length}{" "}
                      {fuelAlertScheins.length === 1
                        ? "Fahrzeug benötigt"
                        : "Fahrzeuge benötigen"}{" "}
                      Benzin / Diesel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-2">
                {fuelAlertScheins.map((car) => (
                  <div
                    key={car._id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                      darkMode
                        ? "bg-gray-800/80 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div
                        className={`font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {car.carName || "Unbekanntes Fahrzeug"}
                      </div>
                      <div
                        className={`text-[11px] ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        FIN:{" "}
                        <span className="font-medium">
                          {car.finNumber || "–"}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Besitzer:{" "}
                        <span className="font-medium">{car.owner || "–"}</span>
                      </div>
                    </div>
                    <div className="flex items-end sm:items-center gap-2 sm:flex-col sm:gap-1 sm:text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          darkMode
                            ? "bg-amber-900/60 text-amber-200"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <FiAlertTriangle className="h-3 w-3" />
                        Tank leer
                      </span>
                      <Link
                        href="/Auto-scheins"
                        className={`text-[11px] underline decoration-dotted ${
                          darkMode
                            ? "text-slate-300 hover:text-slate-100"
                            : "text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        In Fahrzeugscheinen öffnen
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                className={`flex justify-end border-t px-5 py-3 ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => setShowFuelModal(false)}
                  className={`px-4 py-2 text-sm rounded-md ${
                    darkMode
                      ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardContent;
