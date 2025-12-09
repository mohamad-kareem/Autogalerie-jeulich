"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FiCalendar,
  FiSun,
  FiMoon,
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

// Small helper: show key color as emoji dot (optional flair)
function hexToEmoji(hex) {
  if (!hex) return "⚪";
  const c = hex.toLowerCase();
  if (c.includes("ff0000")) return "🔴";
  if (c.includes("00ff00")) return "🟢";
  if (c.includes("0000ff")) return "🔵";
  if (c.includes("ffff00")) return "🟡";
  if (c.includes("ff8800") || c.includes("ffa500")) return "🟠";
  if (c.includes("000000")) return "⚫";
  if (c.includes("ffffff")) return "⚪";
  return "🔘";
}

export default function CarLocationsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [rows, setRows] = useState([]);
  const [carOptions, setCarOptions] = useState([]);

  const [editRowId, setEditRowId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const currentMonth = String(new Date().getMonth() + 1);
  const [monthFilter, setMonthFilter] = useState(currentMonth);

  // ---------------------------
  // Theme INIT (same logic as Kaufvertrag)
  // ---------------------------
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = saved === "dark" || (!saved && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    document.documentElement.classList.toggle("dark", newVal);
    localStorage.setItem("theme", newVal ? "dark" : "light");
  };

  // ---------------------------
  // Load Data
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Schein options (with rotKennzeichen)
        const scheinRes = await fetch("/api/carschein?page=1&limit=5000");
        const scheinData = await scheinRes.json();

        const opts = Array.isArray(scheinData.docs)
          ? scheinData.docs
              .filter((d) => !!d.rotKennzeichen)
              .map((d) => ({
                id: d._id,
                carName: d.carName || "",
                finNumber: d.finNumber || "",
                keyColor: d.keyColor || null,
              }))
          : [];

        // Existing locations
        const locRes = await fetch("/api/car-locations");
        const locData = await locRes.json();

        const mapped = Array.isArray(locData.docs)
          ? locData.docs.map((item) => ({
              _id: item._id,
              date: item.date
                ? new Date(item.date).toISOString().slice(0, 10)
                : "",
              carName: item.carName || "",
              finNumber: item.finNumber || "",
              location: item.location || "",
            }))
          : [];

        if (mounted) {
          setCarOptions(opts);
          setRows(mapped);
        }
      } catch (err) {
        toast.error("Fehler beim Laden der Daten");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const sortedOptions = useMemo(
    () => [...carOptions].sort((a, b) => a.carName.localeCompare(b.carName)),
    [carOptions]
  );

  // ---------------------------
  // Helpers
  // ---------------------------
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!r.date) {
        // No date -> only show in current month filter
        return monthFilter === currentMonth;
      }
      const m = new Date(r.date).getMonth() + 1;
      return String(m) === String(monthFilter);
    });
  }, [rows, monthFilter, currentMonth]);

  const handleField = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        const rowId = r._id || r.tempId;
        if (rowId !== id) return r;

        if (field === "carName") {
          const found = sortedOptions.find((o) => o.carName === value);
          return {
            ...r,
            carName: found ? found.carName : value,
            finNumber: found ? found.finNumber : "",
          };
        }

        return { ...r, [field]: value };
      })
    );
  };

  const addNewRow = () => {
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    setRows((prev) => [
      ...prev,
      {
        tempId,
        date: "",
        carName: "",
        finNumber: "",
        location: "",
      },
    ]);

    setEditRowId(tempId);
    setSelectedIds([tempId]);
  };

  const deleteRow = async (row, { skipConfirm = false } = {}) => {
    if (!skipConfirm) {
      if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    }

    if (!row._id) {
      // Not stored yet
      setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
      setSelectedIds((prev) =>
        prev.filter((id) => id !== row.tempId && id !== row._id)
      );
      return;
    }

    try {
      const res = await fetch(`/api/car-locations?id=${row._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Löschen fehlgeschlagen");
        return;
      }
      setRows((prev) => prev.filter((r) => r._id !== row._id));
      setSelectedIds((prev) =>
        prev.filter((id) => id !== row._id && id !== row.tempId)
      );
      toast.success("Eintrag gelöscht");
    } catch {
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const saveRow = async (row) => {
    const payload = {
      date: row.date || null,
      carName: row.carName,
      finNumber: row.finNumber,
      location: row.location,
    };

    try {
      const id = row._id || row.tempId;
      setSavingId(id);

      let res;
      if (row._id) {
        res = await fetch("/api/car-locations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: row._id, ...payload }),
        });
      } else {
        res = await fetch("/api/car-locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Speichern fehlgeschlagen");
        return;
      }

      setRows((prev) =>
        prev.map((r) => {
          const match = r._id === data._id || r.tempId === row.tempId;
          if (!match) return r;

          return {
            _id: data._id,
            date: data.date
              ? new Date(data.date).toISOString().slice(0, 10)
              : "",
            carName: data.carName,
            finNumber: data.finNumber,
            location: data.location,
          };
        })
      );

      setEditRowId(null);
      toast.success("Gespeichert");
    } catch {
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSavingId(null);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // If month changes → clear selection & edit mode
  useEffect(() => {
    setSelectedIds([]);
    setEditRowId(null);
  }, [monthFilter]);

  const someSelected = selectedIds.length > 0;

  const handleRowEditClick = (id) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
    setEditRowId(id);
  };

  const handleRowDeleteClick = async (row) => {
    await deleteRow(row);
  };

  // ---------------------------
  // THEME CLASSES (aligned with Kaufvertrag)
  // ---------------------------
  const bgClass = darkMode ? "bg-slate-900" : "bg-slate-50";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";

  const inputBg = darkMode
    ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500";

  const buttonPrimary = darkMode
    ? "bg-slate-700 hover:bg-slate-600 text-white"
    : "bg-slate-600 hover:bg-slate-700 text-white";

  // ---------------------------
  // LOADING
  // ---------------------------
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-screen transition-colors duration-300 ${bgClass}`}
      >
        <div
          className={`h-12 w-12 rounded-full animate-spin border-t-2 border-b-2 ${
            darkMode ? "border-slate-400" : "border-slate-600"
          }`}
        />
      </div>
    );
  }

  // Dynamic colSpan
  const baseColumns = 1 + 4; // checkbox + 4 data columns
  const columnCount = someSelected ? baseColumns + 1 : baseColumns;

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgClass} px-2 py-3 sm:px-4 lg:px-6`}
    >
      <div className="max-w-screen-2xl mx-auto">
        {/* HEADER */}
        {/* HEADER + FILTER ROW (side-by-side, no animation) */}
        <div className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Title */}
          <h1
            className={`text-base sm:text-base lg:text-xl font-bold transition-colors duration-300 ${textPrimary}`}
          >
            Fahrzeug-Standorte
          </h1>

          {/* Right: Month Filter */}
          <div
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] sm:text-xs transition-colors duration-300 mr-15 ${
              darkMode
                ? "bg-slate-700 border-slate-600 text-slate-300"
                : "bg-slate-50 border-slate-300 text-slate-600"
            }`}
          >
            <FiCalendar
              className={`text-xs transition-colors duration-300 ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className={`bg-transparent text-[11px] sm:text-xs focus:outline-none transition-colors duration-300 ${
                darkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              <option value="1">Januar</option>
              <option value="2">Februar</option>
              <option value="3">März</option>
              <option value="4">April</option>
              <option value="5">Mai</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Dezember</option>
            </select>
          </div>
        </div>

        {/* TABLE CARD */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg border transition-colors duration-300 ${borderColor} ${cardBg} shadow-sm overflow-hidden`}
        >
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y transition-colors duration-300 text-xs sm:text-sm">
              <thead
                className={`sticky top-0 z-10 transition-colors duration-300 ${
                  darkMode ? "bg-slate-800" : "bg-slate-50"
                }`}
              >
                <tr
                  className={`text-left text-[10px] sm:text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <th className="w-8 px-3 py-3" />
                  <th className="px-3 py-3 whitespace-nowrap">Datum</th>
                  <th className="px-3 py-3 whitespace-nowrap">Fahrzeug</th>
                  <th className="px-3 py-3 whitespace-nowrap">FIN</th>
                  <th className="px-3 py-3 whitespace-nowrap">Standort</th>
                  {someSelected && (
                    <th className="px-3 py-3 text-right whitespace-nowrap">
                      Aktionen
                    </th>
                  )}
                </tr>
              </thead>

              <tbody
                className={`divide-y transition-colors duration-300 ${
                  darkMode
                    ? "divide-slate-700 bg-slate-800"
                    : "divide-slate-200 bg-white"
                }`}
              >
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className={`px-3 py-8 text-center text-xs transition-colors duration-300 ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Keine Einträge für diesen Monat
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const id = row._id || row.tempId || `row-${index}`;
                    const isSelected = selectedIds.includes(id);
                    const isEditing = editRowId === id;

                    return (
                      <tr
                        key={`${id}-${index}`} // unique key to avoid warning
                        className={`transition-colors duration-300 ${
                          darkMode
                            ? isSelected
                              ? "bg-slate-700"
                              : "hover:bg-slate-700"
                            : isSelected
                            ? "bg-blue-50"
                            : "hover:bg-blue-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="px-3 py-3 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className={`kv-checkbox ${darkMode ? "dark" : ""}`}
                            checked={isSelected}
                            onChange={() => toggleSelectOne(id)}
                          />
                        </td>

                        {/* Datum */}
                        <td className="px-3 py-3 align-middle">
                          {isEditing ? (
                            <input
                              type="date"
                              value={row.date || ""}
                              onChange={(e) =>
                                handleField(id, "date", e.target.value)
                              }
                              className={`w-full rounded-md border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                            />
                          ) : (
                            <span
                              className={`text-[11px] sm:text-sm ${textPrimary}`}
                            >
                              {row.date || "-"}
                            </span>
                          )}
                        </td>

                        {/* Fahrzeug */}
                        <td className="px-3 py-3 align-middle max-w-[200px] sm:max-w-[260px]">
                          {isEditing ? (
                            <select
                              value={row.carName || ""}
                              onChange={(e) =>
                                handleField(id, "carName", e.target.value)
                              }
                              className={`w-full rounded-md border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                            >
                              <option value="">– auswählen –</option>
                              {sortedOptions.map((opt) => {
                                const dot = hexToEmoji(opt.keyColor);
                                return (
                                  <option key={opt.id} value={opt.carName}>
                                    {dot} {opt.carName}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <span
                              className={`text-[11px] sm:text-sm truncate block ${textPrimary}`}
                            >
                              {row.carName || "-"}
                            </span>
                          )}
                        </td>

                        {/* FIN */}
                        <td className="px-3 py-3 align-middle">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.finNumber || ""}
                              onChange={(e) =>
                                handleField(id, "finNumber", e.target.value)
                              }
                              className={`w-full rounded-md border px-2 py-1 text-[11px] sm:text-xs font-mono tracking-wider ${inputBg}`}
                              placeholder="FIN"
                            />
                          ) : (
                            <span
                              className={`text-[11px] sm:text-sm font-mono tracking-wider ${textSecondary}`}
                            >
                              {row.finNumber || "-"}
                            </span>
                          )}
                        </td>

                        {/* Standort */}
                        <td className="px-3 py-3 align-middle max-w-[220px] sm:max-w-[260px]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.location || ""}
                              onChange={(e) =>
                                handleField(id, "location", e.target.value)
                              }
                              className={`w-full rounded-md border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                              placeholder="z. B. Jülich"
                            />
                          ) : (
                            <span
                              className={`text-[11px] sm:text-sm truncate block ${textPrimary}`}
                            >
                              {row.location || "-"}
                            </span>
                          )}
                        </td>

                        {/* Aktionen – ONLY when someSelected */}
                        {someSelected && (
                          <td className="px-3 py-3 align-middle">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => saveRow(row)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors duration-300 ${
                                    darkMode
                                      ? "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"
                                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <FiSave
                                    size={14}
                                    className={
                                      savingId === id ? "animate-pulse" : ""
                                    }
                                  />
                                </button>
                                <button
                                  onClick={() => setEditRowId(null)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors duration-300 ${
                                    darkMode
                                      ? "border-slate-600 bg-slate-700 text-red-400 hover:bg-slate-600"
                                      : "border-slate-300 bg-red-50 text-red-600 hover:bg-red-100"
                                  }`}
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            ) : isSelected ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleRowEditClick(id)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors duration-300 ${
                                    darkMode
                                      ? "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"
                                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <FiEdit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleRowDeleteClick(row)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors duration-300 ${
                                    darkMode
                                      ? "border-slate-600 bg-slate-700 text-red-400 hover:bg-slate-600"
                                      : "border-slate-300 bg-red-50 text-red-600 hover:bg-red-100"
                                  }`}
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="h-7" />
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ADD NEW ROW BUTTON */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={addNewRow}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm ${buttonPrimary}`}
          >
            <FiPlus size={16} />
            Neue Zeile
          </button>
        </div>
      </div>

      {/* Custom checkbox styling (like Kaufvertrag) */}
      <style jsx>{`
        .kv-checkbox {
          width: 14px;
          height: 14px;
          appearance: none;
          cursor: pointer;
          border: 1px solid #9ca3af;
          background-color: #ffffff;
          position: relative;
          display: inline-block;
          border-radius: 0;
        }

        .kv-checkbox.dark {
          border-color: #6b7280;
          background-color: #374151;
        }

        .kv-checkbox:checked {
          border-color: #4b5563;
        }

        .kv-checkbox.dark:checked {
          border-color: #9ca3af;
        }

        .kv-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 3px;
          top: 0px;
          width: 6px;
          height: 10px;
          border-right: 2px solid #4b5563;
          border-bottom: 2px solid #4b5563;
          transform: rotate(45deg);
        }

        .kv-checkbox.dark:checked::after {
          border-right-color: #ffffff;
          border-bottom-color: #ffffff;
        }
      `}</style>
    </div>
  );
}
