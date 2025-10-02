"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { FiArrowLeft } from "react-icons/fi";
import { NoSymbolIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

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
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-950 to-red-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-red-950 text-white">
      {/* Header */}
      <motion.div
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-40 px-4 sm:px-6 py-2"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold">
            Archiv
            <span className="ml-2 text-sm font-normal text-gray-300">
              ({filteredContracts.length})
            </span>
          </h1>
        </div>
      </motion.div>

      {/* Content */}
      <main className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1600px] mx-auto px-1 sm:px-0 py-2">
        {/* Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className=" mb-4"
        >
          <div className="flex flex-row items-center gap-2 px-0 py-1 text-xs">
            {/* Liste button */}
            <button
              onClick={() => router.push("/kaufvertrag/liste")}
              className="p-2 rounded hover:bg-red-600/20 text-gray-400 hover:text-red-400"
              title="Zur Liste-Seite"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>

            {/* Search (fixed width like desktop) */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-[140px] sm:w-[160px] pl-7 pr-2 py-2 rounded-md bg-transparent text-gray-200 placeholder-gray-400 border border-gray-700 focus:outline-none focus:border-red-500"
                placeholder="Suche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Month filter */}
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters({ ...filters, month: e.target.value })
              }
              className="px-2 py-2 rounded-md bg-gray-800 text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-500 w-[120px] sm:w-auto"
            >
              {monthOptions.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  className="bg-gray-900 text-white"
                >
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active filters */}
          {(searchTerm || filters.month) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="px-2 py-1 bg-red-900/40 text-xs rounded-md flex items-center gap-1">
                  Suche: {searchTerm}
                  <button onClick={() => setSearchTerm("")}>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.month && (
                <span className="px-2 py-1 bg-red-900/40 text-xs rounded-md flex items-center gap-1">
                  Monat:{" "}
                  {monthOptions.find((m) => m.value === filters.month)?.label}
                  <button onClick={() => setFilters({ ...filters, month: "" })}>
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-red-400 hover:text-red-300 ml-2"
              >
                Alle zurücksetzen
              </button>
            </div>
          )}
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  {/* Datum */}
                  <th
                    onClick={() => requestSort("invoiceDate")}
                    className="px-6 py-3 text-left font-light uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Datum
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Käufer */}
                  <th
                    onClick={() => requestSort("buyerName")}
                    className="px-6 py-3 text-left font-light uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Käufer
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Fahrzeug */}
                  <th
                    onClick={() => requestSort("carType")}
                    className="px-6 py-3 text-left font-light uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Fahrzeug
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>

                  {/* FIN */}
                  <th className="px-6 py-3 text-center font-light uppercase tracking-wider">
                    FIN
                  </th>

                  {/* Kilometer */}
                  <th
                    onClick={() => requestSort("mileage")}
                    className="px-6 py-3 text-left font-light uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Kilometer
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Rechnungsnr. */}
                  <th
                    onClick={() => requestSort("invoiceNumber")}
                    className="px-6 py-3 text-left font-light uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Re-Nr.
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>

                  {/* Betrag */}
                  <th
                    onClick={() => requestSort("total")}
                    className="px-6 py-3 text-left font-light uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      Betrag
                      <ChevronUpDownIcon className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="w-[1%] px-6 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {currentContracts.length > 0 ? (
                  currentContracts.map((c) => (
                    <tr
                      key={c._id}
                      onClick={() => router.push(`/kaufvertrag/${c._id}`)}
                      className="hover:bg-black/50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 font-light text-gray-400 whitespace-nowrap">
                        {formatDate(c.invoiceDate)}
                      </td>
                      <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                        {c.buyerName || "-"}
                      </td>
                      <td className="px-8 py-4 font-light text-gray-400 whitespace-nowrap">
                        {c.carType || "-"}
                      </td>
                      <td className="px-6 py-4 font-light text-gray-400 tracking-wide whitespace-nowrap">
                        {c.vin || "-"}
                      </td>
                      <td className="px-10 py-4 font-light text-gray-400 whitespace-nowrap">
                        {c.mileage
                          ? `${c.mileage.toLocaleString("de-DE")}`
                          : "-"}
                      </td>
                      <td
                        className={`px-6 py-4 font-medium tracking-widest whitespace-nowrap ${
                          c.ignored
                            ? "text-red-500"
                            : c.starred
                            ? "text-blue-500"
                            : "text-white"
                        }`}
                      >
                        {c.invoiceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-400 whitespace-nowrap">
                        {formatCurrency(c.total)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 flex justify-end gap-2">
                        {/* Unarchive */}
                        <button
                          onClick={(e) => handleUnarchive(c._id, e)}
                          className="text-green-400 hover:text-blue-400 transition"
                          title="Wiederherstellen"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4" />
                        </button>

                        {/* Star */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(
                                `/api/kaufvertrag/${c._id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ toggleStar: true }),
                                }
                              );
                              const updated = await res.json();
                              setContracts((prev) =>
                                prev.map((ct) =>
                                  ct._id === updated._id ? updated : ct
                                )
                              );
                            } catch (err) {
                              console.error("Fehler beim Stern:", err);
                            }
                          }}
                          className={`text-lg ${
                            c.starred
                              ? "text-blue-500"
                              : "text-yellow-400 hover:text-blue-400"
                          } transition`}
                          title={c.starred ? "Star entfernen" : "Star setzen"}
                        >
                          ★
                        </button>

                        {/* Ignore */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(
                                `/api/kaufvertrag/${c._id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ toggleIgnore: true }),
                                }
                              );
                              const updated = await res.json();
                              setContracts((prev) =>
                                prev.map((ct) =>
                                  ct._id === updated._id ? updated : ct
                                )
                              );
                            } catch (err) {
                              console.error("Fehler beim Ignorieren:", err);
                            }
                          }}
                          className={`${
                            c.ignored
                              ? "text-blue-500"
                              : "text-red-500 hover:text-blue-400"
                          } transition`}
                          title={
                            c.ignored
                              ? "Ignorieren entfernen"
                              : "Ignorieren setzen"
                          }
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-4 text-center text-gray-400"
                    >
                      Keine archivierten Verträge gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between bg-gray-800 border-t border-gray-700 text-sm">
              <p>
                Seite <span className="font-medium">{currentPage}</span> von{" "}
                <span className="font-medium">{totalPages}</span> –{" "}
                {filteredContracts.length} Einträge
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded ${
                        currentPage === pageNum
                          ? "bg-red-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-60 h-60 bg-red-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />
      </div>
    </div>
  );
}
