// app/(components)/DashboardContent.jsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FiDroplet,
  FiMenu,
  FiX,
  FiFileText,
  FiClock,
  FiTool,
} from "react-icons/fi";
import { Check, CheckCircle2, KeyRound, ListTodo, Loader2, MapPin, Phone, Truck } from "lucide-react";
import { ErrorNote, Modal } from "@/app/(components)/sales/ui";
import { useSidebar } from "@/app/(components)/SidebarContext";
import { alertDialog, confirmDialog } from "@/app/(components)/ConfirmHost";
import { mapsHref, telHref } from "@/lib/sales";
import { FaCarSide } from "react-icons/fa";
import DashboardNotesPanel from "@/app/(components)/helpers/DashboardNotesPanel";
import WeeklyTimeSchedule from "@/app/(components)/helpers/WeeklyTimeSchedule";

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

/** One task in the "Aufgaben zur Übergabe" window – ticking saves at once. */
function TaskCard({ title, done, busy, disabled, onToggle }) {
  const text = title.includes(": ") ? title.split(": ").slice(1).join(": ") : title;
  return (
    <div
      className={`flex items-start gap-1 rounded-lg border border-line transition ${
        done ? "bg-canvas/60" : "bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <label className={`flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 ${busy || disabled ? "cursor-wait" : ""}`}>
        <input type="checkbox" checked={done} disabled={busy || disabled} onChange={onToggle} className="peer sr-only" />
        <span
          aria-hidden="true"
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 ${
            done
              ? "border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white"
              : "border-[#a3aab3] bg-gradient-to-b from-white to-[#eef0f2] text-muted"
          }`}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" strokeWidth={2.75} /> : null}
        </span>
        <span className={`min-w-0 break-words text-[13px] font-medium leading-snug ${done ? "text-muted line-through" : "text-ink"}`}>
          {text}
        </span>
      </label>
    </div>
  );
}

