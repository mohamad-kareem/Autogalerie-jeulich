"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSunday,
  isSaturday,
  startOfDay,
  endOfDay,
} from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiUser,
  FiFilter,
  FiTrash2,
  FiClock,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiPlusCircle,
  FiEdit,
  FiCalendar,
  FiPrinter,
  FiRefreshCw,
  FiTag,
  FiSave,
  FiX,
  FiAlertTriangle,
  FiInbox,
  FiCheckCircle,
  FiBell,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { IoMdLocate } from "react-icons/io";

import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PER_PAGE = 10;

export default function Zeiterfassungsverwaltung() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

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

  // ------------ State ------------
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState("alle");
  const [dateFilter, setDateFilter] = useState(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }));

  const [deleteRange, setDeleteRange] = useState({ start: null, end: null });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    employee: "alle",
    startDate: null,
    endDate: null,
    showSummary: true,
  });

  const [manualEntry, setManualEntry] = useState({
    admin: "",
    type: "in",
    time: null,
    method: "manual",
  });

  // Justifications (reasons) for missing punches
  const [justifications, setJustifications] = useState([]);
  const [justifyModalOpen, setJustifyModalOpen] = useState(false);
  const [justifyForm, setJustifyForm] = useState({
    name: "",
    date: null,
    reason: "",
  });
  const [justificationsLoaded, setJustificationsLoaded] = useState(false);

  // ------------ Effects ------------
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setPage(1);
  }, [selectedAdmin, dateFilter.start, dateFilter.end]);

  // ------------ Fetchers ------------
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/punch");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
      hasFetched.current = true;
    } catch {
      toast.error("Daten konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchJustifications = useCallback(async () => {
    try {
      const from = startOfMonth(new Date()).toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const to = today.toISOString();
      const qs = new URLSearchParams({ from, to }).toString();
      const res = await fetch(`/api/punch/missing/justification?${qs}`);
      const data = await res.json();
      setJustifications(Array.isArray(data) ? data : []);
    } catch {
      // Non-blocking; optional toast
    } finally {
      setJustificationsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      (async () => {
        await fetchRecords();
        await fetchJustifications();
        setInitialLoading(false);
      })();
    }
  }, [status, fetchRecords, fetchJustifications]);

  // ------------ Derived Data ------------
  const allAdmins = useMemo(() => {
    const names = new Set(records.map((r) => r.admin?.name).filter(Boolean));
    return Array.from(names).sort();
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchAdmin =
        selectedAdmin === "alle" || r.admin?.name === selectedAdmin;
      const recordDate = new Date(r.time);
      const matchDate =
        (!dateFilter.start || recordDate >= startOfDay(dateFilter.start)) &&
        (!dateFilter.end || recordDate <= endOfDay(dateFilter.end));
      return matchAdmin && matchDate;
    });
  }, [records, selectedAdmin, dateFilter]);

  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }, [filtered, page]);

  const summary = useMemo(() => {
    const byAdmin = {};
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );
    for (const r of sorted) {
      const name = r.admin?.name || "Unbekannt";
      if (!byAdmin[name]) {
        byAdmin[name] = { lastIn: null, totalMs: 0, workedDates: new Set() };
      }
      if (r.type === "in" && !byAdmin[name].lastIn) {
        byAdmin[name].lastIn = new Date(r.time);
      } else if (r.type === "out" && byAdmin[name].lastIn) {
        const inTime = byAdmin[name].lastIn;
        const outTime = new Date(r.time);
        const diff = outTime - inTime;
        if (diff > 0) {
          byAdmin[name].totalMs += diff;
          byAdmin[name].workedDates.add(inTime.toISOString().slice(0, 10));
        }
        byAdmin[name].lastIn = null;
      }
    }

    return Object.entries(byAdmin).map(([name, data]) => {
      const hours = Math.floor(data.totalMs / 3_600_000);
      const minutes = Math.floor((data.totalMs % 3_600_000) / 60_000);
      const seconds = Math.floor((data.totalMs % 60_000) / 1_000);
      return {
        name,
        timeFormatted: `${hours}h ${minutes}m ${seconds}s`,
        daysWorked: data.workedDates.size,
      };
    });
  }, [filtered]);

  // Build missing punches (Fehlstempel) for current month up to today
  const missingPunches = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Exclude today → only check up to yesterday
    const monthEnd = new Date(today);
    monthEnd.setDate(monthEnd.getDate() - 1);

    const byAdminDate = new Map();
    for (const r of records) {
      const name = r.admin?.name || "Unbekannt";
      if (selectedAdmin !== "alle" && name !== selectedAdmin) continue;

      const dayKey = format(new Date(r.time), "yyyy-MM-dd");
      if (!byAdminDate.has(name)) byAdminDate.set(name, new Map());
      const dayMap = byAdminDate.get(name);
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, { ins: 0, outs: 0 });
      const entry = dayMap.get(dayKey);
      if (r.type === "in") entry.ins += 1;
      if (r.type === "out") entry.outs += 1;
    }

    const justificationMap = new Map(
      justifications.map((j) => {
        const key = `${j.admin?.name || ""}|${format(
          new Date(j.date),
          "yyyy-MM-dd"
        )}`;
        return [key, j];
      })
    );

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
      (d) => !isSunday(d)
    );

    const saturdayOff = new Set(["abed"]);

    const adminsToCheck =
      selectedAdmin === "alle"
        ? allAdmins
        : allAdmins.filter((n) => n === selectedAdmin);

    const results = [];
    for (const name of adminsToCheck) {
      const nameLc = (name || "").toLowerCase();
      const dayMap = byAdminDate.get(name) || new Map();

      for (const d of days) {
        if (saturdayOff.has(nameLc) && isSaturday(d)) continue;

        const keyDate = format(d, "yyyy-MM-dd");
        const entry = dayMap.get(keyDate);
        let issue = null;

        if (!entry) {
          issue = "Keine Stempelung (weder EIN noch AUS)";
        } else if (entry.ins === 0 && entry.outs === 0) {
          issue = "Keine Stempelung (weder EIN noch AUS)";
        } else if (entry.ins === 0) {
          issue = "EIN fehlt";
        } else if (entry.outs === 0) {
          issue = "AUS fehlt";
        } else if (entry.ins !== entry.outs) {
          issue = "Unpaarige Stempelungen (Anzahl EIN ≠ AUS)";
        }

        if (issue) {
          const j = justificationMap.get(`${name}|${keyDate}`);
          if (j?.ignored) continue;
          results.push({
            name,
            date: keyDate,
            issue: j?.reason || issue,
            justified: Boolean(j),
          });
        }
      }
    }

    return results.sort(
      (a, b) => a.name.localeCompare(b.name) || a.date.localeCompare(b.date)
    );
  }, [records, allAdmins, selectedAdmin, justifications]);

  const unresolvedMissingCount = useMemo(
    () =>
      missingPunches.filter((m) => !(m.justified && m.issue?.trim())).length,
    [missingPunches]
  );

  // ------------ Actions ------------
  const handleDeleteRange = async () => {
    if (!deleteRange.start || !deleteRange.end) {
      return toast.error("Bitte wählen Sie einen Datumsbereich aus");
    }
    if (
      !window.confirm(
        "Sind Sie sicher, dass Sie diese Datensätze löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    )
      return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/punch/delete-range", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({
          start: startOfDay(deleteRange.start),
          end: endOfDay(deleteRange.end),
          adminId: selectedAdmin !== "alle" ? session.user.id : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Erfolgreich ${data.deletedCount} Datensatz/Datensätze gelöscht`
        );
        setDeleteRange({ start: null, end: null });
        hasFetched.current = false;
        await fetchRecords();
        await fetchJustifications();
      } else {
        throw new Error(data.message || "Löschen fehlgeschlagen");
      }
    } catch {
      toast.error("Löschen fehlgeschlagen - bitte versuchen Sie es erneut");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualEntry.admin || !manualEntry.time || !manualEntry.type) {
      return toast.error("Bitte alle Felder ausfüllen");
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/punch/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
          "x-admin-name": session.user.name,
        },
        body: JSON.stringify(manualEntry),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Eintrag gespeichert");
        setActiveSection(null);
        setManualEntry({ admin: "", type: "in", time: null, method: "manual" });
        await fetchRecords();
        await fetchJustifications();
      } else {
        throw new Error(data.error || "Fehler beim Speichern");
      }
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printConfig.startDate || !printConfig.endDate) {
      toast.error("Bitte wählen Sie einen Datumsbereich aus");
      return;
    }

    setIsPrinting(true);

    const printRecords = records.filter((r) => {
      const matchEmployee =
        printConfig.employee === "alle" ||
        r.admin?.name === printConfig.employee;
      const recordDate = new Date(r.time);
      const matchDate =
        recordDate >= startOfDay(printConfig.startDate) &&
        recordDate <= endOfDay(printConfig.endDate);
      return matchEmployee && matchDate;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zeiterfassungsbericht</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .summary { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .even { background-color: #f9f9f9; }
          .type-in { color: #10b981; font-weight: bold; }
          .type-out { color: #ef4444; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <h1>Zeiterfassungsbericht</h1>
        <div class="header">
          <div><strong>Mitarbeiter:</strong> ${
            printConfig.employee === "alle"
              ? "Alle Mitarbeiter"
              : printConfig.employee
          }</div>
          <div><strong>Zeitraum:</strong> ${format(
            printConfig.startDate,
            "dd.MM.yyyy"
          )} - ${format(printConfig.endDate, "dd.MM.yyyy")}</div>
        </div>

        ${
          printConfig.showSummary
            ? `
          <div class="summary">
            ${summary
              .filter(
                (s) =>
                  printConfig.employee === "alle" ||
                  s.name === printConfig.employee
              )
              .map(
                (s) => `
                <div>
                  <strong>Zusammenfassung:</strong> ${s.timeFormatted} an ${s.daysWorked} Tagen
                </div>`
              )
              .join("")}
          </div>`
            : ""
        }

        <table>
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              <th>Datum & Uhrzeit</th>
              <th>Aktion</th>
              <th>Verifizierung</th>
            </tr>
          </thead>
          <tbody>
            ${printRecords
              .sort((a, b) => new Date(a.time) - new Date(b.time))
              .map(
                (r, i) => `
                <tr class="${i % 2 === 0 ? "even" : ""}">
                  <td>${r.admin?.name || "Unbekannt"}</td>
                  <td>${format(new Date(r.time), "dd.MM.yyyy HH:mm")}</td>
                  <td class="${r.type === "in" ? "type-in" : "type-out"}">
                    ${r.type === "in" ? "EIN" : "AUS"}
                  </td>
                  <td>
                    ${
                      r.method === "qr"
                        ? "gescannt"
                        : r.method === "added"
                        ? "Hinzugefügt"
                        : r.method === "edited"
                        ? "Bearbeitet"
                        : "Manuell"
                    }
                    ${
                      (r.method === "edited" && r.editedBy) ||
                      (r.method === "added" && r.addedBy)
                        ? `<br><small>von ${r.editedBy || r.addedBy}</small>`
                        : ""
                    }
                  </td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blockiert. Bitte Popups erlauben.");
      setIsPrinting(false);
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };
  };

  // ------------ Rendering ------------
  // While NextAuth is still checking the session → show loader
  if (status === "loading") {
    return (
      <div
        className={`flex justify-center items-center h-screen transition-colors duration-300 ${
          darkMode ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            darkMode ? "border-slate-400" : "border-slate-600"
          }`}
        ></div>
      </div>
    );
  }

  // If not logged in → do nothing, redirect effect will push to /login
  if (status === "unauthenticated") {
    return null;
  }

  if (initialLoading) {
    return (
      <div
        className={`flex justify-center items-center h-screen transition-colors duration-300 ${
          darkMode ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            darkMode ? "border-slate-400" : "border-slate-600"
          }`}
        ></div>
      </div>
    );
  }

  // Theme classes
  const bgGradient = darkMode
    ? "bg-gradient-to-br from-slate-900 to-slate-800"
    : "bg-gradient-to-br from-slate-50 to-slate-100";

  const cardBg = darkMode
    ? "bg-slate-800/60 backdrop-blur-md border border-slate-700"
    : "bg-white/80 backdrop-blur-md border border-slate-200";

  const headerBg = darkMode
    ? "bg-slate-800/40 border-slate-700"
    : "bg-white/90 border-slate-200";

  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  const buttonPrimary = darkMode
    ? "bg-slate-700 hover:bg-slate-600 text-white"
    : "bg-slate-600 hover:bg-slate-700 text-white";

  const buttonDanger = darkMode
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";

  const buttonSecondary = darkMode
    ? "bg-slate-700 hover:bg-slate-600 text-white"
    : "bg-slate-200 hover:bg-slate-300 text-slate-700";

  const inputBg = darkMode
    ? "bg-slate-800 border-slate-700 text-white"
    : "bg-white border-slate-300 text-slate-900";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgGradient} ${textPrimary}`}
    >
      {/* Header */}
      <div className="z-40 px-4 sm:px-6 py-2">
        <div className="flex ">
          <div className="flex items-center gap-3 mr-3">
            <button
              onClick={() => router.push("/AdminDashboard")}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? "bg-slate-800 hover:bg-slate-700"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              <FiArrowLeft
                className={`h-4 w-4 ${
                  darkMode ? "text-white" : "text-slate-700"
                }`}
              />
            </button>
            <h1 className="text-lg sm:text-xl font-bold">
              Zeiterfassungsübersicht
            </h1>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "bg-slate-800 hover:bg-slate-700"
                : "bg-slate-200 hover:bg-slate-300"
            }`}
            title={
              darkMode ? "Zu Hellmodus wechseln" : "Zu Dunkelmodus wechseln"
            }
          >
            {darkMode ? (
              <FiSun className="h-4 w-4 text-yellow-400" />
            ) : (
              <FiMoon className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1600px] mx-auto px-1 sm:px-0 py-2">
        {/* Control Panel */}
        <div
          className={`${cardBg} rounded-xl overflow-hidden mb-4 transition-colors duration-300`}
        >
          {/* Top Navigation */}
          <div
            className={`border-b transition-colors duration-300 ${
              darkMode ? "border-slate-700" : "border-slate-200"
            }`}
          >
            {/* Desktop/Tablet → Horizontal Buttons */}
            <div className="hidden sm:flex flex-wrap">
              {[
                {
                  key: "filter",
                  icon: <FiFilter className="h-4 w-4" />,
                  label: "Filter",
                },
                {
                  key: "delete",
                  icon: <FiTrash2 className="h-4 w-4" />,
                  label: "Löschen",
                },
                {
                  key: "summary",
                  icon: <FiClock className="h-4 w-4" />,
                  label: "Übersicht",
                },
                {
                  key: "manual",
                  icon: <FiPlusCircle className="h-4 w-4" />,
                  label: "Manuell",
                },
                {
                  key: "print",
                  icon: <FiPrinter className="h-4 w-4" />,
                  label: "Drucken",
                },
                {
                  key: "alerts",
                  icon: <FiAlertTriangle className="h-4 w-4" />,
                  label: "Fehlstempel",
                },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() =>
                    setActiveSection(activeSection === key ? null : key)
                  }
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all
            ${
              activeSection === key
                ? `${
                    darkMode
                      ? "bg-slate-700 text-white border-b-2 border-slate-400"
                      : "bg-slate-200 text-slate-800 border-b-2 border-slate-600"
                  }`
                : `${
                    darkMode
                      ? "text-slate-400 hover:text-white hover:bg-slate-700/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
            }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile → Dropdown Menu */}
            <div className="sm:hidden p-3">
              <label
                className={`text-xs mb-2 block transition-colors duration-300 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Aktion wählen
              </label>
              <select
                value={activeSection || ""}
                onChange={(e) => setActiveSection(e.target.value || null)}
                className={`w-full px-3 py-2 rounded-md border text-sm focus:outline-none transition-colors duration-300 ${
                  darkMode
                    ? "bg-slate-800 border-slate-700 text-white focus:border-slate-400"
                    : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                }`}
              >
                <option value="">— Bitte wählen —</option>
                <option value="filter">🔍 Filter</option>
                <option value="delete">🗑️ Löschen</option>
                <option value="summary">⏱ Übersicht</option>
                <option value="manual">➕ Manuell</option>
                <option value="print">🖨 Drucken</option>
                <option value="alerts">⚠️ Fehlstempel</option>
              </select>
            </div>
          </div>

          {/* Filter Section */}
          {activeSection === "filter" && (
            <div
              className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Mitarbeiter
                  </label>
                  <select
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="alle">Alle Mitarbeiter</option>
                    {allAdmins.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Datumsbereich
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <DatePicker
                      selected={dateFilter.start}
                      onChange={(d) =>
                        setDateFilter((f) => ({ ...f, start: d }))
                      }
                      selectsStart
                      startDate={dateFilter.start}
                      endDate={dateFilter.end}
                      placeholderText="Startdatum"
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      dateFormat="dd.MM.yyyy"
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                    />
                    <DatePicker
                      selected={dateFilter.end}
                      onChange={(d) => setDateFilter((f) => ({ ...f, end: d }))}
                      selectsEnd
                      startDate={dateFilter.start}
                      endDate={dateFilter.end}
                      minDate={dateFilter.start}
                      placeholderText="Enddatum"
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      dateFormat="dd.MM.yyyy"
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateFilter({
                        start: startOfMonth(new Date()),
                        end: endOfMonth(new Date()),
                      });
                      setSelectedAdmin("alle");
                    }}
                    className={`w-full px-4 py-2 rounded-md transition text-sm ${buttonSecondary}`}
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Section */}
          {activeSection === "delete" && (
            <div
              className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:grid sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label
                      className={`text-sm mb-2 block transition-colors duration-300 ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Von
                    </label>
                    <DatePicker
                      selected={deleteRange.start}
                      onChange={(d) =>
                        setDeleteRange((r) => ({ ...r, start: d }))
                      }
                      selectsStart
                      startDate={deleteRange.start}
                      endDate={deleteRange.end}
                      placeholderText="Startdatum"
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      dateFormat="dd.MM.yyyy"
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                    />
                  </div>
                  <div>
                    <label
                      className={`text-sm mb-2 block transition-colors duration-300 ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Bis
                    </label>
                    <DatePicker
                      selected={deleteRange.end}
                      onChange={(d) =>
                        setDeleteRange((r) => ({ ...r, end: d }))
                      }
                      selectsEnd
                      startDate={deleteRange.start}
                      endDate={deleteRange.end}
                      minDate={deleteRange.start}
                      placeholderText="Enddatum"
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      dateFormat="dd.MM.yyyy"
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDeleteRange}
                    disabled={
                      isLoading || !deleteRange.start || !deleteRange.end
                    }
                    className={`w-full px-4 py-2 rounded-md transition text-sm ${
                      isLoading || !deleteRange.start || !deleteRange.end
                        ? `${
                            darkMode
                              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                              : "bg-slate-300 text-slate-400 cursor-not-allowed"
                          }`
                        : buttonDanger
                    }`}
                  >
                    {isLoading ? "Löschen..." : "Löschen"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          {activeSection === "summary" && (
            <div
              className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-4 border transition-colors duration-300 ${
                      darkMode
                        ? "bg-slate-800/40 border-slate-700"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div
                      className={`font-semibold mb-3 transition-colors duration-300 ${
                        darkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {s.name}
                    </div>
                    <div className="space-y-2 text-sm sm:text-base">
                      <div className="flex justify-between">
                        <span className="text-green-500">Gesamtzeit:</span>
                        <span className="text-green-500">
                          {s.timeFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-500">Arbeitstage:</span>
                        <span className="text-amber-500">
                          {s.daysWorked} {s.daysWorked === 1 ? "Tag" : "Tage"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Entry Section */}
          {activeSection === "manual" && (
            <div
              className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Mitarbeiter
                  </label>
                  <select
                    value={manualEntry.admin}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        admin: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="">Bitte wählen</option>
                    {allAdmins.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Typ
                  </label>
                  <select
                    value={manualEntry.type}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="in">EIN</option>
                    <option value="out">AUS</option>
                  </select>
                </div>
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Datum & Uhrzeit
                  </label>
                  <DatePicker
                    selected={manualEntry.time}
                    onChange={(d) =>
                      setManualEntry((prev) => ({ ...prev, time: d }))
                    }
                    showTimeSelect
                    timeFormat="HH:mm"
                    popperClassName="z-50"
                    popperPlacement="bottom-start"
                    portalId="root-portal"
                    timeIntervals={5}
                    dateFormat="dd.MM.yyyy HH:mm"
                    placeholderText="Datum und Uhrzeit"
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => setActiveSection(null)}
                  className={`px-4 py-2 rounded-md transition text-sm ${buttonSecondary}`}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={
                    isLoading || !manualEntry.admin || !manualEntry.time
                  }
                  className={`px-4 py-2 rounded-md transition text-sm ${
                    isLoading || !manualEntry.admin || !manualEntry.time
                      ? `${
                          darkMode
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "bg-slate-300 text-slate-400 cursor-not-allowed"
                        }`
                      : buttonPrimary
                  }`}
                >
                  {isLoading ? "Speichern..." : "Speichern"}
                </button>
              </div>
            </div>
          )}

          {/* Print Section */}
          {activeSection === "print" && (
            <div
              className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Mitarbeiter
                  </label>
                  <select
                    value={printConfig.employee}
                    onChange={(e) =>
                      setPrintConfig((p) => ({
                        ...p,
                        employee: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                      darkMode
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="alle">Alle Mitarbeiter</option>
                    {allAdmins.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`text-sm mb-2 block transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Datumsbereich
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <DatePicker
                      selected={printConfig.startDate}
                      onChange={(d) =>
                        setPrintConfig((p) => ({ ...p, startDate: d }))
                      }
                      selectsStart
                      startDate={printConfig.startDate}
                      endDate={printConfig.endDate}
                      placeholderText="Startdatum"
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      dateFormat="dd.MM.yyyy"
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                    />
                    <DatePicker
                      selected={printConfig.endDate}
                      onChange={(d) =>
                        setPrintConfig((p) => ({ ...p, endDate: d }))
                      }
                      selectsEnd
                      startDate={printConfig.startDate}
                      endDate={printConfig.endDate}
                      minDate={printConfig.startDate}
                      placeholderText="Enddatum"
                      className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        darkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-slate-300 text-slate-900"
                      }`}
                      dateFormat="dd.MM.yyyy"
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showSummary"
                    checked={printConfig.showSummary}
                    onChange={(e) =>
                      setPrintConfig((p) => ({
                        ...p,
                        showSummary: e.target.checked,
                      }))
                    }
                    className={`h-4 w-4 focus:ring-slate-500 border rounded transition-colors duration-300 ${
                      darkMode
                        ? "text-slate-400 border-slate-600 bg-slate-800"
                        : "text-slate-600 border-slate-400 bg-white"
                    }`}
                  />
                  <label
                    htmlFor="showSummary"
                    className={`ml-2 text-sm transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Zusammenfassung einschließen
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={() => setActiveSection(null)}
                  className={`px-4 py-2 rounded-md transition text-sm ${buttonSecondary}`}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handlePrint}
                  disabled={
                    isPrinting || !printConfig.startDate || !printConfig.endDate
                  }
                  className={`px-4 py-2 rounded-md transition text-sm ${
                    isPrinting || !printConfig.startDate || !printConfig.endDate
                      ? `${
                          darkMode
                            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                            : "bg-slate-300 text-slate-400 cursor-not-allowed"
                        }`
                      : buttonPrimary
                  }`}
                >
                  {isPrinting ? "Drucken..." : "Drucken"}
                </button>
              </div>
            </div>
          )}

          {/* Alerts Section */}
          {activeSection === "alerts" && (
            <div className="p-4 sm:p-6">
              {unresolvedMissingCount === 0 ? (
                <div className="text-green-500 text-sm">
                  ✅ Alles gut! Keine fehlenden Stempelungen im gewählten
                  Zeitraum.
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`text-sm p-3 rounded border transition-colors duration-300 ${
                      darkMode
                        ? "text-amber-400 bg-amber-400/10 border-amber-500/30"
                        : "text-amber-600 bg-amber-50 border-amber-200"
                    }`}
                  >
                    <strong>Hinweis:</strong> Sonntag ist ausgenommen; Und{" "}
                    <strong>Abed</strong> ist auch <strong>Samstag</strong>{" "}
                    ausgenommen.
                  </div>
                  <div className="space-y-2">
                    {missingPunches.map((m, i) => {
                      const dateObj = new Date(m.date);
                      const hasReason = m.justified && m.issue?.trim();
                      return (
                        <div
                          key={`${m.name}-${m.date}-${i}`}
                          className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 rounded border text-sm transition-colors duration-300 ${
                            darkMode
                              ? "bg-slate-800/30 border-slate-700"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`font-semibold transition-colors duration-300 ${
                                darkMode ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {m.name}
                            </span>
                            <span className={textMuted}>
                              {format(dateObj, "dd.MM.yyyy")}
                            </span>
                            <span
                              className={`flex items-center gap-1 ${
                                hasReason ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {hasReason ? (
                                <FiCheckCircle />
                              ) : (
                                <FiAlertTriangle />
                              )}
                              {m.issue}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setJustifyForm({
                                  name: m.name,
                                  date: new Date(m.date),
                                  reason: "",
                                });
                                setJustifyModalOpen(true);
                              }}
                              className={`px-2 py-1 text-xs rounded transition ${buttonSecondary}`}
                            >
                              Grund
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    "Diesen Fehlstempel wirklich löschen?"
                                  )
                                )
                                  return;
                                try {
                                  setIsLoading(true);
                                  const res = await fetch(
                                    "/api/punch/missing/justification",
                                    {
                                      method: "DELETE",
                                      headers: {
                                        "Content-Type": "application/json",
                                        "x-admin-id": session.user.id,
                                      },
                                      body: JSON.stringify({
                                        adminName: m.name,
                                        date: m.date,
                                      }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.success) {
                                    toast.success("Fehlstempel gelöscht");
                                    await fetchJustifications();
                                  } else {
                                    throw new Error(
                                      data.error || "Löschen fehlgeschlagen"
                                    );
                                  }
                                } catch {
                                  toast.error("Löschen fehlgeschlagen");
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded transition ${buttonDanger}`}
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div
          className={`${cardBg} rounded-xl overflow-hidden transition-colors duration-300`}
        >
          <div
            className={`px-6 py-2 border-b flex justify-between items-center transition-colors duration-300 ${
              darkMode
                ? "bg-slate-800/40 border-slate-700"
                : "bg-slate-100/40 border-slate-200"
            }`}
          >
            <h2
              className={`text-sm sm:text-lg font-semibold flex items-center gap-2 transition-colors duration-300 ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              <FiClock
                className={darkMode ? "text-slate-400" : "text-slate-600"}
              />{" "}
              Zeiterfassungen
            </h2>
            <div className="flex items-center">
              {/* Notification bell */}
              <button
                onClick={() => setActiveSection("alerts")}
                className={`relative p-2 rounded-full transition-colors duration-300 ${
                  darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"
                }`}
                title="Fehlstempel Hinweise"
              >
                <FiBell
                  className={`h-5 w-5 transition-colors duration-300 ${
                    darkMode
                      ? "text-slate-400 hover:text-amber-400"
                      : "text-slate-500 hover:text-amber-500"
                  }`}
                />
                {unresolvedMissingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unresolvedMissingCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead
                className={`transition-colors duration-300 ${
                  darkMode
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <tr>
                  <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs sm:text-sm">
                    Mitarbeiter
                  </th>
                  <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs sm:text-sm">
                    Datum & Uhrzeit
                  </th>
                  <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs sm:text-sm">
                    stempeln
                  </th>
                  <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs sm:text-sm">
                    Verifizierung
                  </th>
                  <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider text-xs sm:text-sm">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y transition-colors duration-300 ${
                  darkMode ? "divide-slate-700" : "divide-slate-200"
                }`}
              >
                {paginated.length > 0 ? (
                  paginated.map((r, i) => (
                    <tr
                      key={`${r._id || i}`}
                      className={`transition-colors duration-300 ${
                        darkMode
                          ? "hover:bg-slate-700/50 cursor-pointer"
                          : "hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <td
                        className={`px-6 py-4 whitespace-nowrap transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {r.admin?.name || "Unbekannt"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        <div className="flex flex-row gap-4">
                          <span>{format(new Date(r.time), "dd.MM.yyyy")}</span>
                          <span
                            className={
                              darkMode ? "text-purple-400" : "text-purple-600"
                            }
                          >
                            {format(new Date(r.time), "HH:mm")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border transition-colors duration-300 ${
                            r.type === "in"
                              ? `${
                                  darkMode
                                    ? "bg-green-900/40 text-green-400 border-green-800"
                                    : "bg-green-100 text-green-700 border-green-200"
                                }`
                              : `${
                                  darkMode
                                    ? "bg-red-900/40 text-red-400 border-red-800"
                                    : "bg-red-100 text-red-700 border-red-200"
                                }`
                          }`}
                        >
                          {r.type === "in" ? "EIN" : "AUS"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        <div>
                          {r.method === "qr"
                            ? "gescannt"
                            : r.method === "added"
                            ? "hinzugefügt"
                            : r.method === "edited"
                            ? "bearbeitet"
                            : "manuell"}
                        </div>
                        {(r.method === "edited" && r.editedBy) ||
                        (r.method === "added" && r.addedBy) ? (
                          <div
                            className={`text-xs font-semibold transition-colors duration-300 ${
                              darkMode ? "text-amber-400" : "text-amber-600"
                            }`}
                          >
                            von {r.editedBy || r.addedBy}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3">
                          {/* Edit Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRecord(r);
                              setEditModalOpen(true);
                            }}
                            className={`p-2 rounded-full transition-colors duration-300 ${
                              darkMode
                                ? "hover:bg-slate-700 text-slate-400 hover:text-green-400"
                                : "hover:bg-slate-200 text-slate-500 hover:text-green-600"
                            }`}
                            title="Bearbeiten"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>

                          {/* Delete Icon */}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (
                                !window.confirm(
                                  "Diesen Eintrag wirklich löschen?"
                                )
                              )
                                return;
                              try {
                                setIsLoading(true);
                                const res = await fetch(`/api/punch/${r._id}`, {
                                  method: "DELETE",
                                  headers: {
                                    "x-admin-id": session.user.id,
                                  },
                                });
                                const data = await res.json();
                                if (data.success) {
                                  toast.success("Eintrag gelöscht");
                                  await fetchRecords();
                                  await fetchJustifications();
                                } else {
                                  throw new Error(
                                    data.error || "Löschen fehlgeschlagen"
                                  );
                                }
                              } catch {
                                toast.error("Löschen fehlgeschlagen");
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            className={`p-2 rounded-full transition-colors duration-300 ${
                              darkMode
                                ? "hover:bg-slate-700 text-slate-400 hover:text-red-400"
                                : "hover:bg-slate-200 text-slate-500 hover:text-red-600"
                            }`}
                            title="Löschen"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className={`px-6 py-12 text-center transition-colors duration-300 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Keine Zeiterfassungen gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div
              className={`px-4 py-3 flex items-center justify-between border-t text-sm transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-400"
                  : "bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              <p>
                Zeige{" "}
                <span
                  className={`font-medium transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {(page - 1) * PER_PAGE + 1}
                </span>{" "}
                bis{" "}
                <span
                  className={`font-medium transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {Math.min(page * PER_PAGE, filtered.length)}
                </span>{" "}
                von{" "}
                <span
                  className={`font-medium transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {filtered.length}
                </span>{" "}
                Einträgen
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className={`px-2 py-1 rounded transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white"
                      : "bg-slate-300 hover:bg-slate-400 disabled:opacity-40 text-slate-700"
                  }`}
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`px-2 py-1 rounded transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white"
                      : "bg-slate-300 hover:bg-slate-400 disabled:opacity-40 text-slate-700"
                  }`}
                >
                  ‹
                </button>
                {Array.from(
                  {
                    length: Math.min(5, Math.ceil(filtered.length / PER_PAGE)),
                  },
                  (_, i) => {
                    let pageNum;
                    const totalPages = Math.ceil(filtered.length / PER_PAGE);
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 rounded transition-colors duration-300 ${
                          page === pageNum
                            ? `${
                                darkMode
                                  ? "bg-slate-600 text-white"
                                  : "bg-slate-500 text-white"
                              }`
                            : `${
                                darkMode
                                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                                  : "bg-slate-300 hover:bg-slate-400 text-slate-700"
                              }`
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(p + 1, Math.ceil(filtered.length / PER_PAGE))
                    )
                  }
                  disabled={page >= Math.ceil(filtered.length / PER_PAGE)}
                  className={`px-2 py-1 rounded transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white"
                      : "bg-slate-300 hover:bg-slate-400 disabled:opacity-40 text-slate-700"
                  }`}
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(Math.ceil(filtered.length / PER_PAGE))}
                  disabled={page >= Math.ceil(filtered.length / PER_PAGE)}
                  className={`px-2 py-1 rounded transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white"
                      : "bg-slate-300 hover:bg-slate-400 disabled:opacity-40 text-slate-700"
                  }`}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className={`border rounded-xl shadow-xl w-full max-w-md transition-colors duration-300 ${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex justify-between items-center transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <h3
                className={`text-lg font-bold transition-colors duration-300 ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Eintrag bearbeiten
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className={`transition-colors duration-300 ${
                  darkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Typ
                </label>
                <select
                  value={editingRecord.type}
                  onChange={(e) =>
                    setEditingRecord((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white focus:border-slate-400"
                      : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                  }`}
                >
                  <option value="in">EIN</option>
                  <option value="out">AUS</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Datum & Uhrzeit
                </label>
                <DatePicker
                  selected={new Date(editingRecord.time)}
                  onChange={(d) =>
                    setEditingRecord((prev) => ({ ...prev, time: d }))
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={5}
                  dateFormat="dd.MM.yyyy HH:mm"
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white focus:border-slate-400"
                      : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Methode
                </label>
                <select
                  value={editingRecord.method}
                  onChange={(e) =>
                    setEditingRecord((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white focus:border-slate-400"
                      : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                  }`}
                >
                  <option value="qr">QR</option>
                  <option value="manual">Manuell</option>
                </select>
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end space-x-3 rounded-b-xl transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-800/40 border-slate-700"
                  : "bg-slate-100/40 border-slate-200"
              }`}
            >
              <button
                onClick={() => setEditModalOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${buttonSecondary}`}
              >
                Abbrechen
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const res = await fetch(`/api/punch/${editingRecord._id}`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        "x-admin-id": session.user.id,
                        "x-admin-name": session.user.name,
                      },
                      body: JSON.stringify({
                        type: editingRecord.type,
                        time: editingRecord.time,
                        method: editingRecord.method,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Eintrag aktualisiert");
                      setEditModalOpen(false);
                      await fetchRecords();
                      await fetchJustifications();
                    } else {
                      throw new Error(
                        data.error || "Aktualisierung fehlgeschlagen"
                      );
                    }
                  } catch {
                    toast.error("Aktualisierung fehlgeschlagen");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`px-4 py-2 rounded-md text-white transition-colors duration-300 ${buttonPrimary}`}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Justification Modal */}
      {justifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className={`border rounded-xl shadow-xl w-full max-w-md transition-colors duration-300 ${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex justify-between items-center transition-colors duration-300 ${
                darkMode ? "border-slate-700" : "border-slate-200"
              }`}
            >
              <h3
                className={`text-lg font-bold transition-colors duration-300 ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Grund hinzufügen
              </h3>
              <button
                onClick={() => setJustifyModalOpen(false)}
                className={`transition-colors duration-300 ${
                  darkMode
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-sm mb-1 transition-colors duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Mitarbeiter
                </label>
                <input
                  value={justifyForm.name}
                  disabled
                  className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-400"
                      : "bg-slate-100 border-slate-300 text-slate-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm mb-1 transition-colors duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Datum
                </label>
                <input
                  value={
                    justifyForm.date
                      ? format(justifyForm.date, "dd.MM.yyyy")
                      : ""
                  }
                  disabled
                  className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-slate-400"
                      : "bg-slate-100 border-slate-300 text-slate-500"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm mb-1 transition-colors duration-300 ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Grund
                </label>
                <textarea
                  rows={4}
                  value={justifyForm.reason}
                  onChange={(e) =>
                    setJustifyForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none transition-colors duration-300 ${
                    darkMode
                      ? "bg-slate-800 border-slate-700 text-white focus:border-slate-400"
                      : "bg-white border-slate-300 text-slate-900 focus:border-slate-500"
                  }`}
                  placeholder="z.B. Arzttermin, Außendienst, Urlaub, etc."
                />
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end gap-2 rounded-b-xl transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-800/40 border-slate-700"
                  : "bg-slate-100/40 border-slate-200"
              }`}
            >
              <button
                onClick={() => setJustifyModalOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors duration-300 ${buttonSecondary}`}
              >
                Abbrechen
              </button>
              <button
                onClick={async () => {
                  if (!justifyForm.reason.trim()) {
                    toast.error("Bitte Grund eingeben");
                    return;
                  }
                  try {
                    setIsLoading(true);
                    const res = await fetch(
                      "/api/punch/missing/justification",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-admin-id": session.user.id,
                          "x-admin-name": session.user.name,
                        },
                        body: JSON.stringify({
                          adminName: justifyForm.name,
                          date: justifyForm.date,
                          reason: justifyForm.reason,
                        }),
                      }
                    );
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Grund gespeichert");
                      setJustifyModalOpen(false);
                      setJustifyForm({ name: "", date: null, reason: "" });
                      await fetchJustifications();
                    } else {
                      throw new Error(data.error || "Fehler");
                    }
                  } catch {
                    toast.error("Speichern fehlgeschlagen");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className={`px-4 py-2 rounded-md text-white transition-colors duration-300 ${buttonPrimary}`}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className={`absolute top-0 left-1/3 w-60 h-60 blur-3xl rounded-full transition-colors duration-300 ${
            darkMode ? "bg-slate-700/20" : "bg-slate-300/20"
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/3 w-60 h-60 blur-3xl rounded-full transition-colors duration-300 ${
            darkMode ? "bg-slate-600/20" : "bg-slate-400/20"
          }`}
        />
      </div>
    </div>
  );
}
