"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCalendar,
  FiEdit2,
  FiSave,
  FiX,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiBook,
  FiMenu,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useSidebar } from "@/app/(components)/SidebarContext";

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

/* -----------------------
   Helpers
------------------------ */
function hexToEmoji(hex) {
  if (!hex) return "⚪";
  const c = String(hex).toLowerCase();
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
  if (!start || Number.isNaN(start.getTime())) return "-";

  const datePart = start.toLocaleDateString("de-DE");
  const startTime = start.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!end || Number.isNaN(end.getTime())) return `${datePart} ${startTime}`;

  const endTime = end.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${startTime} bis ${endTime}`;
}

function normalizeFin(val) {
  return (val || "")
    .toString()
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function makeCid() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// DB ISO/Z → local datetime-local string
function toLocalInputValue(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

// ✅ datetime-local (local time) → ISO UTC string for API
function localInputToISO(value) {
  if (!value) return null;
  const d = new Date(value); // interpreted as local time in the browser
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function CarLocationsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingCid, setSavingCid] = useState(null);

  const [showRotbuch, setShowRotbuch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { openSidebar } = useSidebar();

  const [rows, setRows] = useState([]);
  const [carOptions, setCarOptions] = useState([]);
  const [allCars, setAllCars] = useState([]);

  const [editCid, setEditCid] = useState(null);
  const [selectedCids, setSelectedCids] = useState([]);

  const currentMonth = String(new Date().getMonth() + 1);
  const [monthFilter, setMonthFilter] = useState(currentMonth);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    setSelectedCids([]);
    setEditCid(null);
  }, [monthFilter]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [carsRes, scheinRes, locRes] = await Promise.all([
          fetch("/api/cars"),
          fetch("/api/carschein?page=1&limit=5000"),
          fetch("/api/car-locations"),
        ]);

        const carsData = await carsRes.json();
        const scheinData = await scheinRes.json();
        const locData = await locRes.json();

        const allCarsList = Array.isArray(carsData) ? carsData : [];

        const options = Array.isArray(scheinData?.docs)
          ? scheinData.docs
              .filter((d) => !!d.rotKennzeichen)
              .map((d) => ({
                id: String(d._id || ""),
                carName: d.carName || "",
                finNumber: d.finNumber || "",
                keyColor: d.keyColor || null,
              }))
          : [];

        const mapped = Array.isArray(locData?.docs)
          ? locData.docs.map((item) => {
              const _id = String(item._id || "");
              return {
                _id,
                _cid: _id || makeCid(),
                startDateTime: item.startDateTime
                  ? toLocalInputValue(item.startDateTime)
                  : "",
                endDateTime: item.endDateTime
                  ? toLocalInputValue(item.endDateTime)
                  : "",
                vehicleType: item.vehicleType || "PKW",
                manufacturer: item.manufacturer || "",
                vehicleId: item.vehicleId || "",
                routeSummary: item.routeSummary || "",
                driverInfo: item.driverInfo || "",
              };
            })
          : [];

        if (!mountedRef.current) return;

        setAllCars(allCarsList);
        setCarOptions(options);
        setRows(mapped);
      } catch (e) {
        console.error(e);
        toast.error("Fehler beim Laden der Daten");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadData();
  }, []);

  const sortedOptions = useMemo(() => {
    return [...carOptions].sort((a, b) => a.carName.localeCompare(b.carName));
  }, [carOptions]);

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

        return { ...car, imageUrl, matchedCar: matchedCar || null };
      })
      .filter((car) => car.carName && car.carName.trim() !== "");
  }, [carOptions, allCars]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (!r.startDateTime) return String(monthFilter) === String(currentMonth);
      const d = new Date(r.startDateTime);
      if (Number.isNaN(d.getTime())) return false;
      const m = d.getMonth() + 1;
      return String(m) === String(monthFilter);
    });
  }, [rows, monthFilter, currentMonth]);

  const filteredCids = useMemo(
    () => filteredRows.map((r) => r._cid).filter(Boolean),
    [filteredRows],
  );

  const allSelected = useMemo(() => {
    if (!filteredCids.length) return false;
    const set = new Set(selectedCids);
    return filteredCids.every((cid) => set.has(cid));
  }, [filteredCids, selectedCids]);

  const someSelected = useMemo(() => {
    const set = new Set(selectedCids);
    return filteredCids.some((cid) => set.has(cid));
  }, [filteredCids, selectedCids]);

  const setSelectAll = (checked) => {
    if (!checked) {
      setSelectedCids((prev) =>
        prev.filter((cid) => !filteredCids.includes(cid)),
      );
      return;
    }
    setSelectedCids((prev) => {
      const set = new Set(prev);
      filteredCids.forEach((cid) => set.add(cid));
      return Array.from(set);
    });
  };

  const toggleSelectOne = (cid) => {
    setSelectedCids((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid],
    );
  };

  const updateRowField = (cid, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._cid !== cid) return r;

        if (field === "manufacturer") {
          const found = sortedOptions.find((o) => o.carName === value);
          const fullName = found ? found.carName : value || "";
          return {
            ...r,
            manufacturer: fullName,
            vehicleId: found ? found.finNumber : r.vehicleId,
          };
        }

        return { ...r, [field]: value };
      }),
    );
  };

  const addNewRow = () => {
    const cid = makeCid();
    const newRow = {
      _id: "",
      _cid: cid,
      startDateTime: "",
      endDateTime: "",
      vehicleType: "PKW",
      manufacturer: "",
      vehicleId: "",
      routeSummary: "",
      driverInfo: "",
    };

    // ✅ push to end (newest is last)
    setRows((prev) => [...prev, newRow]);

    setEditCid(cid);
    setSelectedCids([cid]);
  };

  const saveRow = async (row) => {
    const cid = row._cid;

    // ✅ send ISO UTC strings (fix +1 hour)
    const payload = {
      startDateTime: localInputToISO(row.startDateTime),
      endDateTime: localInputToISO(row.endDateTime),
      vehicleType: row.vehicleType || "",
      manufacturer: row.manufacturer || "",
      vehicleId: row.vehicleId || "",
      routeSummary: row.routeSummary || "",
      driverInfo: row.driverInfo || "",
    };

    try {
      setSavingCid(cid);

      const res = await fetch("/api/car-locations", {
        method: row._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row._id ? { id: row._id, ...payload } : payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Speichern fehlgeschlagen");
        return;
      }

      const savedId = String(data?._id || row._id || "");

      setRows((prev) =>
        prev.map((r) => {
          if (r._cid !== cid) return r;
          return {
            ...r,
            _id: savedId,
            startDateTime: data?.startDateTime
              ? toLocalInputValue(data.startDateTime)
              : r.startDateTime || "",
            endDateTime: data?.endDateTime
              ? toLocalInputValue(data.endDateTime)
              : r.endDateTime || "",
            vehicleType: data?.vehicleType ?? r.vehicleType,
            manufacturer: data?.manufacturer ?? r.manufacturer,
            vehicleId: data?.vehicleId ?? r.vehicleId,
            routeSummary: data?.routeSummary ?? r.routeSummary,
            driverInfo: data?.driverInfo ?? r.driverInfo,
          };
        }),
      );

      setEditCid(null);
      toast.success("Gespeichert");
    } catch (e) {
      console.error(e);
      toast.error("Speichern fehlgeschlagen");
    } finally {
      setSavingCid(null);
    }
  };

  const deleteOneRow = async (row, askConfirm = true) => {
    if (askConfirm && !confirm("Diesen Eintrag wirklich löschen?")) return;

    if (!row._id) {
      setRows((prev) => prev.filter((r) => r._cid !== row._cid));
      setSelectedCids((prev) => prev.filter((cid) => cid !== row._cid));
      if (editCid === row._cid) setEditCid(null);
      return;
    }

    try {
      const res = await fetch(
        `/api/car-locations?id=${encodeURIComponent(row._id)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Löschen fehlgeschlagen");
        return;
      }

      setRows((prev) => prev.filter((r) => r._cid !== row._cid));
      setSelectedCids((prev) => prev.filter((cid) => cid !== row._cid));
      if (editCid === row._cid) setEditCid(null);

      toast.success("Eintrag gelöscht");
    } catch (e) {
      console.error(e);
      toast.error("Löschen fehlgeschlagen");
    }
  };

  const deleteSelected = async () => {
    const set = new Set(selectedCids);
    const targets = filteredRows.filter((r) => set.has(r._cid));
    if (!targets.length) return;

    if (!confirm(`${targets.length} Einträge wirklich löschen?`)) return;

    for (const row of targets) {
      await deleteOneRow(row, false);
    }
  };

  const exportToWord = async () => {
    try {
      if (!filteredRows.length) {
        toast.error("Keine Einträge zum Exportieren.");
        return;
      }

      const tableRows = [];

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Lfd.")] }),
            new TableCell({
              children: [new Paragraph("Datum Beginn / Ende")],
            }),
            new TableCell({ children: [new Paragraph("Art")] }),
            new TableCell({ children: [new Paragraph("Herst.")] }),
            new TableCell({ children: [new Paragraph("FZ-Ident.Nr")] }),
            new TableCell({ children: [new Paragraph("Fahrstrecke")] }),
            new TableCell({ children: [new Paragraph("Fahrer")] }),
          ],
        }),
      );

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
                    formatDateRange(row.startDateTime, row.endDateTime),
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
          }),
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
              new Paragraph({ text: `Monat: ${monthFilter}` }),
              new Paragraph(""),
              table,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Fahrtenbuch_${monthFilter}.docx`);
      toast.success("Word-Datei wurde erstellt.");
    } catch (e) {
      console.error(e);
      toast.error("Export nach Word fehlgeschlagen.");
    }
  };

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

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-screen transition-colors duration-300 ${bgClass}`}
      >
        <div className="h-11 w-11 rounded-full animate-spin border-[3px] border-transparent border-t-slate-500 border-b-slate-500" />
      </div>
    );
  }

  const columnCount = 8;

  const RotbuchSidebar = () => {
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
        <div
          className={`sticky top-0 z-10 border-b p-4 ${
            darkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRotbuch(false)}
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

        <div className="h-[calc(100%-80px)] overflow-y-auto custom-scroll p-4">
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
                onClick={() => setShowRotbuch(false)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 ">
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
      <div
        className={`max-w-screen-2xl mx-auto ${
          showRotbuch && !isMobile ? "pr-[380px] lg:pr-[420px]" : ""
        }`}
      >
        <header className="mb-3 sm:mb-4 lg:mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
                darkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
              aria-label="Menü öffnen"
            >
              <FiMenu className="h-4 w-4" />
            </button>

            <h1
              className={`text-sm sm:text-base lg:text-xl font-semibold tracking-tight ${textPrimary}`}
            >
              Fahrtenbuch
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div
              className={`flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-slate-50 border-slate-300 text-slate-600"
              }`}
            >
              <FiCalendar
                className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}
              />
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className={`monthSelect bg-transparent text-[11px] sm:text-xs focus:outline-none ${
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

            <button
              onClick={() => setShowRotbuch((v) => !v)}
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

            {someSelected && (
              <button
                onClick={deleteSelected}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-[5px] text-[11px] sm:text-xs ${
                  darkMode
                    ? "bg-slate-900 border-slate-700 text-red-300 hover:border-red-500"
                    : "bg-slate-50 border-slate-300 text-red-600 hover:border-red-400"
                }`}
              >
                <FiTrash2 className="text-xs" />
                <span>Löschen ({selectedCids.length})</span>
              </button>
            )}

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

        <div
          className={`rounded-lg border ${borderColor} ${cardBg} shadow-sm overflow-hidden`}
        >
          <div
            className={`w-full overflow-x-auto custom-scroll ${
              showRotbuch ? "overflow-y-auto max-h-[calc(100vh-220px)]" : ""
            }`}
          >
            <table className="w-full border-collapse text-[11px] sm:text-xs">
              <thead
                className={`sticky top-0 z-10 ${darkMode ? "bg-slate-900" : "bg-slate-100"} border-b ${borderColor}`}
              >
                <tr
                  className={`uppercase tracking-[0.07em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  <th className="w-8 px-3 py-2 border-r border-slate-600/10 text-center">
                    <input
                      type="checkbox"
                      className={`kv-checkbox ${darkMode ? "dark" : ""}`}
                      checked={allSelected}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      aria-label="Alle auswählen"
                    />
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
                className={`${darkMode ? "divide-slate-800" : "divide-slate-200"}`}
              >
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className={`px-3 py-8 text-center text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Keine Einträge für diesen Monat.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const cid = row._cid;
                    const isSelected = selectedCids.includes(cid);
                    const isEditing = editCid === cid;

                    return (
                      <tr
                        key={cid}
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
                        <td className="px-3 py-[7px] text-center align-middle border-r border-slate-600/10">
                          <input
                            type="checkbox"
                            className={`kv-checkbox ${darkMode ? "dark" : ""}`}
                            checked={isSelected}
                            onChange={() => toggleSelectOne(cid)}
                          />
                        </td>

                        <td className="px-2 py-[7px] text-center align-middle border-r border-slate-600/10">
                          <span
                            className={`text-[11px] sm:text-xs ${textSecondary}`}
                          >
                            {index + 1}
                          </span>
                        </td>

                        <td className="px-3 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                type="datetime-local"
                                value={row.startDateTime || ""}
                                onChange={(e) =>
                                  updateRowField(
                                    cid,
                                    "startDateTime",
                                    e.target.value,
                                  )
                                }
                                className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                              />
                              <input
                                type="datetime-local"
                                value={row.endDateTime || ""}
                                onChange={(e) =>
                                  updateRowField(
                                    cid,
                                    "endDateTime",
                                    e.target.value,
                                  )
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
                                row.endDateTime,
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-2 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <select
                              value={row.vehicleType || ""}
                              onChange={(e) =>
                                updateRowField(
                                  cid,
                                  "vehicleType",
                                  e.target.value,
                                )
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

                        <td className="px-3 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <select
                              value={row.manufacturer || ""}
                              onChange={(e) =>
                                updateRowField(
                                  cid,
                                  "manufacturer",
                                  e.target.value,
                                )
                              }
                              className={`w-full rounded-none border px-2 py-1 text-[11px] sm:text-xs ${inputBg}`}
                            >
                              <option value="">– auswählen –</option>
                              {sortedOptions.map((opt) => (
                                <option key={opt.id} value={opt.carName}>
                                  {hexToEmoji(opt.keyColor)} {opt.carName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`text-[11px] sm:text-xs truncate block ${textPrimary}`}
                            >
                              {(row.manufacturer || "-")
                                .trim()
                                .split(/\s+/)[0] || "-"}
                            </span>
                          )}
                        </td>

                        <td className="px-3 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.vehicleId || ""}
                              onChange={(e) =>
                                updateRowField(cid, "vehicleId", e.target.value)
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

                        <td className="px-4 text-center py-[5px] align-middle border-r border-slate-600/10">
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.routeSummary || ""}
                              onChange={(e) =>
                                updateRowField(
                                  cid,
                                  "routeSummary",
                                  e.target.value,
                                )
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

                        <td className="px-3 py-[5px] align-middle">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={row.driverInfo || ""}
                                onChange={(e) =>
                                  updateRowField(
                                    cid,
                                    "driverInfo",
                                    e.target.value,
                                  )
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
                                  aria-label="Speichern"
                                >
                                  <FiSave
                                    size={14}
                                    className={
                                      savingCid === cid ? "animate-pulse" : ""
                                    }
                                  />
                                </button>

                                <button
                                  onClick={() => setEditCid(null)}
                                  className={`h-7 w-7 flex items-center justify-center rounded-md border ${
                                    darkMode
                                      ? "border-slate-600 bg-slate-800 text-red-300 hover:bg-slate-700"
                                      : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                  }`}
                                  aria-label="Abbrechen"
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
                                    onClick={() => setEditCid(cid)}
                                    className={`h-7 w-7 flex items-center justify-center rounded-md border ${
                                      darkMode
                                        ? "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                                    aria-label="Bearbeiten"
                                  >
                                    <FiEdit2 size={14} />
                                  </button>

                                  <button
                                    onClick={() => deleteOneRow(row)}
                                    className={`h-7 w-7 flex items-center justify-center rounded-md border ${
                                      darkMode
                                        ? "border-slate-600 bg-slate-800 text-red-300 hover:bg-slate-700"
                                        : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    }`}
                                    aria-label="Löschen"
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

      {showRotbuch && <RotbuchSidebar />}

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
        :global(.monthSelect) {
          color-scheme: ${darkMode ? "dark" : "light"};
        }

        :global(.monthSelect option) {
          background-color: ${darkMode
            ? "#0f172a"
            : "#ffffff"}; /* slate-900 / white */
          color: ${darkMode
            ? "#e2e8f0"
            : "#0f172a"}; /* slate-200 / slate-900 */
        }

        :global(.monthSelect optgroup) {
          background-color: ${darkMode ? "#0f172a" : "#ffffff"};
          color: ${darkMode ? "#e2e8f0" : "#0f172a"};
        }
      `}</style>
    </div>
  );
}
