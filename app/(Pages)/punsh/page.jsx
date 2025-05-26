"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FiLogIn,
  FiLogOut,
  FiUser,
  FiFilter,
  FiTrash2,
  FiClock,
  FiCalendar,
} from "react-icons/fi";
import { FaUserClock, FaBusinessTime } from "react-icons/fa";
import { IoMdTime, IoMdLocate } from "react-icons/io";

const dealershipCoords = { lat: 50.9116416, lng: 6.373376 };

export default function PunchClockPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState("out");
  const [records, setRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [deleteRange, setDeleteRange] = useState({ start: null, end: null });
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    const res = await fetch("/api/punch/latest", {
      headers: { "x-admin-id": session.user.id },
    });
    const data = await res.json();
    setCurrentStatus(data?.type || "out");
  }, [session]);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/punch");
    const data = await res.json();
    setRecords(data);
    hasFetched.current = true;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!showRecords) return;
    fetch("/api/punch/summary")
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => toast.error("Zusammenfassung konnte nicht geladen werden"));
  }, [showRecords]);

  useEffect(() => {
    if (session?.user?.id) fetchStatus();
  }, [session, fetchStatus]);

  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const dLat = ((lat - dealershipCoords.lat) * Math.PI) / 180;
          const dLng = ((lng - dealershipCoords.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((dealershipCoords.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const distance =
            6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;
          resolve({ lat, lng, distance });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const handlePunch = async (type) => {
    if (currentStatus === type || isLoading) return;
    setIsLoading(true);
    try {
      const { lat, lng, distance } = await getLocation();
      if (distance > 1200)
        return toast.error(
          "Sie müssen sich innerhalb von 400m vom Autohaus befinden, um ein-/auszustempeln"
        );

      const res = await fetch("/api/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({
          type,
          location: { lat, lng, distance, verified: true },
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(
          `Erfolgreich ${type === "in" ? "eingestempelt" : "ausgestempelt"}`
        );
        await fetchStatus();
        if (showRecords) await fetchRecords();
      } else {
        toast.error(
          result.error || "Fehler bei der Verarbeitung Ihrer Anfrage"
        );
      }
    } catch (err) {
      toast.error("Standortdienstfehler - bitte GPS aktivieren");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchAdmin =
        selectedAdmin === "all" || r.admin?.name === selectedAdmin;
      const recordDate = new Date(r.time);
      const matchDate =
        (!dateFilter.start || recordDate >= dateFilter.start) &&
        (!dateFilter.end || recordDate <= dateFilter.end);
      return matchAdmin && matchDate;
    });
  }, [records, selectedAdmin, dateFilter]);

  const paginated = useMemo(() => {
    const perPage = 10; // Reduced for mobile
    return filtered.slice((page - 1) * perPage, page * perPage);
  }, [filtered, page]);

  const allAdmins = useMemo(() => {
    const names = new Set(records.map((r) => r.admin?.name).filter(Boolean));
    return Array.from(names).sort();
  }, [records]);

  const handleDelete = async () => {
    if (!deleteRange.start || !deleteRange.end)
      return toast.error("Bitte wählen Sie zuerst einen Datumsbereich aus");
    if (
      !window.confirm(
        "Sind Sie sicher, dass Sie diese Datensätze löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    )
      return;

    setIsLoading(true);
    const res = await fetch("/api/punch/delete-range", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-id": session.user.id,
      },
      body: JSON.stringify({
        start: deleteRange.start,
        end: deleteRange.end,
        adminId: selectedAdmin !== "all" ? session.user.id : null,
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
      toast.error("Löschen fehlgeschlagen - bitte versuchen Sie es erneut");
    }
    setIsLoading(false);
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => new Date(d).toLocaleDateString();

  if (status !== "authenticated")
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-gray-600 text-sm md:text-base">
          Authentifizierung wird geladen...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-2 md:p-4 lg:p-8">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        {/* Header Section */}
        <header className="mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <FaUserClock className="text-xl md:text-2xl text-emerald-400" />
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                Mitarbeiter Zeiterfassung
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-gray-800/50 rounded-lg p-2 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <FiUser className="text-emerald-400" />
                <span className="truncate max-w-[100px] md:max-w-none">
                  {session.user.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FiCalendar className="text-emerald-400" />
                <span>{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <IoMdTime className="text-emerald-400" />
                <span>{formatTime(currentTime)}</span>
              </div>
              <div
                className={`px-2 py-0.5 rounded-full text-xs ${
                  currentStatus === "in"
                    ? "bg-emerald-900 text-emerald-200"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {currentStatus === "in" ? "Eingestempelt" : "Ausgestempelt"}
              </div>
            </div>
          </div>
        </header>

        {/* Punch Controls */}
        <section className="mb-4 md:mb-6 lg:mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
              <FaBusinessTime className="text-emerald-400" />
              Stempelaktionen
            </h2>

            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <button
                onClick={() => handlePunch("in")}
                disabled={currentStatus === "in" || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base ${
                  currentStatus === "in" || isLoading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-500/20"
                }`}
              >
                <FiLogIn className="text-base md:text-lg" />
                Einstempeln
              </button>

              <button
                onClick={() => handlePunch("out")}
                disabled={currentStatus !== "in" || isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base ${
                  currentStatus !== "in" || isLoading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:shadow-rose-500/20"
                }`}
              >
                <FiLogOut className="text-base md:text-lg" />
                Ausstempeln
              </button>
            </div>

            <div className="mt-4 md:mt-6 flex justify-center">
              <button
                onClick={() => {
                  setShowRecords((prev) => {
                    const show = !prev;
                    if (show && !hasFetched.current) fetchRecords();
                    return show;
                  });
                }}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs md:text-sm transition-colors"
              >
                {showRecords ? (
                  <>
                    <FiClock className="text-emerald-400" />
                    Zeiterfassungen ausblenden
                  </>
                ) : (
                  <>
                    <FiClock className="text-emerald-400" />
                    Zeiterfassungen anzeigen
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Records Section */}
        {showRecords && (
          <section className="mb-4 md:mb-6 lg:mb-8">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
              <h2 className="text-base md:text-lg font-semibold mb-4 md:mb-6 flex items-center gap-2">
                <FiFilter className="text-emerald-400" />
                Zeiterfassungsverwaltung
              </h2>

              {/* Filters Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1 md:space-y-2">
                    <label className="block text-xs md:text-sm font-medium text-gray-300">
                      Mitarbeiterfilter
                    </label>
                    <select
                      value={selectedAdmin}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    >
                      <option value="all">Alle Mitarbeiter</option>
                      {allAdmins.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Summary Section */}
                  {summary.length > 0 && (
                    <div className="space-y-1 md:space-y-2">
                      <label className="block text-xs md:text-sm font-medium text-gray-300">
                        Arbeitsstunden
                      </label>
                      <div className="bg-gray-700/50 rounded-lg p-2 md:p-3 border border-gray-600">
                        <div className="space-y-1 md:space-y-2">
                          {summary.map((s, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-xs md:text-sm"
                            >
                              <span className="text-gray-300 truncate max-w-[120px] md:max-w-none">
                                {s.name}
                              </span>
                              <span className="font-medium text-emerald-400">
                                {s.hours} h
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 md:space-y-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-300">
                    Datumsbereich Filter
                  </label>
                  <div className="flex gap-1 md:gap-2">
                    <DatePicker
                      selected={dateFilter.start}
                      onChange={(d) =>
                        setDateFilter((f) => ({ ...f, start: d }))
                      }
                      placeholderText="Startdatum"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      dateFormat="dd.MM.yyyy"
                    />
                    <DatePicker
                      selected={dateFilter.end}
                      onChange={(d) => setDateFilter((f) => ({ ...f, end: d }))}
                      placeholderText="Enddatum"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      dateFormat="dd.MM.yyyy"
                    />
                  </div>
                </div>
              </div>

              {/* Delete Section */}
              <div className="mb-6 p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2 text-rose-400">
                  <FiTrash2 />
                  Datensätze löschen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-end">
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-400">
                      Startdatum
                    </label>
                    <DatePicker
                      selected={deleteRange.start}
                      onChange={(d) =>
                        setDeleteRange((r) => ({ ...r, start: d }))
                      }
                      placeholderText="Startdatum"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                      dateFormat="dd.MM.yyyy"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-400">
                      Enddatum
                    </label>
                    <DatePicker
                      selected={deleteRange.end}
                      onChange={(d) =>
                        setDeleteRange((r) => ({ ...r, end: d }))
                      }
                      placeholderText="Enddatum"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                      dateFormat="dd.MM.yyyy"
                    />
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={
                      isLoading || !deleteRange.start || !deleteRange.end
                    }
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                      isLoading || !deleteRange.start || !deleteRange.end
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-rose-700 hover:bg-rose-600 text-white shadow-md hover:shadow-rose-500/20"
                    }`}
                  >
                    <FiTrash2 />
                    Bereich löschen
                  </button>
                </div>
              </div>

              {/* Records Table */}
              {/* Records Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Mitarbeiter
                      </th>
                      <th className="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Datum & Zeit
                      </th>
                      <th className="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Aktion
                      </th>
                      <th className="px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <IoMdLocate className="text-xs md:text-sm" />
                          <span>Entfernung</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {paginated.length > 0 ? (
                      paginated.map((r, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-300">
                            {r.admin?.name || "Unbekannt"}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm">
                            {new Date(r.time).toLocaleString([], {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-xs ${
                                  r.type === "in"
                                    ? "bg-emerald-900/50 text-emerald-200"
                                    : "bg-rose-900/50 text-rose-200"
                                }`}
                              >
                                {r.type === "in" ? "EIN" : "AUS"}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 md:px-4 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-300">
                            {r.location?.verified
                              ? "Verifiziert"
                              : "Nicht verifiziert"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-2 py-4 md:px-4 md:py-6 text-center text-xs md:text-sm text-gray-400"
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
                <div className="flex items-center justify-between mt-3 px-1 md:px-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      page === 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    Zurück
                  </button>
                  <span className="text-xs md:text-sm text-gray-400">
                    Seite {page} von {Math.ceil(filtered.length / 10)}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => (p * 10 < filtered.length ? p + 1 : p))
                    }
                    disabled={page * 10 >= filtered.length}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      page * 10 >= filtered.length
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    Weiter
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
