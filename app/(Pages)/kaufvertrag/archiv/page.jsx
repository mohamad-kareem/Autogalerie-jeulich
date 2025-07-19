"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { FiArrowLeft } from "react-icons/fi";
import { useSession } from "next-auth/react";

export default function ArchivPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

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
  const contractsPerPage = 10;

  useEffect(() => {
    const fetchContracts = async () => {
      if (status !== "authenticated") return;

      try {
        const res = await fetch("/api/kaufvertrag?archived=true");
        let data = await res.json();

        const email = session?.user?.email;

        if (email === "admin@gmail.com") {
          // Admin sees all contracts
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
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [status, session]);

  useEffect(() => {
    let results = [...contracts];

    if (searchTerm) {
      results = results.filter((contract) =>
        Object.values(contract).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filters.month) {
      results = results.filter((contract) => {
        const date = new Date(contract.invoiceDate);
        return (
          date.getMonth() + 1 === parseInt(filters.month) &&
          date.getFullYear() === new Date().getFullYear()
        );
      });
    }

    if (sortConfig.key) {
      results.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredContracts(results);
    setCurrentPage(1);
  }, [contracts, searchTerm, filters, sortConfig]);

  const handleUnarchive = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Diesen Vertrag wiederherstellen?")) return;

    try {
      const res = await fetch(`/api/kaufvertrag/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });

      if (!res.ok) throw new Error("Fehler beim Wiederherstellen");

      setContracts((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Fehler beim Wiederherstellen:", err);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("de-DE") : "-");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);

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

  const currentContracts = filteredContracts.slice(
    (currentPage - 1) * contractsPerPage,
    currentPage * contractsPerPage
  );
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

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

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-gray-500">Lade Verträge...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/kaufvertrag/liste")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Archivierte Kaufverträge
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            {filteredContracts.length} Einträge
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Käufer, Fahrzeug, FIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monat
              </label>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, month: e.target.value }))
                }
                className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                disabled={!searchTerm && !filters.month}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || filters.month) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {searchTerm && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  Suche: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
              {filters.month && (
                <span className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  Monat:{" "}
                  {monthOptions.find((m) => m.value === filters.month)?.label}
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, month: "" }))
                    }
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { key: "invoiceDate", label: "Datum" },
                    { key: "buyerName", label: "Käufer" },
                    { key: "carType", label: "Fahrzeug" },
                    { key: "vin", label: "FIN" },
                    { key: "mileage", label: "Kilometer" },
                    { key: "invoiceNumber", label: "Rechnungsnr." },
                    { key: "total", label: "Betrag" },
                    { key: "actions", label: "" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => key !== "actions" && requestSort(key)}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        key !== "actions"
                          ? "cursor-pointer hover:bg-gray-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center">
                        {label}
                        {key !== "actions" && (
                          <ChevronUpDownIcon className="ml-1 h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentContracts.length > 0 ? (
                  currentContracts.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/kaufvertrag/${c._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(c.invoiceDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {c.buyerName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {c.carType || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {c.vin || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {c.mileage?.toLocaleString("de-DE") || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {c.invoiceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(c.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => handleUnarchive(c._id, e)}
                          title="Wiederherstellen"
                          className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                        >
                          <ArrowUturnLeftIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Keine archivierten Verträge gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Zeige{" "}
              <span className="font-medium">
                {(currentPage - 1) * contractsPerPage + 1}
              </span>{" "}
              bis{" "}
              <span className="font-medium">
                {Math.min(
                  currentPage * contractsPerPage,
                  filteredContracts.length
                )}
              </span>{" "}
              von{" "}
              <span className="font-medium">{filteredContracts.length}</span>{" "}
              Einträgen
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ‹
              </button>
              <div className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50">
                {currentPage}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
