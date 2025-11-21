"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiSearch,
  FiUser,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiChevronDown,
  FiArchive,
  FiStar,
  FiEyeOff,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { ArrowUturnLeftIcon, NoSymbolIcon } from "@heroicons/react/24/solid";

// Currency formatter (same style as Liste page)
const currencyFmt = (v, currency = "EUR") => {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(v ?? 0));
  } catch {
    return `${currency} ${Number(v ?? 0).toFixed(2)}`;
  }
};

// Date formatter (same as Liste page)
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("de-DE") : "-";

// Pagination items builder (same as Liste page)
const getPageItems = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push("…");
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  for (let p = start; p <= end; p++) items.push(p);
  if (page < pages - 2) items.push("…");
  items.push(pages);
  return items;
};

export default function ArchivPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [darkMode, setDarkMode] = useState(false);

  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ month: "" });
  const [sortConfig, setSortConfig] = useState({
    key: "invoiceDate",
    direction: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const contractsPerPage = 20;

  // selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

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

  const monthOptions = [
    { value: "", label: "Alle Monate" },
    { value: "1", label: "Januar" },
    { value: "2", label: "Februar" },
    { value: "3", label: "März" },
    { value: "4", label: "April" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
  ];

  // Fetch archived contracts
  useEffect(() => {
    const fetchContracts = async () => {
      if (status !== "authenticated") return;

      try {
        const res = await fetch("/api/kaufvertrag?archived=true");
        let data = await res.json();

        const email = session?.user?.email;

        if (email === "admin@gmail.com") {
          // Admin: see all
        } else if (
          email === "autogalerie-juelich@hotmail.com" ||
          email === "autogalerie-juelich@web.de"
        ) {
          data = data.filter((c) => c.issuer === "alawie");
        } else if (email === "autogalerie.juelich@web.de") {
          data = data.filter((c) => c.issuer === "karim");
        } else {
          data = [];
        }

        setContracts(data);
        setFilteredContracts(data);
      } catch (error) {
        console.error("Error fetching archived contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [status, session]);

  // Filter + sort whenever inputs change
  useEffect(() => {
    let results = [...contracts];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      results = results.filter((contract) =>
        Object.values(contract).some((value) =>
          value?.toString().toLowerCase().includes(lower)
        )
      );
    }

    // Month (current year)
    if (filters.month) {
      results = results.filter((contract) => {
        if (!contract.invoiceDate) return false;
        const d = new Date(contract.invoiceDate);
        return (
          d.getMonth() + 1 === parseInt(filters.month, 10) &&
          d.getFullYear() === new Date().getFullYear()
        );
      });
    }

    // Sort
    if (sortConfig.key) {
      results.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "invoiceDate") {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }

        if (sortConfig.key === "total" || sortConfig.key === "mileage") {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredContracts(results);
    setCurrentPage(1);
  }, [contracts, searchTerm, filters, sortConfig]);

  // clear selection on page/filter change
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, searchTerm, filters]);

  // update helper
  const updateContract = async (id, updates) => {
    const res = await fetch(`/api/kaufvertrag/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Update fehlgeschlagen");
    const updated = await res.json();
    setContracts((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  // bulk actions
  const handleBulkUnarchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm("Ausgewählte Verträge wiederherstellen?")) return;
    try {
      await Promise.all(
        selectedIds.map((id) => updateContract(id, { archived: false }))
      );
      setContracts((prev) => prev.filter((c) => !selectedIds.includes(c._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Fehler beim Wiederherstellen:", err);
    }
  };

  const handleBulkStar = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => updateContract(id, { toggleStar: true }))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Fehler beim Markieren:", err);
    }
  };

  const handleBulkIgnore = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) => updateContract(id, { toggleIgnore: true }))
      );
      setSelectedIds([]);
    } catch (err) {
      console.error("Fehler beim Ignorieren:", err);
    }
  };

  // selection helpers
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const someSelected = selectedIds.length > 0;

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({ month: "" });
  };

  // Pagination
  const totalPages =
    Math.ceil(filteredContracts.length / contractsPerPage) || 1;
  const indexOfLast = currentPage * contractsPerPage;
  const indexOfFirst = indexOfLast - contractsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirst, indexOfLast);

  const pageItems = useMemo(
    () => getPageItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // Theme classes
  const bgClass = darkMode ? "bg-slate-900" : "bg-slate-50";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  const buttonPrimary = darkMode
    ? "bg-slate-700 hover:bg-slate-600 text-white"
    : "bg-slate-600 hover:bg-slate-700 text-white";

  const buttonSecondary = darkMode
    ? "bg-slate-700 hover:bg-slate-600 text-white"
    : "bg-slate-200 hover:bg-slate-300 text-slate-700";

  const inputBg = darkMode
    ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500";

  // 1 (checkbox) + 7 data columns
  const columnCount = 8;

  if (status === "loading" || loading) {
    return (
      <div
        className={`flex justify-center items-center h-screen transition-colors duration-300 ${bgClass}`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 transition-colors duration-300 ${
            darkMode ? "border-slate-400" : "border-slate-600"
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgClass} px-2 py-3 sm:px-4 sm:py-3 lg:px-6`}
    >
      <div className="w-full max-w-screen-2xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-2 sm:mb-3 lg:mb-4"
        >
          <div className="flex flex-wrap items-center  gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors duration-300 ${
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
            <h1
              className={`text-base sm:text-lg lg:text-2xl font-bold transition-colors duration-300 ${textPrimary}`}
            >
              Archiv
              <span
                className={`ml-2 text-xs sm:text-sm font-normal transition-colors duration-300 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                ({filteredContracts.length})
              </span>
            </h1>
          </div>
        </motion.header>

        {/* Filters + Bulk actions (same row like Liste) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`mb-3 sm:mb-4 rounded-lg border transition-colors duration-300 ${borderColor} ${cardBg} p-2 sm:p-3 lg:p-3 shadow-sm`}
        >
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: search */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {/* Zur Liste button BESIDE search */}
              <button
                onClick={() => router.push("/kaufvertrag/liste")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-white shadow-sm transition ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-slate-400 hover:bg-slate-500"
                }`}
              >
                verträge
              </button>
              {/* Search */}
              <div className="relative flex-1 min-w-[160px] max-w-xs sm:max-w-sm">
                <FiSearch
                  className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Verträge suchen..."
                  className={`w-full rounded-md border pl-7 pr-2 py-1.5 h-8 text-[11px] sm:text-xs md:text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
                    darkMode
                      ? "focus:border-slate-400 focus:ring-slate-400"
                      : "focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Right: filters + bulk actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-end">
              {/* Filters group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Month filter */}
                <div
                  className={`flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] sm:text-xs transition-colors duration-300 ${
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
                    className={`bg-transparent text-[11px] sm:text-xs focus:outline-none transition-colors duration-300 ${
                      darkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                    value={filters.month}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        month: e.target.value,
                      }))
                    }
                  >
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional info chip removed as requested */}

                {(searchTerm || filters.month) && (
                  <button
                    onClick={resetFilters}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition ${
                      darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    <FiX className="text-xs" /> Zurücksetzen
                  </button>
                )}
              </div>

              {/* Bulk actions – Gmail-style icons beside filters */}
              {someSelected && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <span
                    className={`hidden sm:inline-block h-6 w-px transition-colors duration-300 ${
                      darkMode ? "bg-slate-600" : "bg-slate-300"
                    }`}
                  />
                  {/* Unarchive (instead of archive) */}
                  <button
                    onClick={handleBulkUnarchive}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                      darkMode
                        ? "text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                        : "text-slate-600 hover:bg-slate-200 hover:border-slate-300"
                    } cursor-pointer`}
                    title="Wiederherstellen"
                  >
                    <ArrowUturnLeftIcon className="w-5 h-4" />
                  </button>
                  {/* Star */}
                  <button
                    onClick={handleBulkStar}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                      darkMode
                        ? "text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                        : "text-slate-600 hover:bg-slate-200 hover:border-slate-300"
                    } cursor-pointer`}
                    title="Markieren"
                  >
                    <FiStar className="text-base" />
                  </button>
                  {/* Ignore */}
                  <button
                    onClick={handleBulkIgnore}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                      darkMode
                        ? "text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                        : "text-slate-600 hover:bg-slate-200 hover:border-slate-300"
                    } cursor-pointer`}
                    title="Ignorieren"
                  >
                    <FiEyeOff className="text-base" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Table wrapper */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`overflow-hidden rounded-lg border transition-colors duration-300 ${borderColor} ${cardBg} shadow-sm`}
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
                  {/* checkbox column like Liste (no select all) */}
                  <th className="w-8 px-3 py-2" />
                  <th
                    onClick={() => requestSort("invoiceDate")}
                    className={`px-3 sm:px-4 py-3 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Datum
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("buyerName")}
                    className={`px-3 sm:px-4 py-3 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Käufer
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("carType")}
                    className={`px-3 sm:px-4 py-3 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Fahrzeug
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    className={`px-16 py-2 text-left whitespace-nowrap hidden sm:table-cell transition-colors duration-300 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    FIN
                  </th>
                  <th
                    onClick={() => requestSort("mileage")}
                    className={`px-3 sm:px-4 py-3 cursor-pointer whitespace-nowrap hidden md:table-cell transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Kilometer
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("invoiceNumber")}
                    className={`px-3 sm:px-4 py-3 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Re-Nr.
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("total")}
                    className={`px-3 sm:px-4 py-3 cursor-pointer whitespace-nowrap text-right transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Betrag
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody
                className={`divide-y transition-colors duration-300 ${
                  darkMode
                    ? "divide-slate-700 bg-slate-800"
                    : "divide-slate-200 bg-white"
                }`}
              >
                {currentContracts.length > 0 ? (
                  currentContracts.map((c) => {
                    const isSelected = selectedIds.includes(c._id);

                    return (
                      <tr
                        key={c._id}
                        className={`cursor-pointer transition-colors duration-300 ${
                          darkMode
                            ? `hover:bg-slate-700 ${
                                isSelected ? "bg-slate-700" : ""
                              }`
                            : `hover:bg-blue-50 ${
                                isSelected ? "bg-blue-50" : ""
                              }`
                        }`}
                        onClick={() => router.push(`/kaufvertrag/${c._id}`)}
                      >
                        {/* checkbox like Liste */}
                        <td
                          className="px-3 py-2 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className={`kv-checkbox ${darkMode ? "dark" : ""}`}
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelectOne(c._id)}
                          />
                        </td>

                        <td
                          className={`px-3 sm:px-4 py-5 text-[11px] sm:text-sm whitespace-nowrap transition-colors duration-300 ${
                            darkMode ? "text-slate-300" : "text-slate-900"
                          }`}
                        >
                          {formatDate(c.invoiceDate)}
                        </td>
                        <td
                          className={`px-3 sm:px-4 py-3 text-[11px] sm:text-sm whitespace-nowrap max-w-[140px] sm:max-w-[200px] lg:max-w-[240px] transition-colors duration-300 ${
                            darkMode ? "text-slate-300" : "text-slate-900"
                          }`}
                        >
                          <span className="truncate block">
                            {c.buyerName || "-"}
                          </span>
                        </td>
                        <td
                          className={`px-3 sm:px-4 py-3 text-[11px] sm:text-sm whitespace-nowrap max-w-[160px] sm:max-w-[220px] lg:max-w-[260px] transition-colors duration-300 ${
                            darkMode ? "text-slate-300" : "text-slate-900"
                          }`}
                        >
                          <span className="truncate block">
                            {c.carType || "-"}
                          </span>
                        </td>
                        <td
                          className={`px-3 sm:px-4 py-3 text-[11px] sm:text-sm whitespace-nowrap font-mono hidden sm:table-cell transition-colors duration-300 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {c.vin || "-"}
                        </td>
                        <td
                          className={`px-3 sm:px-6 py-3 text-[11px] sm:text-sm whitespace-nowrap hidden md:table-cell transition-colors duration-300 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {c.mileage ? c.mileage.toLocaleString("de-DE") : "-"}
                        </td>
                        <td
                          className={`px-3 sm:px-4 py-3 text-[11px] sm:text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                            c.ignored
                              ? "text-red-500"
                              : c.starred
                              ? "text-blue-500"
                              : darkMode
                              ? "text-slate-300"
                              : "text-slate-900"
                          }`}
                        >
                          {c.invoiceNumber || "-"}
                        </td>
                        <td
                          className={`px-3 sm:px-4 py-3 text-[11px] sm:text-sm whitespace-nowrap text-right transition-colors duration-300 ${
                            darkMode ? "text-slate-300" : "text-slate-900"
                          }`}
                        >
                          {currencyFmt(c.total, "EUR")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={columnCount}
                      className={`px-3 sm:px-4 py-8 text-center text-xs sm:text-sm transition-colors duration-300 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Keine archivierten Verträge gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination – same style as Liste page */}
          {filteredContracts.length > 0 && (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-xs border-t transition-colors duration-300 ${
                darkMode
                  ? "border-slate-700 text-slate-400"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`rounded border p-1 disabled:opacity-50 transition-colors duration-300 ${
                    darkMode
                      ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label="Erste Seite"
                >
                  <FiChevronLeft size={14} />
                </button>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className={`rounded border p-1 disabled:opacity-50 transition-colors duration-300 ${
                    darkMode
                      ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label="Vorherige Seite"
                >
                  <FiChevronLeft size={14} />
                </button>

                {pageItems.map((item, idx) =>
                  item === "…" ? (
                    <span
                      key={`e-${idx}`}
                      className={`px-1 select-none text-[11px] sm:text-xs transition-colors duration-300 ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`rounded w-6 h-6 text-[11px] sm:text-xs border flex items-center justify-center transition-colors duration-300 ${
                        currentPage === item
                          ? darkMode
                            ? "border-slate-400 text-slate-200 font-medium"
                            : "border-blue-600 text-blue-700 font-medium"
                          : darkMode
                          ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                          : "border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`rounded border p-1 disabled:opacity-50 transition-colors duration-300 ${
                    darkMode
                      ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label="Nächste Seite"
                >
                  <FiChevronRight size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`rounded border p-1 disabled:opacity-50 transition-colors duration-300 ${
                    darkMode
                      ? "border-slate-600 text-slate-400 hover:bg-slate-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label="Letzte Seite"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>

              <div
                className={`transition-colors duration-300 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                } text-[11px] sm:text-xs`}
              >
                Seite {currentPage} von {totalPages} •{" "}
                {filteredContracts.length} Einträge
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Custom checkbox styling (same as Liste) */}
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
