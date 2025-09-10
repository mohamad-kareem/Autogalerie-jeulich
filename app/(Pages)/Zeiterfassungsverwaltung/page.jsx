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
} from "react-icons/fi";
import { IoMdLocate } from "react-icons/io";

const PER_PAGE = 10;

export default function Zeiterfassungsverwaltung() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ------------ State ------------
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

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
      // Current month until today
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
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      (async () => {
        await fetchRecords();
        await fetchJustifications();
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
    // month window [startOfMonth..today]
    const monthStart = startOfMonth(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthEnd = today;

    // counts per admin/day
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

    // Pre-index justifications for O(1) lookups: "name|yyyy-MM-dd" -> justification obj
    const justificationMap = new Map(
      justifications.map((j) => {
        const key = `${j.admin?.name || ""}|${format(
          new Date(j.date),
          "yyyy-MM-dd"
        )}`;
        return [key, j];
      })
    );

    // All days in current month (skip Sundays globally)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
      (d) => !isSunday(d)
    );

    // exceptions: "abed" has Saturdays off (case-insensitive)
    const saturdayOff = new Set(["abed"]);

    // Determine admins to check
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
            issue: j?.reason || issue, // show the justification text if exists
            justified: Boolean(j),
          });
        }
      }
    }

    return results.sort(
      (a, b) => a.name.localeCompare(b.name) || a.date.localeCompare(b.date)
    );
  }, [records, allAdmins, selectedAdmin, justifications]);
  // Count only items that are NOT justified
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
                        ? "NFC-Verifiziert"
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
  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Authentifizierung wird geladen
          </h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => router.push("/AdminDashboard")}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Zurück"
            >
              <FiArrowLeft className="text-gray-500" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
              Zeiterfassung
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 sm:mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="grid grid-cols-3 gap-1 sm:flex sm:gap-0 border-b border-gray-100">
            <ControlButton
              active={activeSection === "filter"}
              onClick={() =>
                setActiveSection(activeSection === "filter" ? null : "filter")
              }
              icon={<FiFilter className="text-lg" />}
              label="Filter"
              color="blue"
            />
            <ControlButton
              active={activeSection === "delete"}
              onClick={() =>
                setActiveSection(activeSection === "delete" ? null : "delete")
              }
              icon={<FiTrash2 className="text-lg" />}
              label="Löschen"
              color="red"
            />
            <ControlButton
              active={activeSection === "summary"}
              onClick={() =>
                setActiveSection(activeSection === "summary" ? null : "summary")
              }
              icon={<FiClock className="text-lg" />}
              label="Übersicht"
              color="green"
            />
            <ControlButton
              active={activeSection === "manual"}
              onClick={() =>
                setActiveSection(activeSection === "manual" ? null : "manual")
              }
              icon={<FiPlusCircle className="text-lg" />}
              label="Manuell"
              color="purple"
            />
            <ControlButton
              active={activeSection === "print"}
              onClick={() =>
                setActiveSection(activeSection === "print" ? null : "print")
              }
              icon={<FiPrinter className="text-lg" />}
              label="Drucken"
              color="indigo"
            />
            <ControlButton
              active={activeSection === "alerts"}
              onClick={() =>
                setActiveSection(activeSection === "alerts" ? null : "alerts")
              }
              icon={<FiAlertTriangle className="text-lg" />}
              label="Fehlstempel"
              color="red"
            />
          </div>

          {/* Filter */}
          {activeSection === "filter" && (
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiUser className="mr-2 text-blue-500" /> Mitarbeiter
                  </label>
                  <select
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                  >
                    <option value="alle">Alle Mitarbeiter</option>
                    {allAdmins.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiCalendar className="mr-2 text-blue-500" /> Datumsbereich
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      selected={dateFilter.start}
                      onChange={(d) =>
                        setDateFilter((f) => ({ ...f, start: d }))
                      }
                      selectsStart
                      startDate={dateFilter.start}
                      endDate={dateFilter.end}
                      placeholderText="Startdatum"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                      dateFormat="dd.MM.yyyy"
                      locale="de"
                    />
                    <DatePicker
                      selected={dateFilter.end}
                      onChange={(d) => setDateFilter((f) => ({ ...f, end: d }))}
                      selectsEnd
                      startDate={dateFilter.start}
                      endDate={dateFilter.end}
                      minDate={dateFilter.start}
                      placeholderText="Enddatum"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                      dateFormat="dd.MM.yyyy"
                      locale="de"
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
                    className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-300 shadow-sm flex items-center justify-center"
                  >
                    <FiRefreshCw className="mr-2" /> Filter zurücksetzen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete */}
          {activeSection === "delete" && (
            <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white shadow-sm"
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white shadow-sm"
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleDeleteRange}
                    disabled={
                      isLoading || !deleteRange.start || !deleteRange.end
                    }
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center shadow-md ${
                      isLoading || !deleteRange.start || !deleteRange.end
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white transform hover:scale-[1.02]"
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
                        Löschen...
                      </>
                    ) : (
                      <>
                        <FiTrash2 className="mr-2" /> Löschen
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {activeSection === "summary" && (
            <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-green-100">
                {summary.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {summary.map((s, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-green-200 shadow-sm p-3 flex flex-col justify-between h-full min-h-[140px] transition-all duration-300 hover:shadow-md hover:border-green-300"
                      >
                        <div className="text-lg font-bold text-gray-800 mb-3 truncate flex items-center">
                          {s.name}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                              <FiClock className="text-blue-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Gesamtzeit
                              </div>
                              <div className="font-semibold text-blue-600">
                                {s.timeFormatted}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-lg mr-3">
                              <FiCalendar className="text-green-600" />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">
                                Arbeitstage
                              </div>
                              <div className="font-semibold text-green-600">
                                {s.daysWorked}{" "}
                                {s.daysWorked === 1 ? "Tag" : "Tage"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                      <FiInbox className="text-gray-400 text-2xl" />
                    </div>
                    <p className="text-gray-500">Keine Daten verfügbar</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Entry */}
          {activeSection === "manual" && (
            <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiUser className="mr-2 text-purple-500" /> Mitarbeiter
                  </label>
                  <select
                    value={manualEntry.admin}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        admin: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white shadow-sm"
                  >
                    <option value="">Bitte wählen</option>
                    {allAdmins.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiTag className="mr-2 text-purple-500" /> Typ
                  </label>
                  <select
                    value={manualEntry.type}
                    onChange={(e) =>
                      setManualEntry((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="in">EIN</option>
                    <option value="out">AUS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiCalendar className="mr-2 text-purple-500" /> Datum &
                    Uhrzeit
                  </label>
                  <DatePicker
                    selected={manualEntry.time}
                    onChange={(d) =>
                      setManualEntry((prev) => ({ ...prev, time: d }))
                    }
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={5}
                    dateFormat="dd.MM.yyyy HH:mm"
                    placeholderText="Datum und Uhrzeit wählen"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white shadow-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="px-5 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center"
                  >
                    <FiX className="mr-2" /> Abbrechen
                  </button>
                  <button
                    onClick={handleManualSave}
                    disabled={!manualEntry.admin || !manualEntry.time}
                    className={`px-5 py-3 rounded-lg font-medium text-white transition-all duration-300 flex items-center shadow-md ${
                      !manualEntry.admin || !manualEntry.time
                        ? "bg-purple-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 transform hover:scale-[1.02]"
                    }`}
                  >
                    <FiSave className="mr-2" /> Speichern
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Print */}
          {activeSection === "print" && (
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiUser className="mr-2 text-indigo-500" /> Mitarbeiter
                  </label>
                  <select
                    value={printConfig.employee}
                    onChange={(e) =>
                      setPrintConfig((p) => ({
                        ...p,
                        employee: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm"
                  >
                    <option value="alle">Alle Mitarbeiter</option>
                    {allAdmins.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
                    <FiCalendar className="mr-2 text-indigo-500" />{" "}
                    Datumsbereich
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <DatePicker
                      selected={printConfig.startDate}
                      onChange={(d) =>
                        setPrintConfig((p) => ({ ...p, startDate: d }))
                      }
                      selectsStart
                      startDate={printConfig.startDate}
                      endDate={printConfig.endDate}
                      placeholderText="Startdatum"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm"
                      dateFormat="dd.MM.yyyy"
                      locale="de"
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
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm"
                      dateFormat="dd.MM.yyyy"
                      locale="de"
                    />
                  </div>
                </div>

                <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
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
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="showSummary"
                    className="ml-3 block text-sm text-gray-700 font-medium"
                  >
                    Zusammenfassung einschließen
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="px-5 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center"
                  >
                    <FiX className="mr-2" /> Abbrechen
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={
                      isPrinting ||
                      !printConfig.startDate ||
                      !printConfig.endDate
                    }
                    className={`px-5 py-3 rounded-lg font-medium text-white transition-all duration-300 flex items-center shadow-md ${
                      isPrinting ||
                      !printConfig.startDate ||
                      !printConfig.endDate
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 transform hover:scale-[1.02]"
                    }`}
                  >
                    {isPrinting ? (
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
                        Drucken...
                      </>
                    ) : (
                      <>
                        <FiPrinter className="mr-2" /> Drucken
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alerts (Fehlstempel) */}
          {activeSection === "alerts" && (
            <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50">
              {unresolvedMissingCount === 0 ? (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
                  ✅ Alles gut! Keine fehlenden Stempelungen im gewählten
                  Zeitraum (Sonntag ignoriert).
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs sm:text-sm text-red-800 bg-white border border-red-200 rounded-lg p-4">
                    <strong>Hinweis:</strong> Sonntag ist ausgenommen; Und{" "}
                    <strong>Abed</strong> ist auch <strong>Samstag</strong>{" "}
                    ausgenommen.
                  </div>

                  <ul className="space-y-2">
                    {missingPunches.map((m, i) => {
                      const dateObj = new Date(m.date);
                      const hasReason = m.justified && m.issue?.trim();
                      return (
                        <li
                          key={`${m.name}-${m.date}-${i}`}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white border border-purple-100 rounded-md px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {m.name}
                            </span>
                            <span className="text-gray-500">
                              {format(dateObj, "dd.MM.yyyy")}
                            </span>

                            {hasReason ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <FiCheckCircle /> {m.issue}
                              </span>
                            ) : (
                              <span className="text-gray-800 flex items-center gap-1">
                                <FiAlertTriangle /> {m.issue}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setJustifyForm({
                                  name: m.name,
                                  date: new Date(m.date),
                                  reason: "",
                                });
                                setJustifyModalOpen(true);
                              }}
                              className="px-2 py-1 text-xs rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50"
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
                                    await fetchJustifications(); // refresh justifications
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
                              className="px-2 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Löschen
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {unresolvedMissingCount > 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-xs sm:text-base">
            ⚠️ {unresolvedMissingCount} Stempel-Hinweise (Sonntag ignoriert).
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiClock className="text-indigo-500" /> Zeiterfassungen
            </h2>
            <span className="text-sm text-gray-500">
              {filtered.length} Einträge
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum & Uhrzeit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <IoMdLocate className="mr-1" />
                      <span>Verifizierung</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.length > 0 ? (
                  paginated.map((r, i) => (
                    <tr
                      key={`${r._id || i}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {r.admin?.name || "Unbekannt"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-gray-700">
                            {format(new Date(r.time), "dd.MM.yyyy")}
                          </div>
                          <div className="text-gray-700">
                            {format(new Date(r.time), "HH:mm")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            r.type === "in"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.type === "in" ? "EIN" : "AUS"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {r.method === "qr"
                            ? "NFC-Verifiziert"
                            : r.method === "added"
                            ? "Hinzugefügt"
                            : r.method === "edited"
                            ? "Bearbeitet"
                            : "Manuell"}
                        </div>
                        {(r.method === "edited" && r.editedBy) ||
                        (r.method === "added" && r.addedBy) ? (
                          <div className="text-xs text-gray-500">
                            von {r.editedBy || r.addedBy}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setEditModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <FiEdit className="mr-1" />
                          <span>Bearbeiten</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg
                          className="mx-auto h-12 w-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Keine Datensätze gefunden
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Versuchen Sie, Ihre Filter zu ändern oder neue Einträge
                        hinzuzufügen.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 1
                      ? "bg-gray-100 text-gray-400"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Zurück
                </button>
                <button
                  onClick={() =>
                    setPage((p) => (p * PER_PAGE < filtered.length ? p + 1 : p))
                  }
                  disabled={page * PER_PAGE >= filtered.length}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page * PER_PAGE >= filtered.length
                      ? "bg-gray-100 text-gray-400"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Weiter
                </button>
              </div>

              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Zeige{" "}
                    <span className="font-medium">
                      {(page - 1) * PER_PAGE + 1}
                    </span>{" "}
                    bis{" "}
                    <span className="font-medium">
                      {Math.min(page * PER_PAGE, filtered.length)}
                    </span>{" "}
                    von <span className="font-medium">{filtered.length}</span>{" "}
                    Einträgen
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        page === 1
                          ? "text-gray-300"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Zurück</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from(
                      { length: Math.ceil(filtered.length / PER_PAGE) },
                      (_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === i + 1
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setPage((p) =>
                          p * PER_PAGE < filtered.length ? p + 1 : p
                        )
                      }
                      disabled={page * PER_PAGE >= filtered.length}
                      className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        page * PER_PAGE >= filtered.length
                          ? "text-gray-300"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Weiter</span>
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                Eintrag bearbeiten
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Modal schließen"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="in">EIN</option>
                  <option value="out">AUS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                >
                  <option value="qr">QR</option>
                  <option value="manual">Manuell</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
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
                className="px-4 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                Grund hinzufügen
              </h3>
              <button
                onClick={() => setJustifyModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Modal schließen"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Mitarbeiter
                </label>
                <input
                  value={justifyForm.name}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Datum
                </label>
                <input
                  value={
                    justifyForm.date
                      ? format(justifyForm.date, "dd.MM.yyyy")
                      : ""
                  }
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Grund
                </label>
                <textarea
                  rows={4}
                  value={justifyForm.reason}
                  onChange={(e) =>
                    setJustifyForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="z.B. Arzttermin, Außendienst, Urlaub, etc."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 rounded-b-xl">
              <button
                onClick={() => setJustifyModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
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
                className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Control Button
function ControlButton({ active, onClick, icon, label, color }) {
  const colorClasses = {
    blue: active
      ? "bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 border-b-2 border-blue-500 shadow-sm"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    red: active
      ? "bg-gradient-to-b from-red-50 to-red-100 text-red-600 border-b-2 border-red-500 shadow-sm"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    green: active
      ? "bg-gradient-to-b from-green-50 to-green-100 text-green-600 border-b-2 border-green-500 shadow-sm"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    purple: active
      ? "bg-gradient-to-b from-purple-50 to-purple-100 text-purple-600 border-b-2 border-purple-500 shadow-sm"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
    indigo: active
      ? "bg-gradient-to-b from-indigo-50 to-indigo-100 text-indigo-600 border-b-2 border-indigo-500 shadow-sm"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
  };

  return (
    <button
      onClick={onClick}
      className={`h-12 sm:h-auto flex-1 flex flex-col sm:flex-row items-center justify-center
                  py-2 px-2 sm:py-4 sm:px-4 gap-0.5 sm:gap-2 text-xs sm:text-sm font-medium
                  transition-all duration-300 ${colorClasses[color]}`}
      type="button"
    >
      <span className="text-base sm:text-lg">{icon}</span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}
