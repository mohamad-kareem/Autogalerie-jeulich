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
  FiDownload, // NEW
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

// NEW: for Word export
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

// Kleine Spielerei: Schlüssel-Farbe als Emoji
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

function formatDateRange(startStr, endStr) {
  if (!startStr && !endStr) return "-";

  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  if (!start || isNaN(start.getTime())) return "-";

  const datePart = start.toLocaleDateString("de-DE");
  const startTime = start.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end || isNaN(end.getTime())) return `${datePart} ${startTime}`;

  const endTime = end.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${startTime} bis ${endTime}`;
}

export default function CarLocationsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [rows, setRows] = useState([]);
  const [carOptions, setCarOptions] = useState([]); // aus Rotschein
  const [editRowId, setEditRowId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const currentMonth = String(new Date().getMonth() + 1);
  const [monthFilter, setMonthFilter] = useState(currentMonth);

  // ---------------------------
  // THEME INIT
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
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // ---------------------------
  // LOAD DATA (Rotschein + Fahrtenbuch)
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // 1) Rotschein-Autos laden
        const scheinRes = await fetch("/api/carschein?page=1&limit=5000");
        const scheinData = await scheinRes.json();

        const options = Array.isArray(scheinData.docs)
          ? scheinData.docs
              .filter((d) => !!d.rotKennzeichen)
              .map((d) => ({
                id: d._id,
                carName: d.carName || "",
                finNumber: d.finNumber || "",
                keyColor: d.keyColor || null,
              }))
          : [];

        // 2) Fahrtenbuch-Einträge laden
        const locRes = await fetch("/api/car-locations");
        const locData = await locRes.json();

        const mapped = Array.isArray(locData.docs)
          ? locData.docs.map((item) => ({
              _id: item._id,
              startDateTime: item.startDateTime
                ? new Date(item.startDateTime).toISOString().slice(0, 16)
                : "",
              endDateTime: item.endDateTime
                ? new Date(item.endDateTime).toISOString().slice(0, 16)
                : "",
              vehicleType: item.vehicleType || "PKW",
              manufacturer: item.manufacturer || "",
              vehicleId: item.vehicleId || "",
              routeSummary: item.routeSummary || "",
              driverInfo: item.driverInfo || "",
            }))
          : [];

        if (!mounted) return;

        setCarOptions(options);
        setRows(mapped);
      } catch (err) {
        console.error(err);
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
  // FILTER + HELPERS
  // ---------------------------
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!r.startDateTime) {
        return monthFilter === currentMonth;
      }
      const d = new Date(r.startDateTime);
      if (isNaN(d.getTime())) return false;
      const m = d.getMonth() + 1;
      return String(m) === String(monthFilter);
    });
  }, [rows, monthFilter, currentMonth]);

  // ---------------------------
  // EXPORT TO WORD (current month / filteredRows)
  // ---------------------------
  const exportToWord = async () => {
    try {
      if (!filteredRows.length) {
        toast.error("Keine Einträge zum Exportieren.");
        return;
      }

      const tableRows = [];

      // Header row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Lfd.")] }),
            new TableCell({ children: [new Paragraph("Datum Beginn / Ende")] }),
            new TableCell({ children: [new Paragraph("Art")] }),
            new TableCell({ children: [new Paragraph("Herst.")] }),
            new TableCell({ children: [new Paragraph("FZ-Ident.Nr")] }),
            new TableCell({ children: [new Paragraph("Fahrstrecke")] }),
            new TableCell({ children: [new Paragraph("Fahrer")] }),
          ],
        })
      );

      // Data rows
      filteredRows.forEach((row, index) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(String(index + 1))],
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    formatDateRange(row.startDateTime, row.endDateTime)
                  ),
                ],
              }),
              new TableCell({
                children: [new Paragraph(row.vehicleType || "-")],
              }),
              new TableCell({
                children: [new Paragraph(row.manufacturer || "-")],
              }),
              new TableCell({
                children: [new Paragraph(row.vehicleId || "-")],
              }),
              new TableCell({
                children: [new Paragraph(row.routeSummary || "-")],
              }),
              new TableCell({
                children: [new Paragraph(row.driverInfo || "-")],
              }),
            ],
          })
        );
      });

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: "Fahrtenbuch",
                heading: HeadingLevel.HEADING1,
              }),
              new Paragraph({
                text: `Monat: ${monthFilter}`,
              }),
              new Paragraph(""),
              table,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Fahrtenbuch_${monthFilter}.docx`);
      toast.success("Word-Datei wurde erstellt.");
    } catch (err) {
      console.error(err);
      toast.error("Export nach Word fehlgeschlagen.");
    }
  };

  const handleField = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        const rowId = r._id || r.tempId;
        if (rowId !== id) return r;

        if (field === "manufacturer") {
          const found = sortedOptions.find((o) => o.carName === value);

          const fullName = found ? found.carName : value || "";
          const firstWord = fullName.trim().split(/\s+/)[0] || fullName; // nur das erste Wort

          return {
            ...r,
            manufacturer: firstWord, // z.B. "BMW"
            vehicleId: found ? found.finNumber : "", // FIN bleibt vom Rotschein
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
        startDateTime: "",
        endDateTime: "",
        vehicleType: "PKW",
        manufacturer: "",
        vehicleId: "",
        routeSummary: "",
        driverInfo: "",
      },
    ]);

    setEditRowId(tempId);
    setSelectedIds([tempId]);
  };

  const deleteRow = async (row, { skipConfirm = false } = {}) => {
    if (!skipConfirm) {
      if (!confirm("Diesen Eintrag wirklich löschen?")) return;
    }

    // Nur lokal
    if (!row._id) {
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
    } catch (err) {
      console.error(err);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const saveRow = async (row) => {
    const payload = {
      startDateTime: row.startDateTime || null,
      endDateTime: row.endDateTime || null,
      vehicleType: row.vehicleType || "",
      manufacturer: row.manufacturer || "",
      vehicleId: row.vehicleId || "",
      routeSummary: row.routeSummary || "",
      driverInfo: row.driverInfo || "",
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
            startDateTime: data.startDateTime
              ? new Date(data.startDateTime).toISOString().slice(0, 16)
              : "",
            endDateTime: data.endDateTime
              ? new Date(data.endDateTime).toISOString().slice(0, 16)
              : "",
            vehicleType: data.vehicleType || "",
            manufacturer: data.manufacturer || "",
            vehicleId: data.vehicleId || "",
            routeSummary: data.routeSummary || "",
            driverInfo: data.driverInfo || "",
          };
        })
      );

      setEditRowId(null);
      toast.success("Gespeichert");
    } catch (err) {
      console.error(err);
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

  // Reset Auswahl beim Monatswechsel
  useEffect(() => {
    setSelectedIds([]);
    setEditRowId(null);
  }, [monthFilter]);

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
  // THEME CLASSES
  // ---------------------------
  const bgClass = darkMode ? "bg-slate-950" : "bg-slate-100";
  const cardBg = darkMode ? "bg-slate-900" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textPrimary = darkMode ? "text-slate-50" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";

  const inputBg = darkMode
    ? "bg-slate-900 border-slate-700 text-slate-50 placeholder-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500";

  const buttonPrimary = darkMode
    ? "bg-slate-700 hover:bg-slate-600 text-slate-50"
    : "bg-slate-700 hover:bg-slate-800 text-white";

  // ---------------------------
  // LOADING
  // ---------------------------
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-screen transition-colors duration-300 ${bgClass}`}
      >
        <div
          className={`h-11 w-11 rounded-full animate-spin border-[3px] border-transparent border-t-slate-500 border-b-slate-500`}
        />
      </div>
    );
  }

  // Wir haben immer 8 Spalten (Checkbox + 7 Daten-Spalten)
  const columnCount = 8;

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgClass} px-2 py-3 sm:px-4 lg:px-6`}
    >
      <div className="max-w-screen-2xl mx-auto">
        {/* HEADER + FILTER */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex items-center gap-3">
            <h1
              className={`text-sm sm:text-base lg:text-xl font-semibold tracking-tight ${textPrimary}`}
            >
              Fahrtenbuch
            </h1>
          </div>

          <div className="flex items-center gap-2 ">
            {/* Month Filter */}
            <div
              className={`flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              <FiCalendar
                className={`text-xs ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              />
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className={`bg-transparent text-[11px] sm:text-xs focus:outline-none ${
                  darkMode ? "text-slate-200" : "text-slate-700"
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

            {/* Export to Word button */}
            <button
              onClick={exportToWord}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              <FiDownload className="text-xs" />
              <span>Word</span>
            </button>
          </div>
        </motion.header>

        {/* TABLE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`rounded-lg border ${borderColor} ${cardBg} shadow-sm overflow-hidden`}
        >
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1100px] border-collapse text-[11px] sm:text-xs">
              <thead
                className={`sticky top-0 z-10 ${
                  darkMode ? "bg-slate-900" : "bg-slate-100"
                } border-b ${borderColor}`}
              >
                <tr
                  className={`uppercase tracking-[0.07em] ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  <th className="w-8 px-3 py-2 border-r border-slate-600/10 text-center" />
                  <th className="w-10 px-2 py-2 border-r border-slate-600/10 text-center">
                    Ltd.
                  </th>
                  <th className="w-[210px] px-3 py-2 border-r border-slate-600/10 text-center">
                    Datum Beginn / Ende
                  </th>
                  <th className="w-[80px] px-3 py-2 border-r border-slate-600/10 text-center">
                    Art
                  </th>
                  <th className="w-[220px] px-3 py-2 border-r border-slate-600/10 text-center">
                    Herst.
                  </th>
                  <th className="w-[150px] px-3 py-2 border-r border-slate-600/10 text-center">
                    FZ-Ident.Nr
                  </th>
                  <th className="w-[260px] px-6 py-2 border-r border-slate-600/10 text-center">
                    Fahrstrecke
                  </th>
                  <th className="w-[260px] px-3 py-2 border-r border-slate-600/10 text-left">
                    Fahrer
                  </th>
                </tr>
              </thead>

              <tbody
                className={`${
                  darkMode ? "divide-slate-800" : "divide-slate-200"
                }`}
              >
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className={`px-3 py-8 text-center text-xs ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Keine Einträge für diesen Monat.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const id = row._id || row.tempId || `row-${index}`;
                    const isSelected = selectedIds.includes(id);
                    const isEditing = editRowId === id;

                    return (
                      <tr
                        key={`${id}-${index}`}
                        className={`border-t ${borderColor} ${
                          darkMode
                            ? isSelected
                              ? "bg-slate-800"
                              : "hover:bg-slate-900/60"
                            : isSelected
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="px-3 py-[7px] text-center align-middle border-r border-slate-600/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className={`kv-checkbox ${darkMode ? "dark" : ""}`}
                            checked={isSelected}
                            onChange={() => toggleSelectOne(id)}
                          />
                        </td>

                        {/* Lfd. */}
                        <td className="px-2 py-[7px] text-center align-middle border-r border-slate-600/10">
                          <span
                            className={`text-[11px] sm:text-xs ${textSecondary}`}
                          >
                            {index + 1}
                          </span>
                        </td>

                        {/* Datum / Uhrzeit */}
                        <td className="px-5 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                type="datetime-local"
                                value={row.startDateTime || ""}
                                onChange={(e) =>
                                  handleField(
                                    id,
                                    "startDateTime",
                                    e.target.value
                                  )
                                }
                                className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                              />
                              <input
                                type="datetime-local"
                                value={row.endDateTime || ""}
                                onChange={(e) =>
                                  handleField(id, "endDateTime", e.target.value)
                                }
                                className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                              />
                            </div>
                          ) : (
                            <span
                              className={`text-[11px] sm:text-xs block ${textPrimary}`}
                            >
                              {formatDateRange(
                                row.startDateTime,
                                row.endDateTime
                              )}
                            </span>
                          )}
                        </td>

                        {/* Art (PKW etc.) */}
                        <td className="px-2 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <select
                              value={row.vehicleType || ""}
                              onChange={(e) =>
                                handleField(id, "vehicleType", e.target.value)
                              }
                              className={`w-full rounded-none border px-1 py-1 text-[11px] sm:text-xs ${inputBg}`}
                            >
                              <option value="PKW">PKW</option>
                            </select>
                          ) : (
                            <span
                              className={`text-[11px] sm:text-xs ${textPrimary}`}
                            >
                              {row.vehicleType || "-"}
                            </span>
                          )}
                        </td>

                        {/* Herst. */}
                        <td className="px-3 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <select
                              value={row.manufacturer || ""}
                              onChange={(e) =>
                                handleField(id, "manufacturer", e.target.value)
                              }
                              className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
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
                              className={`text-[11px] sm:text-xs truncate block ${textPrimary}`}
                            >
                              {row.manufacturer || "-"}
                            </span>
                          )}
                        </td>

                        {/* FZ-Ident.Nr */}
                        <td className="px-3 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.vehicleId || ""}
                              onChange={(e) =>
                                handleField(id, "vehicleId", e.target.value)
                              }
                              className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs font-mono tracking-wide ${inputBg}`}
                              placeholder="FZ-Ident.Nr / Kennz."
                            />
                          ) : (
                            <span
                              className={`text-[11px] sm:text-xs font-mono tracking-wide ${textSecondary}`}
                            >
                              {row.vehicleId || "-"}
                            </span>
                          )}
                        </td>

                        {/* Fahrstrecke */}
                        <td className="px-8 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.routeSummary || ""}
                              onChange={(e) =>
                                handleField(id, "routeSummary", e.target.value)
                              }
                              className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                              placeholder="z.B. Jülich-Aldenhoven-Jülich + Überführungsfahrt"
                            />
                          ) : (
                            <span
                              className={`text-[11px] sm:text-xs truncate block ${textPrimary}`}
                            >
                              {row.routeSummary || "-"}
                            </span>
                          )}
                        </td>

                        {/* Fahrer + Aktionen */}
                        <td className="px-3 py-[5px] align-middle">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={row.driverInfo || ""}
                                onChange={(e) =>
                                  handleField(id, "driverInfo", e.target.value)
                                }
                                className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                                placeholder="z.B. Hussein Karim, Jülich"
                              />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => saveRow(row)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border text-slate-50 transition-colors duration-300 ${
                                    darkMode
                                      ? "border-slate-600 bg-emerald-600 hover:bg-emerald-500"
                                      : "border-emerald-600 bg-emerald-600 hover:bg-emerald-500"
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
                                      ? "border-slate-600 bg-slate-800 text-red-300 hover:bg-slate-700"
                                      : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                  }`}
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[11px] sm:text-xs truncate block ${textPrimary}`}
                              >
                                {row.driverInfo || "-"}
                              </span>

                              {isSelected && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleRowEditClick(id)}
                                    className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors duration-300 ${
                                      darkMode
                                        ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRowDeleteClick(row)}
                                    className={`h-7 w-7 flex items-center justify-center rounded-md border transition-colors duration-300 ${
                                      darkMode
                                        ? "border-slate-600 bg-slate-800 text-red-300 hover:bg-slate-700"
                                        : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    }`}
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
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
            className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium shadow-sm ${buttonPrimary}`}
          >
            <FiPlus size={16} />
            Neue Zeile
          </button>
        </div>
      </div>

      {/* Checkbox-Styles – Excel-artig, kantig */}
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
          background-color: #111827;
        }

        .kv-checkbox:checked {
          border-color: #4b5563;
          background-color: #e5e7eb;
        }

        .kv-checkbox.dark:checked {
          border-color: #9ca3af;
          background-color: #1f2937;
        }

        .kv-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 3px;
          top: 0px;
          width: 6px;
          height: 10px;
          border-right: 2px solid #374151;
          border-bottom: 2px solid #374151;
          transform: rotate(45deg);
        }

        .kv-checkbox.dark:checked::after {
          border-right-color: #f9fafb;
          border-bottom-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}
