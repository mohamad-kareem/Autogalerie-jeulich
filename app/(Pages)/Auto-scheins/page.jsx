"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import ScheinForm from "@/app/(components)/Schein/ScheinForm";
import ScheinTable from "@/app/(components)/Schein/ScheinTable";

import {
  FiPlus,
  FiSearch,
  FiCalendar,
  FiUser,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";

const LIMIT = 20;
const OWNERS = ["Karim", "Alawie"];

export default function CarScheinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [scheins, setScheins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [showOwnerFilter, setShowOwnerFilter] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
      prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner]
    );
  };

  const handleNewSchein = (newDoc) => {
    setScheins((prev) => [newDoc, ...prev]);
    setShowUploadModal(false);
  };

  const handleUpdateSchein = (updatedDoc) => {
    setScheins((prev) =>
      prev.map((doc) => (doc._id === updatedDoc._id ? updatedDoc : doc))
    );
  };

  const handleDeleteSchein = (id) => {
    setScheins((prev) => prev.filter((s) => s._id !== id));
  };

  const filteredScheins = scheins.filter((schein) => {
    const nameMatch = schein.carName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const dateMatch = dateFilter
      ? new Date(schein.createdAt).toISOString().slice(0, 10) === dateFilter
      : true;

    const ownerMatch =
      selectedOwners.length === 0 || selectedOwners.includes(schein.owner);

    return nameMatch && dateMatch && ownerMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto">
        {/* Header */}
        <header className="mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            Fahrzeugschein-Verwaltung
          </h1>
        </header>

        {/* Filter + Upload Row */}
        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          selectedOwners={selectedOwners}
          toggleOwner={toggleOwner}
          showOwnerFilter={showOwnerFilter}
          setShowOwnerFilter={setShowOwnerFilter}
          owners={OWNERS}
          onOpenUpload={() => setShowUploadModal(true)}
        />

        {/* Table */}
        <ScheinTable
          scheins={filteredScheins}
          loading={loading}
          onUpdateSchein={handleUpdateSchein}
          onDeleteSchein={handleDeleteSchein}
        />

        {/* Upload Modal */}
        {showUploadModal && (
          <ScheinForm
            mode="create"
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleNewSchein}
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
  dateFilter,
  setDateFilter,
  selectedOwners,
  toggleOwner,
  showOwnerFilter,
  setShowOwnerFilter,
  owners,
  onOpenUpload,
}) {
  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* LEFT: Smaller Search */}
        <div className="relative w-full sm:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Fahrzeug suchen..."
            className="w-full rounded-md border border-gray-300 pl-8 pr-2 py-1.5 h-8 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* RIGHT: Filters + Upload Button */}
        <div className="flex w-full sm:w-auto items-center justify-end gap-1 sm:gap-2">
          {/* Date Filter */}
          <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs">
            <FiCalendar className="text-gray-500 text-xs" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs focus:outline-none"
            />
          </div>

          {/* Owner Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOwnerFilter(!showOwnerFilter)}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs"
            >
              <FiUser className="text-gray-500 text-xs" />
              <span>Besitzer</span>
              <FiChevronDown
                className={`text-gray-400 transition-transform ${
                  showOwnerFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {showOwnerFilter && (
              <div className="absolute right-0 z-20 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                {owners.map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    className="w-full px-3 py-1 text-left text-xs hover:bg-gray-50 flex items-center"
                    onClick={() => toggleOwner(owner)}
                  >
                    {selectedOwners.includes(owner) ? (
                      <FiCheck className="text-blue-500 mr-2" />
                    ) : (
                      <div className="w-3 h-3 mr-2 border border-gray-300 rounded" />
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
            className="inline-flex items-center gap-1 rounded-md bg-slate-600 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-slate-900"
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