const STEEL_BADGE = "bg-gradient-to-b from-white to-[#eef0f2] text-[#3e454e] ring-1 ring-inset ring-[#a3aab3]/35";

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
  const [showWerkstattModal, setShowWerkstattModal] = useState(false);

  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedScheinTasks, setSelectedScheinTasks] = useState(null); // id of the car
  const [savingTask, setSavingTask] = useState("");
  const [taskError, setTaskError] = useState("");
  const [handingOver, setHandingOver] = useState("");

  const { openSidebar } = useSidebar();

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = "light" /* portal: always light */;
    const systemPrefersDark = false;

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

  // Open the tasks window
  const openTasksModal = (schein) => {
    setSelectedScheinTasks(schein._id);
    setTaskError("");
    setShowTasksModal(true);
  };

  const closeTasksModal = () => setShowTasksModal(false);

  /** Ticks or unticks one task and saves it right away. */
  const toggleTask = async (schein, title) => {
    if (savingTask) return;
    setSavingTask(title);
    setTaskError("");
    try {
      const res = await fetch(`/api/fahrzeugakte/${schein._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleTask", title }),
      });
      if (!res.ok) throw new Error();
      setVisibleScheins((prev) =>
        prev.map((s) => {
          if (s._id !== schein._id) return s;
          const done = new Set(s.completedTasks || []);
          if (done.has(title)) done.delete(title);
          else done.add(title);
          return { ...s, completedTasks: [...done] };
        }),
      );
    } catch {
      setTaskError("Die Aufgabe konnte nicht gespeichert werden.");
    } finally {
      setSavingTask("");
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
        (schein) =>
          schein.keySold === true &&
          schein.dashboardHidden !== true &&
          !schein.handedOverAt,
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

  const werkstattScheins = useMemo(
    () =>
      (visibleScheins || []).filter(
        (schein) =>
          schein?.stage === "WERKSTATT" && schein.dashboardHidden !== true,
      ),
    [visibleScheins],
  );

  const formatSoldDate = (schein) => {
    const dateValue = schein.soldAt || schein.updatedAt || schein.createdAt;
    if (!dateValue) return "–";
    return new Date(dateValue).toLocaleDateString("de-DE");
  };

  const handOver = async (schein) => {
    const open = getActiveTasksCount(schein);
    const name = schein.carName || "Fahrzeug";
    const buyer = schein.soldContactId?.customerName;
    const ok = await confirmDialog(
      open
        ? { title: "Noch offene Aufgaben", message: `${name}: noch ${open} offene Aufgabe(n). Trotzdem übergeben?`, confirmLabel: "Trotzdem übergeben" }
        : { title: "Fahrzeug übergeben", message: `${name} an ${buyer || "den Käufer"} übergeben?`, confirmLabel: "Übergeben" },
    );
    if (!ok) return;
    setHandingOver(schein._id);
    try {
      const res = await fetch(`/api/fahrzeugakte/${schein._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "handover" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Übergabe fehlgeschlagen.");
      setVisibleScheins((prev) => prev.filter((s) => s._id !== schein._id));
      onDismissSchein?.(schein._id);
    } catch (err) {
      alertDialog(err.message || "Übergabe fehlgeschlagen.");
    } finally {
      setHandingOver("");
    }
  };

  // Conditional classes based on dark mode
  const mainBgClass = darkMode ? "bg-gray-900" : "bg-transparent";
  const textClass = darkMode ? "text-gray-100" : "text-slate-900";

  // Compact top buttons (mobile), keep desktop unchanged
  const topPillBase =
    "inline-flex items-center gap-2 rounded-[4px] font-semibold shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] transition-colors whitespace-nowrap";
  const topPillPad = "px-2.5 py-1.5 sm:px-3 sm:py-2";
  const topPillText = "text-[11px] sm:text-xs";

  return (
    <div
      className={`${mainBgClass} ${textClass} transition-colors duration-300 min-h-full flex`}
    >
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col">
          {/* Top bar */}
          <header
            className="ind-plate sticky top-14 z-30 flex min-h-14 lg:top-0 items-center justify-between rounded-none border-x-0 border-t-0 px-3 py-2 sm:px-4"
          >
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              <button
                onClick={openSidebar}
                className="ind-icon-btn md:hidden"
                aria-label="Menü öffnen"
              >
                <FiMenu className="h-4 w-4" />
              </button>

              <div className="mr-2 shrink-0">
                <h1 className="ind-title">Übersicht</h1>
                <p className="text-[11.5px] text-muted">
                  {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
              </div>

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
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${
                        darkMode ? "bg-amber-800/50" : "bg-amber-100"
                      }`}
                    >
                      <FiDroplet
                        className={`h-3.5 w-3.5 ${darkMode ? "text-amber-300" : "text-amber-500"}`}
                      />
                    </span>

                    <span className="whitespace-nowrap">
                      <span className="sm:hidden inline-flex items-center gap-1.5">
                        <span>{fuelAlertScheins.length}</span>
                        <FaCarSide className="h-4 w-4" />
                        <span>leerem Tank</span>
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
                      <span className="sm:hidden inline-flex items-center gap-1.5">
                        <span>{tuevScheins.length}</span>
                        <FaCarSide className="h-4 w-4" />
                        <span>in TÜV</span>
                      </span>

                      <span className="hidden sm:inline">
                        {tuevScheins.length}{" "}
                        {tuevScheins.length === 1 ? "Fahrzeug" : "Fahrzeuge"} in
                        TÜV
                      </span>
                    </span>
                  </button>
                )}

                {/* Werkstatt button */}
                {werkstattScheins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowWerkstattModal(true)}
                    className={`${topPillBase} ${topPillPad} ${topPillText} ${
                      darkMode
                        ? "bg-green-900/30 text-green-200 hover:bg-green-800/40 border border-green-800/30"
                        : "bg-green-50 text-green-800 hover:bg-green-100 border border-green-200"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${
                        darkMode ? "bg-green-800/50" : "bg-green-100"
                      }`}
                    >
                      <FiTool
                        className={`h-3.5 w-3.5 ${darkMode ? "text-green-300" : "text-green-500"}`}
                      />
                    </span>

                    <span className="whitespace-nowrap">
                      <span className="sm:hidden inline-flex items-center gap-1.5">
                        <span>{werkstattScheins.length}</span>
                        <FaCarSide className="h-4 w-4" />
                        <span>in Werkstatt</span>
                      </span>

                      <span className="hidden sm:inline">
                        {werkstattScheins.length}{" "}
                        {werkstattScheins.length === 1
                          ? "Fahrzeug"
                          : "Fahrzeuge"}{" "}
                        in Werkstatt
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* ✅ OPTION A: main area + right sticky notes (desktop only) */}
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] gap-4 sm:gap-6 items-start">
              {/* Left content */}
              <main className="space-y-4 sm:space-y-6">
                {/* Sold cards */}
                {soldOnlyScheins.length > 0 ? (
                  <section>
                    <h2 className="mb-2 text-[13px] font-semibold text-ink">Verkauft – wartet auf Abholung</h2>
                    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {soldOnlyScheins.map((schein) => {
                        const open = getActiveTasksCount(schein);
                        const ready = open === 0;
                        const buyer = schein.soldContactId || {};
                        const address = [buyer.street, [buyer.postalCode, buyer.city].filter(Boolean).join(" ")]
                          .filter(Boolean)
                          .join(", ");
                        const busy = handingOver === schein._id;
                        return (
                          <article key={schein._id} className="card flex h-full flex-col overflow-hidden">
                            <div className="flex-1 space-y-2 px-3.5 pb-3 pt-3">
                              <div className="flex items-start justify-between gap-2">
                                <Link href={`/Fahrzeugverwaltung?id=${schein._id}`} className="min-w-0">
                                  <h3 className="truncate text-[13.5px] font-semibold text-ink hover:text-brand-700">
                                    {schein.carName || "Unbekannt"}
                                  </h3>
                                  <p className="text-[11.5px] text-muted">verkauft {formatSoldDate(schein)}</p>
                                </Link>
                                <span
                                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold ring-1 ring-inset ${
                                    schein.keyNumber ? STEEL_BADGE : "bg-canvas text-muted ring-line"
                                  }`}
                                  title="Schlüsselnummer"
                                >
                                  <KeyRound className="h-3.5 w-3.5" /> {schein.keyNumber || "–"}
                                </span>
                              </div>
                              <p className="truncate font-mono text-[11.5px] text-muted">{schein.finNumber || "ohne FIN"}</p>
                              <div className="space-y-1 text-[12.5px]">
                                {buyer.customerName ? <p className="truncate font-medium text-ink">{buyer.customerName}</p> : null}
                                {buyer.phone ? (
                                  <a href={telHref(buyer.phone)} className="flex items-center gap-1.5 text-brand-700 hover:underline">
                                    <Phone className="h-3.5 w-3.5" /> {buyer.phone}
                                  </a>
                                ) : null}
                                {address ? (
                                  <a href={mapsHref([address])} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 text-body hover:text-brand-700">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" /> <span className="line-clamp-2">{address}</span>
                                  </a>
                                ) : null}
                              </div>
                            </div>
                            <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line bg-canvas/40 px-3 py-2">
                              <span
                                className={`mr-auto inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  ready ? "bg-emerald-100 text-emerald-900" : STEEL_BADGE
                                }`}
                              >
                                {ready ? <CheckCircle2 className="h-3 w-3" /> : <ListTodo className="h-3 w-3" />}
                                {ready ? "Bereit zur Abholung" : `${open} offene`}
                              </span>
                              <span className="ml-auto flex gap-1.5">
                                <button type="button" onClick={() => openTasksModal(schein)} className="btn btn-secondary btn-sm">
                                  Aufgaben
                                </button>
                                <button type="button" onClick={() => handOver(schein)} disabled={busy} className="btn btn-primary btn-sm">
                                  {busy ? <Loader2 className="animate-spin" /> : <Truck />} Übergeben
                                </button>
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
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
                      className={`text-sm font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}
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
                          className={`text-sm sm:text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                        >
                          Bevorstehende Kundentermine
                        </h2>
                        <p
                          className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
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
                                    className={`text-xs sm:text-sm font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}
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

              {/* Right sticky notes (desktop only) */}
              {/* Notes (mobile/tablet) */}
              <div className="lg:hidden mt-4">
                <DashboardNotesPanel
                  darkMode={darkMode}
                  createdBy={user?.name || user?.email || ""}
                />
              </div>

              {/* Notes (desktop sticky) */}
              <aside className="hidden lg:block">
                <div className="sticky top-[84px]">
                  <DashboardNotesPanel
                    darkMode={darkMode}
                    createdBy={user?.name || user?.email || ""}
                  />
                </div>
              </aside>
            </div>
            <WeeklyTimeSchedule
              darkMode={darkMode}
              createdBy={user?.name || user?.email || ""}
            />{" "}
          </div>
        </div>
      </div>

      {/* Tasks Modal */}
      {(() => {
        const schein = (visibleScheins || []).find((x) => x._id === selectedScheinTasks);
        const notes = Array.isArray(schein?.notes) ? schein.notes : [];
        const done = new Set(schein?.completedTasks || []);
        return (
          <Modal
            open={showTasksModal && Boolean(schein)}
            onClose={closeTasksModal}
            title={
              <span className="block min-w-0">
                <span className="block leading-tight">Aufgaben zur Übergabe</span>
                {schein ? (
                  <span className="mt-0.5 block break-words text-[12px] font-normal leading-snug text-muted">
                    {schein.carName || "Unbekanntes Fahrzeug"}
                  </span>
                ) : null}
              </span>
            }
          >
            {notes.length ? (
              <div className="space-y-3">
                {taskError ? <ErrorNote>{taskError}</ErrorNote> : null}
                <ul className="space-y-2">
                  {notes.map((title, index) => (
                    <li key={`${index}:${title}`}>
                      <TaskCard
                        title={title}
                        done={done.has(title)}
                        busy={savingTask === title}
                        disabled={Boolean(savingTask)}
                        onToggle={() => toggleTask(schein, title)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-canvas/40 px-3 py-4 text-center">
                <ListTodo aria-hidden="true" className="h-5 w-5 text-muted" />
                <p className="text-[13px] text-muted">Keine Aufgaben für dieses Fahrzeug.</p>
              </div>
            )}
          </Modal>
        );
      })()}

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
              <div
                className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TuvLogo />
                    <div>
                      <h3
                        className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        TÜV-Prüfungen
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTuevModal(false)}
                    className={`p-1.5 rounded ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

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
                          className={`border-b ${darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-100 hover:bg-gray-50"}`}
                        >
                          <td className="py-3 pl-4 sm:pl-6">
                            <div className="font-medium text-sm">
                              {car.carName || "Unbekannt"}
                            </div>
                          </td>

                          <td className="hidden sm:table-cell py-3">
                            <div
                              className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              {car.finNumber || "–"}
                            </div>
                          </td>

                          <td className="py-3">
                            <div
                              className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
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

              <div
                className={`px-6 py-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
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
                      className={`text-xs px-3 py-2 rounded ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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

      {/* Professional Werkstatt Modal */}
      {showWerkstattModal && werkstattScheins.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWerkstattModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`w-full max-w-5xl rounded-lg shadow-xl ${
                darkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`px-6 py-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${
                        darkMode ? "bg-green-900/30" : "bg-green-100"
                      }`}
                    >
                      <FiTool
                        className={`h-5 w-5 ${
                          darkMode ? "text-green-300" : "text-green-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-base font-semibold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Werkstattfahrzeuge
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowWerkstattModal(false)}
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

              <div className="max-h-[60vh] overflow-y-auto custom-scroll">
                <table className="w-full table-fixed">
                  <thead>
                    <tr
                      className={`text-left text-xs font-medium border-b ${
                        darkMode
                          ? "border-gray-700 text-gray-400"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <th className="py-3 pl-4 sm:pl-6">Fahrzeug</th>

                      {/* like TÜV: hide on mobile + spacing */}
                      <th className="hidden sm:table-cell py-3 px-14">FIN</th>

                      <th className="py-3 px-2">Wo</th>

                      <th className="py-3 pl-6 pr-4 sm:pr-6">Was</th>
                    </tr>
                  </thead>

                  <tbody>
                    {werkstattScheins.map((car) => {
                      const werkstattInfo = car?.stageMeta?.werkstatt || {};
                      const where = werkstattInfo.where || "–";
                      const what = werkstattInfo.what || "–";

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
                            <div
                              className="font-medium text-sm truncate"
                              title={car.carName || ""}
                            >
                              {car.carName || "Unbekannt"}
                            </div>
                          </td>

                          <td className="hidden sm:table-cell py-3">
                            <div
                              className={`text-sm truncate ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              title={car.finNumber || ""}
                            >
                              {car.finNumber || "–"}
                            </div>
                          </td>

                          <td className="py-3 px-2">
                            <div
                              className={`text-sm truncate ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              title={where}
                            >
                              {where}
                            </div>
                          </td>

                          <td className="py-3 pl-4 pr-6">
                            <div
                              className={`text-sm leading-5 ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                              title={what}
                            >
                              {what}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
                      onClick={() => setShowWerkstattModal(false)}
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
              <div
                className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${darkMode ? "bg-amber-900/30" : "bg-amber-100"}`}
                    >
                      <FiDroplet
                        className={`h-5 w-5 ${darkMode ? "text-amber-300" : "text-amber-600"}`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-base font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        Tankalarm
                      </h3>
                      <p
                        className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {fuelAlertScheins.length} Fahrzeug
                        {fuelAlertScheins.length !== 1 ? "e" : ""} benötig
                        {fuelAlertScheins.length !== 1 ? "en" : "t"} Auftanken
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFuelModal(false)}
                    className={`p-1.5 rounded ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scroll">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="hidden sm:table-column sm:w-[25%]" />
                    <col className="w-[12%]" />
                    <col className="w-[41%]" />
                  </colgroup>
                  <thead>
                    <tr
                      className={`text-left text-xs font-medium border-b ${
                        darkMode
                          ? "border-gray-700 text-gray-400"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <th className="py-3 pl-4 sm:pl-6">Fahrzeug</th>
                      <th className="hidden sm:table-cell py-3 px-14">FIN</th>
                      <th className="py-3">Besitzer</th>
                      <th className="py-3 pr-4 sm:pr-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelAlertScheins.map((car) => (
                      <tr
                        key={car._id}
                        className={`border-b ${darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-100 hover:bg-gray-50"}`}
                      >
                        <td className="py-3 pl-4 sm:pl-6">
                          <div className="font-medium text-sm">
                            {car.carName || "Unbekannt"}
                          </div>
                        </td>

                        <td className="hidden sm:table-cell py-3">
                          <div
                            className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {car.finNumber || "–"}
                          </div>
                        </td>

                        <td className="py-3">
                          <div
                            className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
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

              <div
                className={`px-6 py-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
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
                      className={`text-xs px-3 py-2 rounded ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
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
