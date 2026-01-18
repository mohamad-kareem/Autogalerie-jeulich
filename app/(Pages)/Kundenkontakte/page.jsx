"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiSearch,
  FiUser,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiPlus,
  FiX,
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useSidebar } from "@/app/(components)/SidebarContext";
export default function ContactCustomersPage() {
  const emptyForm = {
    customerName: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
    carName: "",
    vin: "",
    firstRegistration: "",
    note: "",
  };
  const { openSidebar } = useSidebar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "customerName",
    direction: "asc",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: session } = useSession();
  const router = useRouter();
  // Removed admin check - all users have full permissions

  // Initialize dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/contact-customers");
        const data = await res.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // Clear selection when page or search changes
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, search]);

  // Theme classes (same as KaufvertragListe)
  const bgClass = darkMode ? "bg-slate-900" : "bg-slate-50";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textPrimary = darkMode ? "text-white" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-300" : "text-slate-600";
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500";

  const inputBg = darkMode
    ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500";

  // Filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    let results = [...items];

    if (search) {
      const s = search.toLowerCase();
      results = results.filter((i) =>
        [i.customerName, i.phone, i.carName, i.vin, i.city]
          .join(" ")
          .toLowerCase()
          .includes(s),
      );
    }

    if (sortConfig.key) {
      results.sort((a, b) => {
        let aVal = a[sortConfig.key] || "";
        let bVal = b[sortConfig.key] || "";

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return results;
  }, [items, search, sortConfig]);

  // Pagination
  const totalPages =
    Math.ceil(filteredAndSortedItems.length / itemsPerPage) || 1;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredAndSortedItems.slice(indexOfFirst, indexOfLast);

  // Pagination items builder (same as KaufvertragListe)
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

  const pageItems = useMemo(
    () => getPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  const saveContact = async () => {
    if (!form.customerName.trim()) {
      alert("Bitte geben Sie einen Kundenname ein");
      return;
    }

    try {
      const url = editingId
        ? `/api/contact-customers/${editingId}`
        : "/api/contact-customers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const saved = await res.json();

      setItems((prev) =>
        editingId
          ? prev.map((i) => (i._id === saved._id ? saved : i))
          : [saved, ...prev],
      );

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const startEdit = (item) => {
    // Available to all users now
    if (selectedIds.length !== 1) return;
    setForm(item);
    setEditingId(item._id);
    setShowForm(true);
    setSelectedIds([]);
  };

  const startAdd = () => {
    // Available to all users now
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const deleteContact = async (id) => {
    // Available to all users now
    if (!confirm("Kontakt wirklich löschen?")) return;

    try {
      await fetch(`/api/contact-customers/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== id));
      setSelectedIds([]);
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  const handleBulkDelete = async () => {
    // Available to all users now
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length} Kontakte löschen?`)) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/contact-customers/${id}`, { method: "DELETE" }),
        ),
      );
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i._id)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Error deleting contacts:", error);
    }
  };

  const toggleSelectOne = (id) => {
    // Available to all users now
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    // Available to all users now
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map((item) => item._id));
    }
  };

  const someSelected = selectedIds.length > 0;
  const singleSelected = selectedIds.length === 1;
  const allSelected =
    selectedIds.length === currentItems.length && currentItems.length > 0;

  const resetFilters = () => {
    setSearch("");
    setCurrentPage(1);
  };

  if (loading) {
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

  // Column count - all users have checkbox column
  const columnCount = 7;

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
          <div className="flex flex-wrap items-center gap-4">
            {/* Mobile hamburger */}
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
              className={`text-base sm:text-lg lg:text-2xl font-bold transition-colors duration-300 ${textPrimary}`}
            >
              Kundenkontakte
            </h1>
          </div>
        </motion.header>

        {/* Filters + Bulk actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`mb-3 sm:mb-4 rounded-lg border transition-colors duration-300 ${borderColor} ${cardBg} p-2 sm:p-3 lg:p-3 shadow-sm`}
        >
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side: Add button + Search */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {/* Add button available to all users */}
              <button
                onClick={startAdd}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] sm:text-xs md:text-sm font-medium shadow-sm transition cursor-pointer ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-400 hover:bg-slate-500 text-white"
                }`}
              >
                <FiPlus className="text-xs sm:text-sm" /> Neu
              </button>

              <div className="relative flex-1 min-w-[160px] max-w-xs sm:max-w-sm">
                <FiSearch
                  className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm transition-colors duration-300 ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Kontakte suchen..."
                  className={`w-full rounded-md border pl-7 pr-2 py-1.5 h-8 text-[11px] sm:text-xs md:text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
                    darkMode
                      ? "focus:border-slate-400 focus:ring-slate-400"
                      : "focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Right side: Reset filter + Bulk actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-end">
              {/* Reset filter */}
              {search && (
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

              {/* Bulk actions available to all users */}
              {someSelected && (
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* separator line */}
                  <span
                    className={`hidden sm:inline-block h-6 w-px transition-colors duration-300 ${
                      darkMode ? "bg-slate-600" : "bg-slate-300"
                    }`}
                  />

                  {singleSelected && (
                    <button
                      onClick={() => {
                        const selectedContact = currentItems.find(
                          (item) => item._id === selectedIds[0],
                        );
                        if (selectedContact) startEdit(selectedContact);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                        darkMode
                          ? "text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
                          : "text-slate-600 hover:bg-slate-200 hover:border-slate-300"
                      } cursor-pointer`}
                      title="Bearbeiten"
                    >
                      <FiEdit2 className="text-base" />
                    </button>
                  )}

                  <button
                    onClick={handleBulkDelete}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                      darkMode
                        ? "text-red-400 hover:bg-slate-700 hover:border-slate-500 hover:text-red-300"
                        : "text-red-600 hover:bg-slate-200 hover:border-slate-300 hover:text-red-700"
                    } cursor-pointer`}
                    title="Löschen"
                  >
                    <FiTrash2 className="text-base" />
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
                  {/* Checkbox column for all users */}
                  <th className="w-8 px-8 py-2"></th>
                  <th
                    className={`px-3 py-3 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                    onClick={() => requestSort("customerName")}
                  >
                    <div className="flex items-center gap-1">
                      Kunde
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    className={`px-3 py-2 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                    onClick={() => requestSort("carName")}
                  >
                    <div className="flex items-center gap-1">
                      Fahrzeug
                      <FiChevronDown className="text-[10px] sm:text-xs" />
                    </div>
                  </th>
                  <th
                    className={`px-3 py-2 text-left whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Telefon
                  </th>
                  <th
                    className={`px-3 py-2 text-left whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Adresse
                  </th>

                  <th
                    className={`px-16 py-2 text-left whitespace-nowrap sm:table-cell transition-colors duration-300 ${
                      darkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    FIN
                  </th>
                  <th
                    className={`px-3 py-2 cursor-pointer whitespace-nowrap transition-colors duration-300 ${
                      darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"
                    }`}
                    onClick={() => requestSort("firstRegistration")}
                  >
                    <div className="flex items-center gap-1">
                      Erstzulassung
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
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: columnCount }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div
                            className={`h-4 w-20 rounded transition-colors duration-300 ${
                              darkMode ? "bg-slate-700" : "bg-slate-200"
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} className="px-3 py-8 text-center">
                      <div className="mx-auto max-w-md">
                        <div
                          className={`mb-1 text-sm font-medium transition-colors duration-300 ${
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {search
                            ? "Keine Kontakte gefunden"
                            : "Noch keine Kontakte"}
                        </div>
                        <p
                          className={`transition-colors duration-300 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          } text-xs`}
                        >
                          {search
                            ? "Suchbegriff anpassen"
                            : "Erstellen Sie Ihren ersten Kontakt"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((contact) => {
                    const isSelected = selectedIds.includes(contact._id);

                    return (
                      <tr
                        key={contact._id}
                        className={`transition-colors duration-300 ${
                          darkMode
                            ? `hover:bg-slate-700 ${
                                isSelected ? "bg-slate-700" : ""
                              }`
                            : `hover:bg-blue-50 ${
                                isSelected ? "bg-blue-50" : ""
                              }`
                        }`}
                      >
                        {/* Checkbox for all users */}
                        <td
                          className="px-3 py-5 align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className={`kv-checkbox ${darkMode ? "dark" : ""}`}
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelectOne(contact._id)}
                          />
                        </td>
                        <td className="px-3 py-2 max-w-[140px] sm:max-w-[180px] lg:max-w-[220px]">
                          <div
                            className={`text-[11px] sm:text-sm truncate transition-colors duration-300 ${
                              darkMode ? "text-slate-300" : "text-slate-900"
                            }`}
                          >
                            {contact.customerName || "—"}
                          </div>
                          {contact.note && (
                            <div
                              className={`text-[10px] sm:text-xs mt-1 transition-colors duration-300 truncate ${
                                darkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                              title={contact.note}
                            >
                              "{contact.note.substring(0, 50)}
                              {contact.note.length > 50 ? "..." : ""}"
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 max-w-[120px] sm:max-w-[160px] lg:max-w-[200px]">
                          <div
                            className={`text-[11px] sm:text-sm truncate transition-colors duration-300 ${
                              darkMode ? "text-slate-300" : "text-slate-900"
                            }`}
                          >
                            {contact.carName || "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {contact.phone ? (
                            <div className="flex items-center gap-2">
                              <FiPhone
                                className={`h-3 w-3 flex-shrink-0 ${
                                  darkMode ? "text-green-400" : "text-green-400"
                                }`}
                              />
                              <span
                                className={`text-[11px] sm:text-sm transition-colors duration-300 ${
                                  darkMode ? "text-slate-300" : "text-slate-700"
                                }`}
                              >
                                {contact.phone}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`text-[11px] sm:text-sm transition-colors duration-300 ${
                                darkMode ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {contact.street || contact.city ? (
                            <div className="flex items-center gap-2">
                              <FiMapPin
                                className={`h-3 w-3 flex-shrink-0 ${
                                  darkMode ? "text-red-400" : "text-red-500"
                                }`}
                              />
                              <div className="min-w-0">
                                {contact.street && (
                                  <div
                                    className={`text-[11px] sm:text-sm truncate transition-colors duration-300 ${
                                      darkMode
                                        ? "text-slate-300"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {contact.street}
                                  </div>
                                )}
                                {(contact.postalCode || contact.city) && (
                                  <div
                                    className={`text-[11px] sm:text-sm transition-colors duration-300 ${
                                      darkMode
                                        ? "text-slate-400"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {contact.postalCode} {contact.city}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span
                              className={`text-[11px] sm:text-sm transition-colors duration-300 ${
                                darkMode ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td
                          className={`px-8 py-2 text-[11px] sm:text-sm text-left whitespace-nowrap font-mono sm:table-cell transition-colors duration-300 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {contact.vin || "—"}
                        </td>
                        <td
                          className={`px-10 py-2 text-[11px] sm:text-sm whitespace-nowrap transition-colors duration-300 ${
                            darkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {contact.firstRegistration || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAndSortedItems.length > 0 && !loading && (
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
                  ),
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
                      : "border-slate-300 text-slate-500 hover:bg-slate-100"
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
                Seite {currentPage} von {totalPages}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={cancelForm}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className={`relative w-full max-w-2xl transform rounded-2xl border transition-colors duration-300 ${borderColor} ${cardBg} shadow-2xl transition-all`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - More compact */}
              <div className="flex items-center justify-between p-5">
                <div>
                  <h2
                    className={`text-lg font-semibold transition-colors duration-300 ${textPrimary}`}
                  >
                    {editingId ? "Kontakt bearbeiten" : "Neuer Kontakt"}
                  </h2>
                </div>
                <button
                  onClick={cancelForm}
                  className={`p-2 rounded-lg transition-colors duration-200 hover:scale-105 ${
                    darkMode
                      ? "hover:bg-slate-700 text-slate-400 hover:text-slate-300"
                      : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content - Compact grid layout */}
              <div className="px-5 pb-5">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Kundenname - Full width */}
                    <div className="col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Kundenname *
                      </label>
                      <input
                        value={form.customerName}
                        onChange={(e) =>
                          setForm({ ...form, customerName: e.target.value })
                        }
                        placeholder="Vor- und Nachname"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                    </div>

                    {/* Contact Info */}
                    <div className="col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Telefon
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="+49 15562993627"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    {/* Address */}
                    <div className="col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Straße
                      </label>
                      <input
                        value={form.street}
                        onChange={(e) =>
                          setForm({ ...form, street: e.target.value })
                        }
                        placeholder="Wießenstraße 6H"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        PLZ
                      </label>
                      <input
                        value={form.postalCode}
                        onChange={(e) =>
                          setForm({ ...form, postalCode: e.target.value })
                        }
                        placeholder="52428"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Stadt
                      </label>
                      <input
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        placeholder="Jülich"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    {/* Vehicle Info */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Fahrzeug
                      </label>
                      <input
                        value={form.carName}
                        onChange={(e) =>
                          setForm({ ...form, carName: e.target.value })
                        }
                        placeholder="Modell"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        FIN
                      </label>
                      <input
                        value={form.vin}
                        onChange={(e) =>
                          setForm({ ...form, vin: e.target.value })
                        }
                        placeholder="WBA123456789ABCDEF"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border font-mono transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    <div className="col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Erstzulassung
                      </label>
                      <input
                        value={form.firstRegistration}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            firstRegistration: e.target.value,
                          })
                        }
                        placeholder="TT.MM.JJJJ"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>

                    {/* Notes - Full width */}
                    <div className="col-span-2">
                      <label
                        className={`block text-sm font-medium mb-1.5 transition-colors duration-300 ${
                          darkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Notizen
                      </label>
                      <textarea
                        value={form.note}
                        onChange={(e) =>
                          setForm({ ...form, note: e.target.value })
                        }
                        placeholder="Weitere Informationen oder Bemerkungen..."
                        rows="2"
                        className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-300 ${inputBg} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Sticky at bottom */}
              <div className="sticky bottom-0 p-5 border-t border-gray-200 dark:border-gray-700 bg-inherit rounded-b-2xl">
                <div className="flex gap-3">
                  <button
                    onClick={cancelForm}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      darkMode
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={saveContact}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {editingId ? (
                        <FiSave className="h-4 w-4" />
                      ) : (
                        <FiPlus className="h-4 w-4" />
                      )}
                      {editingId ? "Speichern" : "Erstellen"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom checkbox styling - Same as KaufvertragListe */}
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
