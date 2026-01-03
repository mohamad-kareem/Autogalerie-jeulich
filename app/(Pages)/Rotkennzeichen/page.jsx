"use client";

import { useEffect, useState, useMemo } from "react";
import {
  FiCalendar,
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiBook,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Image from "next/image";

// For Word export
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

// Helper functions
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
  const [showRotbuch, setShowRotbuch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [rows, setRows] = useState([]);
  const [carOptions, setCarOptions] = useState([]);
  const [editRowId, setEditRowId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [allCars, setAllCars] = useState([]);

  const currentMonth = String(new Date().getMonth() + 1);
  const [monthFilter, setMonthFilter] = useState(currentMonth);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Theme initialization
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = saved === "dark" || (!saved && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Load data
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load all cars for images
        const carsRes = await fetch("/api/cars");
        const carsData = await carsRes.json();
        const allCarsList = Array.isArray(carsData) ? carsData : [];

        // Load Rotschein cars
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

        // Load Fahrtenbuch entries
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

        setAllCars(allCarsList);
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

  // Normalize FIN for matching
  const normalizeFin = (val) =>
    (val || "")
      .toString()
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();

  // Get red cars with their images
  const redCarsWithImages = useMemo(() => {
    return carOptions
      .map((car) => {
        const fin = normalizeFin(car.finNumber);
        const matchedCar = allCars.find((c) => {
          const carFin = normalizeFin(c.finNumber || c.vin || c.vinNumber);
          return carFin && carFin === fin;
        });

        let imageUrl = null;
        if (
          matchedCar &&
          Array.isArray(matchedCar.images) &&
          matchedCar.images.length > 0
        ) {
          const first = matchedCar.images[0];
          imageUrl = first?.ref || first?.url || null;
        }

        return {
          ...car,
          imageUrl,
          matchedCar: matchedCar || null,
        };
      })
      .filter((car) => car.carName && car.carName.trim() !== "");
  }, [carOptions, allCars]);

  const sortedOptions = useMemo(
    () => [...carOptions].sort((a, b) => a.carName.localeCompare(b.carName)),
    [carOptions]
  );

  // Filter rows by month
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

  // Export to Word
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

  // Table row handlers
  const handleField = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        const rowId = r._id || r.tempId;
        if (rowId !== id) return r;

        if (field === "manufacturer") {
          const found = sortedOptions.find((o) => o.carName === value);
          const fullName = found ? found.carName : value || "";
          const firstWord = fullName.trim().split(/\s+/)[0] || fullName;

          return {
            ...r,
            manufacturer: firstWord,
            vehicleId: found ? found.finNumber : "",
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

  // Reset selection when month changes
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

  // Theme classes
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

  // Loading state
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

  const columnCount = 8;

  // Rotbuch sidebar component - SIMPLIFIED
  const RotbuchSidebar = () => {
    const handleClose = () => setShowRotbuch(false);

    return (
      <div
        className={`fixed top-0 right-0 h-full z-50 ${
          isMobile ? "w-full" : "w-[380px] lg:w-[420px]"
        } shadow-2xl border-l ${
          darkMode
            ? "bg-slate-900 border-slate-700"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header with clear X button */}
        <div
          className={`sticky top-0 z-10 border-b p-4 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center ">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className={`p-1 rounded-full ${
                  darkMode
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label="Schließen"
              >
                <FiX size={20} />
              </button>
              <div>
                <h2
                  className={`text-sm font-semibold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Rotbuch
                </h2>
                <p
                  className={`text-xs ${
                    darkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {redCarsWithImages.length} Fahrzeuge mit Rotkennzeichen
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-y-auto p-4">
          {redCarsWithImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FiBook
                className={`w-16 h-16 mb-4 ${
                  darkMode ? "text-slate-700" : "text-slate-300"
                }`}
              />
              <p
                className={`text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Keine Fahrzeuge mit Rotkennzeichen gefunden
              </p>
              <button
                onClick={handleClose}
                className={`mt-4 px-4 py-2 rounded-md text-sm ${
                  darkMode
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Schließen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {redCarsWithImages.map((car) => (
                <div
                  key={car.id}
                  className={`rounded-lg border overflow-hidden ${
                    darkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Image Container */}
                    <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-slate-200">
                      {car.imageUrl ? (
                        <Image
                          src={car.imageUrl}
                          alt={car.carName}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="(max-width: 768px) 96px, 96px"
                        />
                      ) : (
                        <div
                          className={`h-full w-full flex items-center justify-center ${
                            darkMode ? "bg-slate-700" : "bg-slate-200"
                          }`}
                        >
                          <FiBook
                            className={`w-8 h-8 ${
                              darkMode ? "text-slate-600" : "text-slate-400"
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Car Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          darkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {car.carName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            darkMode
                              ? "bg-slate-700 text-slate-300"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          FIN: {car.finNumber || "–"}
                        </span>
                        <span className="text-xs">
                          {hexToEmoji(car.keyColor)}
                        </span>
                      </div>
                      {car.matchedCar && (
                        <p
                          className={`text-xs truncate mt-1 ${
                            darkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {car.matchedCar.make || ""}{" "}
                          {car.matchedCar.model || ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative min-h-screen ${bgClass} px-2 py-3 sm:px-4 lg:px-6`}
    >
      {/* Main container */}
      <div
        className={`max-w-screen-2xl mx-auto ${
          showRotbuch && !isMobile ? "pr-[380px] lg:pr-[420px]" : ""
        }`}
      >
        {/* HEADER + FILTER */}
        <header className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row sm:items-center  gap-3">
          <div className="flex items-center gap-3">
            <h1
              className={`text-sm sm:text-base lg:text-xl font-semibold tracking-tight ${textPrimary}`}
            >
              Fahrtenbuch
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Month Filter */}
            <div
              className={`flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs ${
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

            {/* Rotbuch button */}
            <button
              onClick={() => setShowRotbuch(!showRotbuch)}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs ${
                showRotbuch
                  ? darkMode
                    ? "bg-red-900/50 border-red-700 text-red-300"
                    : "bg-red-100 border-red-300 text-red-700"
                  : darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-300 hover:border-red-500 hover:text-red-300"
                  : "bg-slate-50 border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-600"
              }`}
            >
              <FiBook className="text-xs" />
              <span>Rotbuch</span>
            </button>

            {/* Export to Word button */}
            <button
              onClick={exportToWord}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              <FiDownload className="text-xs" />
              <span>Word</span>
            </button>
          </div>
        </header>

        {/* TABLE CARD */}
        <div
          className={`rounded-lg border ${borderColor} ${cardBg} shadow-sm overflow-hidden`}
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[11px] sm:text-xs">
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
                  <th className="w-8 px-3 py-2 border-r border-slate-600/10 text-center">
                    ✓
                  </th>
                  <th className="w-10 px-2 py-2 border-r border-slate-600/10 text-center">
                    Nr.
                  </th>
                  <th className="min-w-[180px] px-3 py-2 border-r border-slate-600/10 text-center">
                    Datum/Uhrzeit
                  </th>
                  <th className="w-[80px] px-3 py-2 border-r border-slate-600/10 text-center">
                    Art
                  </th>
                  <th className="min-w-[140px] px-3 py-2 border-r border-slate-600/10 text-center">
                    Herst.
                  </th>
                  <th className="min-w-[120px] px-3 py-2 border-r border-slate-600/10 text-center">
                    FZ-Nr
                  </th>
                  <th className="min-w-[180px] px-6 py-2 border-r border-slate-600/10 text-center">
                    Fahrstrecke
                  </th>
                  <th className="min-w-[180px] px-3 py-2 border-r border-slate-600/10 text-left">
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
                        <td className="px-3 text-center py-[5px] align-middle border-r border-slate-600/10">
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
                              className={`text-[11px] sm:text-xs block ${textPrimary} break-words`}
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
                              placeholder="FZ-Nr"
                            />
                          ) : (
                            <span
                              className={`text-[11px] sm:text-xs font-mono tracking-wide ${textSecondary} break-all`}
                            >
                              {row.vehicleId || "-"}
                            </span>
                          )}
                        </td>

                        {/* Fahrstrecke */}
                        <td className="px-4 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.routeSummary || ""}
                              onChange={(e) =>
                                handleField(id, "routeSummary", e.target.value)
                              }
                              className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                              placeholder="Fahrstrecke"
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
                                placeholder="Fahrer"
                              />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => saveRow(row)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border text-slate-50 ${
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
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border ${
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
                                    className={`h-7 w-7 flex items-center justify-center rounded-md border ${
                                      darkMode
                                        ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRowDeleteClick(row)}
                                    className={`h-7 w-7 flex items-center justify-center rounded-md border ${
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
        </div>

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

      {/* ROTBUCH SIDEBAR - ALWAYS ON TOP */}
      {showRotbuch && <RotbuchSidebar />}

      {/* Checkbox Styles */}
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
