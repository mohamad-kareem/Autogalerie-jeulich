"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function KaufvertragListe() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    month: "",
    seller: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "invoiceDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const contractsPerPage = 10;
  const router = useRouter();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/kaufvertrag");
        const data = await res.json();
        setContracts(data);
        setFilteredContracts(data);
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let results = [...contracts];

    // Search
    if (searchTerm) {
      results = results.filter((contract) =>
        Object.values(contract).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Month filter
    if (filters.month) {
      results = results.filter((contract) => {
        const contractDate = new Date(contract.invoiceDate);
        return (
          contractDate.getMonth() + 1 === parseInt(filters.month) &&
          contractDate.getFullYear() === new Date().getFullYear()
        );
      });
    }

    // Seller filter
    if (filters.seller) {
      results = results.filter(
        (contract) => contract.issuer === filters.seller
      );
    }

    // Sorting
    if (sortConfig.key) {
      results.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredContracts(results);
    setCurrentPage(1);
  }, [contracts, searchTerm, filters, sortConfig]);

  // Sort handler
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = filteredContracts.slice(
    indexOfFirstContract,
    indexOfLastContract
  );
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  // Formatting functions
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Get unique sellers for filter
  const uniqueSellers = [
    ...new Set(contracts.map((contract) => contract.issuer)),
  ].filter(Boolean);

  // Month options for filter
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

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      month: "",
      seller: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Kaufvertragsübersicht
          </h1>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Suche
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Suche nach Käufer, Fahrzeug, FIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Month Filter */}
            <div>
              <label
                htmlFor="month"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Monat
              </label>
              <select
                id="month"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Seller Filter */}
            <div>
              <label
                htmlFor="seller"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verkäufer
              </label>
              <select
                id="seller"
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.seller}
                onChange={(e) =>
                  setFilters({ ...filters, seller: e.target.value })
                }
              >
                <option value="">Alle Verkäufer</option>
                {uniqueSellers.map((seller) => (
                  <option key={seller} value={seller}>
                    {seller}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters */}
          {(searchTerm || filters.month || filters.seller) && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Aktive Filter:</span>

              {searchTerm && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Suche: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.month && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Monat:{" "}
                  {monthOptions.find((m) => m.value === filters.month)?.label}
                  <button
                    onClick={() => setFilters({ ...filters, month: "" })}
                    className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.seller && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Verkäufer: {filters.seller}
                  <button
                    onClick={() => setFilters({ ...filters, seller: "" })}
                    className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Alle Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("invoiceDate")}
                  >
                    <div className="flex items-center">
                      Datum
                      <ChevronUpDownIcon className="ml-1 h-3 w-3 text-gray-400" />
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("buyerName")}
                  >
                    <div className="flex items-center">
                      Käufer
                      <ChevronUpDownIcon className="ml-1 h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("carType")}
                  >
                    <div className="flex items-center">
                      Fahrzeug
                      <ChevronUpDownIcon className="ml-1 h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    FIN
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("mileage")}
                  >
                    <div className="flex items-center">
                      Kilometer
                      <ChevronUpDownIcon className="ml-1 h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("invoiceNumber")}
                  >
                    <div className="flex items-center">
                      Rechnungsnr.
                      <ChevronUpDownIcon className="ml-1 h-3 w-3 text-gray-400" />
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort("total")}
                  >
                    <div className="flex items-center">
                      Betrag
                      <ChevronUpDownIcon className="ml-1 h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentContracts.length > 0 ? (
                  currentContracts.map((contract) => (
                    <tr
                      key={contract._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/kaufvertrag/${contract._id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contract.invoiceDate)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.buyerName || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contract.carType || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {contract.vin || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contract.mileage
                          ? `${contract.mileage.toLocaleString("de-DE")} `
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contract.invoiceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(contract.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Keine Kaufverträge gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Zurück
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Weiter
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Seite <span className="font-medium">{currentPage}</span> von{" "}
                    <span className="font-medium">{totalPages}</span> -{" "}
                    <span className="font-medium">
                      {filteredContracts.length}
                    </span>{" "}
                    Einträge
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Erste Seite</span>
                      &laquo;
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Zurück</span>
                      &lsaquo;
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Weiter</span>
                      &rsaquo;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Letzte Seite</span>
                      &raquo;
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
