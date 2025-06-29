"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiUser,
  FiFilter,
  FiTrash2,
  FiClock,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { IoMdLocate } from "react-icons/io";

export default function Zeiterfassungsverwaltung() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState("alle");
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [deleteRange, setDeleteRange] = useState({ start: null, end: null });

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

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDate = (d) => new Date(d).toLocaleDateString("de-DE");

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-gray-600 text-sm md:text-base">
          Authentifizierung wird geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="text-lg text-blue-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Zeiterfassungsverwaltung
            </h1>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm">
            <FiUser className="text-blue-600" />
            <span className="font-medium text-gray-700">
              {session.user.name}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Filters Section */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiFilter className="mr-2 text-blue-600" />
                Filter
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mitarbeiter Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mitarbeiter
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="alle">Alle Mitarbeiter</option>
                  {allAdmins.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datumsbereich Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datumsbereich
                </label>
                <div className="flex space-x-2">
                  <DatePicker
                    selected={dateFilter.start}
                    onChange={(d) => setDateFilter((f) => ({ ...f, start: d }))}
                    placeholderText="Startdatum"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    dateFormat="dd.MM.yyyy"
                    locale="de"
                  />
                  <DatePicker
                    selected={dateFilter.end}
                    onChange={(d) => setDateFilter((f) => ({ ...f, end: d }))}
                    placeholderText="Enddatum"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    dateFormat="dd.MM.yyyy"
                    locale="de"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delete Section Toggle Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <button
              onClick={() => setShowDeleteSection((prev) => !prev)}
              className="w-full flex items-center justify-between text-sm font-semibold text-red-700 focus:outline-none"
            >
              <div className="flex items-center">
                <FiTrash2 className="mr-2" />
                {showDeleteSection
                  ? "Löschbereich ausblenden"
                  : "Löschbereich anzeigen"}
              </div>
              <span className="text-lg">{showDeleteSection ? "−" : "+"}</span>
            </button>

            {/* Collapsible Delete Section */}
            {showDeleteSection && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Startdatum
                  </label>
                  <DatePicker
                    selected={deleteRange.start}
                    onChange={(d) =>
                      setDeleteRange((r) => ({ ...r, start: d }))
                    }
                    placeholderText="Startdatum wählen"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-white"
                    dateFormat="dd.MM.yyyy"
                    locale="de"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Enddatum
                  </label>
                  <DatePicker
                    selected={deleteRange.end}
                    onChange={(d) => setDeleteRange((r) => ({ ...r, end: d }))}
                    placeholderText="Enddatum wählen"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-white"
                    dateFormat="dd.MM.yyyy"
                    locale="de"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDelete}
                    disabled={
                      isLoading || !deleteRange.start || !deleteRange.end
                    }
                    className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                      isLoading || !deleteRange.start || !deleteRange.end
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    <FiTrash2 className="mr-2" />
                    Bereich löschen
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Arbeitszeitübersicht */}
          <div className="px-6 py-4 bg-gray-50">
            {summary.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arbeitszeitübersicht
                </label>
                <div className="bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                  {summary.map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm mb-1 last:mb-0"
                    >
                      <span className="text-gray-600">{s.name}</span>
                      <span className="font-medium text-blue-600">
                        {s.timeFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Datensätze Tabelle */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mitarbeiter
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Datum & Uhrzeit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Aktion
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      <IoMdLocate className="mr-1" />
                      Verifizierung
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.length > 0 ? (
                  paginated.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {r.admin?.name || "Unbekannt"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(r.time).toLocaleString("de-DE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.type === "in"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.type === "in" ? "EIN" : "AUS"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.method === "qr"
                          ? "scan-Verifiziert"
                          : "Manuell verifiziert"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Keine Datensätze gefunden
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
                    setPage((p) => (p * 10 < filtered.length ? p + 1 : p))
                  }
                  disabled={page * 10 >= filtered.length}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
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
      </div>
    </div>
  );
}
