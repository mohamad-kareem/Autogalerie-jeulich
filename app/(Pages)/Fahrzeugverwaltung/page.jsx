"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import ScheinForm from "@/app/(components)/Schein/ScheinForm";
import ScheinTable from "@/app/(components)/Schein/ScheinTable";
import { useSidebar } from "@/app/(components)/SidebarContext";
import {
  FiPlus,
  FiSearch,
  FiUser,
  FiChevronDown,
  FiCheck,
  FiSun,
  FiMoon,
  FiArrowLeft,
  FiMenu,
} from "react-icons/fi";

const LIMIT = 100;
const OWNERS = ["Karim", "Alawie"];

export default function CarScheinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [scheins, setScheins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [showOwnerFilter, setShowOwnerFilter] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Initial load
  useEffect(() => {
    fetchScheins();
  }, []);

  const fetchScheins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/carschein?page=1&limit=${LIMIT}`);
      if (!res.ok) throw new Error("Abruf fehlgeschlagen");
      const { docs } = await res.json();
      setScheins(docs || []);
    } catch (err) {
      toast.error("Scheine konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const toggleOwner = (owner) => {
    setSelectedOwners((prev) =>
      prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner],
    );
  };

  const handleNewSchein = (newDoc) => {
    setScheins((prev) => [newDoc, ...prev]);
    setShowUploadModal(false);
  };

  const handleUpdateSchein = (updatedDoc) => {
    setScheins((prev) =>
      prev.map((doc) => (doc._id === updatedDoc._id ? updatedDoc : doc)),
    );
  };

  const handleDeleteSchein = (id) => {
    setScheins((prev) => prev.filter((s) => s._id !== id));
  };

  const filteredScheins = scheins.filter((schein) => {
    const query = searchQuery.toLowerCase().trim();

    const searchMatch =
      !query ||
      [
        schein.carName,
        schein.finNumber, // VIN/FIN search
      ].some((field) => field?.toString().toLowerCase().includes(query));

    const ownerMatch =
      selectedOwners.length === 0 || selectedOwners.includes(schein.owner);

    return searchMatch && ownerMatch;
  });

  // Theme classes
  const bgClass = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bgClass} p-2 sm:p-4`}
    >
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto">
        {/* Header */}
        <header className="mb-3 sm:mb-4 flex items-center gap-4">
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
            className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${textPrimary}`}
          >
            Fahrzeugverwaltung
          </h1>
        </header>

        {/* Filter + Upload Row */}
        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedOwners={selectedOwners}
          toggleOwner={toggleOwner}
          showOwnerFilter={showOwnerFilter}
          setShowOwnerFilter={setShowOwnerFilter}
          owners={OWNERS}
          onOpenUpload={() => setShowUploadModal(true)}
          darkMode={darkMode}
        />

        {/* Table */}
        <ScheinTable
          scheins={filteredScheins}
          loading={loading}
          onUpdateSchein={handleUpdateSchein}
          onDeleteSchein={handleDeleteSchein}
          darkMode={darkMode}
        />

        {/* Upload Modal */}
        {showUploadModal && (
          <ScheinForm
            mode="create"
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleNewSchein}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}

// Filter + Upload Row
function FilterSection({
  searchQuery,
  setSearchQuery,
  selectedOwners,
  toggleOwner,
  showOwnerFilter,
  setShowOwnerFilter,
  owners,
  onOpenUpload,
  darkMode,
}) {
  const cardBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBg = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";
  const buttonBg = darkMode
    ? "bg-gray-700 hover:bg-gray-600 text-white"
    : "bg-gray-600 hover:bg-gray-700 text-white";
  const filterButtonBg = darkMode
    ? "bg-gray-700 border-gray-600 text-gray-300"
    : "bg-gray-50 border-gray-300 text-gray-600";
  const iconColor = darkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div
      className={`mb-3 rounded-lg border transition-colors duration-300 ${borderColor} ${cardBg} p-2 shadow-sm`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* LEFT: Search (car name + FIN) */}
        <div className="relative w-full sm:max-w-xs">
          <FiSearch
            className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm transition-colors duration-300 ${iconColor}`}
          />
          <input
            type="text"
            placeholder="Nach Fahrzeug oder FIN suchen..."
            className={`w-full rounded-md border pl-8 pr-2 py-1.5 h-8 text-xs sm:text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${inputBg} ${
              darkMode
                ? "focus:border-gray-400 focus:ring-gray-400"
                : "focus:border-blue-500 focus:ring-blue-200"
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* RIGHT: Owner Filter + Upload Button */}
        <div className="flex w-full sm:w-auto items-center justify-end gap-1 sm:gap-2">
          {/* Owner Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOwnerFilter(!showOwnerFilter)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors duration-300 ${filterButtonBg}`}
            >
              <FiUser
                className={`text-xs transition-colors duration-300 ${iconColor}`}
              />
              <span>Besitzer</span>
              <FiChevronDown
                className={` transition-colors duration-300 ${iconColor} ${
                  showOwnerFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {showOwnerFilter && (
              <div
                className={`absolute right-0 z-20 mt-1 w-32 border rounded-md shadow-lg py-1 transition-colors duration-300 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                {owners.map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    className={`w-full px-3 py-1 text-left text-xs flex items-center transition-colors duration-300 ${
                      darkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                    onClick={() => toggleOwner(owner)}
                  >
                    {selectedOwners.includes(owner) ? (
                      <FiCheck className="text-blue-500 mr-2" />
                    ) : (
                      <div
                        className={`w-3 h-3 mr-2 border rounded transition-colors duration-300 ${
                          darkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      />
                    )}
                    <span>{owner}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={onOpenUpload}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm transition ${buttonBg}`}
          >
            <FiPlus className="text-sm" />
            <span className="hidden xs:inline">Schein hochladen</span>
            <span className="xs:hidden">Neu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
