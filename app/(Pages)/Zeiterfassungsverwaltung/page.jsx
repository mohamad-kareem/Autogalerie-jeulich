"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import { format } from "date-fns";

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
} from "react-icons/fi";
import { IoMdLocate } from "react-icons/io";

export default function Zeiterfassungsverwaltung() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);
  const [activeSection, setActiveSection] = useState(null); // 'filter', 'delete', 'summary', 'manual'

  const [selectedAdmin, setSelectedAdmin] = useState("alle");
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [deleteRange, setDeleteRange] = useState({ start: null, end: null });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/punch");
      const data = await res.json();
      setRecords(data);
      hasFetched.current = true;
    } catch (error) {
      toast.error("Daten konnten nicht geladen werden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchAdmin =
        selectedAdmin === "alle" || r.admin?.name === selectedAdmin;
      const recordDate = new Date(r.time);
      const matchDate =
        (!dateFilter.start || recordDate >= dateFilter.start) &&
        (!dateFilter.end || recordDate <= dateFilter.end);
      return matchAdmin && matchDate;
    });
  }, [records, selectedAdmin, dateFilter]);

  const paginated = useMemo(() => {
    const perPage = 10;
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page]);

  const summary = useMemo(() => {
    const byAdmin = {};
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );

    for (const r of sorted) {
      const name = r.admin?.name || "Unbekannt";
      if (!byAdmin[name]) byAdmin[name] = { lastIn: null, totalMs: 0 };

      if (r.type === "in" && !byAdmin[name].lastIn) {
        byAdmin[name].lastIn = new Date(r.time);
      } else if (r.type === "out" && byAdmin[name].lastIn) {
        const diff = new Date(r.time) - byAdmin[name].lastIn;
        if (diff > 0) byAdmin[name].totalMs += diff;
        byAdmin[name].lastIn = null;
      }
    }

    return Object.entries(byAdmin).map(([name, { totalMs }]) => {
      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

      return {
        name,
        timeFormatted: `${hours}h ${minutes}m ${seconds}s`,
      };
    });
  }, [filtered]);

  const allAdmins = useMemo(() => {
    const names = new Set(records.map((r) => r.admin?.name).filter(Boolean));
    return Array.from(names).sort();
  }, [records]);

  const handleDelete = async () => {
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
          start: deleteRange.start,
          end: deleteRange.end,
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
        fetchRecords();
      } else {
        throw new Error(data.message || "Löschen fehlgeschlagen");
      }
    } catch (error) {
      toast.error("Löschen fehlgeschlagen - bitte versuchen Sie es erneut");
    } finally {
      setIsLoading(false);
    }
  };

  const [manualEntry, setManualEntry] = useState({
    admin: "",
    type: "in",
    time: null,
    method: "manual",
  });

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
        fetchRecords();
      } else {
        throw new Error(data.error || "Fehler beim Speichern");
      }
    } catch (error) {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600 text-sm md:text-base">
          Authentifizierung wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/AdminDashboard")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="text-gray-600" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
              Zeiterfassungsverwaltung
            </h1>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
            <FiUser className="text-gray-500 text-sm sm:text-base" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {session.user.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
          {/* Enhanced Control Panel Header */}
          <div className="grid grid-cols-2 sm:flex border-b border-gray-200">
            {/* Filter Button */}
            <button
              onClick={() =>
                setActiveSection(activeSection === "filter" ? null : "filter")
              }
              className={`flex-1 flex items-center justify-center py-2 sm:py-3 px-2 sm:px-4 space-x-1 sm:space-x-2 text-sm sm:text-sm font-medium transition-colors ${
                activeSection === "filter"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiFilter className="shrink-0 sm:mr-1 md:mr-2" />
              <span className="whitespace-nowrap">Filter</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() =>
                setActiveSection(activeSection === "delete" ? null : "delete")
              }
              className={`flex-1 flex items-center justify-center py-2 sm:py-3 px-2 sm:px-4 space-x-1 sm:space-x-2 text-sm sm:text-sm font-medium transition-colors ${
                activeSection === "delete"
                  ? "bg-red-50 text-red-600 border-b-2 border-red-500"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiTrash2 className="shrink-0 sm:mr-1 md:mr-2" />
              <span className="whitespace-nowrap">Löschen</span>
            </button>

            {/* Summary Button */}
            <button
              onClick={() =>
                setActiveSection(activeSection === "summary" ? null : "summary")
              }
              className={`flex-1 flex items-center justify-center py-2 sm:py-3 px-2 sm:px-4 space-x-1 sm:space-x-2 text-sm sm:text-sm font-medium transition-colors ${
                activeSection === "summary"
                  ? "bg-green-50 text-green-600 border-b-2 border-green-500"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiClock className="shrink-0 sm:mr-1 md:mr-2" />
              <span className="whitespace-nowrap">Übersicht</span>
            </button>

            {/* Manual Entry Button */}
            <button
              onClick={() =>
                setActiveSection(activeSection === "manual" ? null : "manual")
              }
              className={`flex-1 flex items-center justify-center py-2 sm:py-3 px-2 sm:px-4 space-x-1 sm:space-x-2 text-sm sm:text-sm font-medium transition-colors ${
                activeSection === "manual"
                  ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiPlusCircle className="shrink-0 sm:mr-1 md:mr-2" />
              <span className="whitespace-nowrap">Manuell</span>
            </button>
          </div>

          {/* Filter Section */}
          {activeSection === "filter" && (
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Mitarbeiter
                  </label>
                  <select
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Datumsbereich
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <DatePicker
                        selected={dateFilter.start}
                        onChange={(d) =>
                          setDateFilter((f) => ({ ...f, start: d }))
                        }
                        selectsStart
                        startDate={dateFilter.start}
                        endDate={dateFilter.end}
                        placeholderText="Startdatum"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                      />
                    </div>
                    <div>
                      <DatePicker
                        selected={dateFilter.end}
                        onChange={(d) =>
                          setDateFilter((f) => ({ ...f, end: d }))
                        }
                        selectsEnd
                        startDate={dateFilter.start}
                        endDate={dateFilter.end}
                        minDate={dateFilter.start}
                        placeholderText="Enddatum"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setDateFilter({ start: null, end: null });
                      setSelectedAdmin("alle");
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Section */}
          {activeSection === "delete" && (
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Zeitraum
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleDelete}
                    disabled={
                      isLoading || !deleteRange.start || !deleteRange.end
                    }
                    className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isLoading || !deleteRange.start || !deleteRange.end
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {isLoading ? "Löschen..." : "Löschen"}
                  </button>
                </div>

                <div className="flex items-center">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {deleteRange.start && deleteRange.end
                      ? `Einträge von ${format(
                          deleteRange.start,
                          "dd.MM.yyyy"
                        )} bis ${format(
                          deleteRange.end,
                          "dd.MM.yyyy"
                        )} werden gelöscht`
                      : "Bitte Zeitraum auswählen"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Section */}
          {activeSection === "summary" && (
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                {summary.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {summary.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2 px-3 sm:py-3 sm:px-4 bg-white rounded-lg shadow-xs border border-gray-200"
                      >
                        <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                          {s.name}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-blue-600 whitespace-nowrap ml-2">
                          {s.timeFormatted}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">
                    Keine Daten verfügbar
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manual Entry Section */}
          {activeSection === "manual" && (
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="in">EIN</option>
                    <option value="out">AUS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Datum & Uhrzeit
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div className="flex justify-end space-x-2 sm:space-x-3 pt-2">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleManualSave}
                    disabled={!manualEntry.admin || !manualEntry.time}
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-white transition-colors ${
                      !manualEntry.admin || !manualEntry.time
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Zeiterfassungen
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mitarbeiter
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum & Uhrzeit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <IoMdLocate className="mr-1" />
                      <span>Verifizierung</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.length > 0 ? (
                  paginated.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {r.admin?.name || "Unbekannt"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(r.time).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            r.type === "in"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.type === "in" ? "EIN" : "AUS"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <div>
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
                            <div className="text-xs text-gray-400">
                              von {r.editedBy || r.addedBy}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <FiEdit className="mr-1" />
                          <span>Bearbeiten</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-500 py-8">
                        Keine Datensätze gefunden
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md ${
                    page === 1
                      ? "bg-gray-100 text-gray-400"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Zurück
                </button>
                <button
                  onClick={() =>
                    setPage((p) => (p * 10 < filtered.length ? p + 1 : p))
                  }
                  disabled={page * 10 >= filtered.length}
                  className={`ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md ${
                    page * 10 >= filtered.length
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
                    <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
                    bis{" "}
                    <span className="font-medium">
                      {Math.min(page * 10, filtered.length)}
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
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        page === 1
                          ? "text-gray-300"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Zurück</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from(
                      { length: Math.ceil(filtered.length / 10) },
                      (_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            page === i + 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setPage((p) => (p * 10 < filtered.length ? p + 1 : p))
                      }
                      disabled={page * 10 >= filtered.length}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        page * 10 >= filtered.length
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Eintrag bearbeiten
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="in">EIN</option>
                  <option value="out">AUS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="qr">QR</option>
                  <option value="manual">Manuell</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                      fetchRecords();
                    } else {
                      throw new Error(
                        data.error || "Aktualisierung fehlgeschlagen"
                      );
                    }
                  } catch (err) {
                    toast.error("Aktualisierung fehlgeschlagen");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
