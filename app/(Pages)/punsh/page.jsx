"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FiLogIn,
  FiLogOut,
  FiClock,
  FiUser,
  FiTrash2,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
} from "react-icons/fi";
import { FaUserClock, FaLocationArrow } from "react-icons/fa";
import { MdOutlineSecurity } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Dealership coordinates
const dealershipCoords = { lat: 50.9116416, lng: 6.373376 };

export default function PunchClockPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState("out");
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Records management with lazy loading
  const [records, setRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [hasFetchedRecords, setHasFetchedRecords] = useState(false);

  // Filtering and deletion
  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    start: null,
    end: null,
    type: "none",
  });
  const [deleteRange, setDeleteRange] = useState({
    start: null,
    end: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Authentication check
  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((a, b) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 1000; // Distance in meters
  }, []);

  // Get current location
  const getLocation = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject("Geolocation not supported.");
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const dist = calculateDistance(coords, dealershipCoords);
          setLocation(coords);
          setDistance(dist);
          resolve({ coords, distance: dist });
        },
        (error) => {
          console.error("Geolocation error:", error);
          reject("Location access denied or unavailable.");
        },
        {
          enableHighAccuracy: true, // << This is key
          timeout: 10000, // Optional: how long to wait before failing (in ms)
          maximumAge: 0, // Optional: don't use a cached position
        }
      );
    });
  }, [calculateDistance]);

  // Fetch only the latest record to determine current status
  const fetchCurrentStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/punch/latest", {
        headers: {
          "x-admin-id": session.user.id,
        },
      });
      const data = await res.json();
      setCurrentStatus(data?.type || "out");
    } catch (error) {
      console.error("Status check error:", error);
    }
  }, [session]);

  // Fetch records only when needed (lazy loading)
  const fetchPunchRecords = useCallback(
    async (force = false) => {
      if (!session?.user?.id || (!force && hasFetchedRecords)) return;

      try {
        setIsLoading(true);
        const res = await fetch("/api/punch");
        const data = await res.json();
        setRecords(data);
        setHasFetchedRecords(true);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load records");
      } finally {
        setIsLoading(false);
      }
    },
    [session, hasFetchedRecords]
  );

  // Toggle records visibility with lazy loading
  const toggleRecords = useCallback(() => {
    if (!showRecords && !hasFetchedRecords) {
      fetchPunchRecords();
    }
    setShowRecords(!showRecords);
  }, [showRecords, hasFetchedRecords, fetchPunchRecords]);

  // Initial load - only fetch current status
  useEffect(() => {
    if (session?.user?.id) {
      fetchCurrentStatus();
    }
  }, [session, fetchCurrentStatus]);

  const handlePunchAction = async (type) => {
    if (!session?.user?.id) return;

    if (type === "in" && currentStatus === "in") {
      toast.error("Already clocked in");
      return;
    }

    if (type === "out" && currentStatus === "out") {
      toast.error("Already clocked out");
      return;
    }

    try {
      setIsLoading(true);
      const { coords, distance } = await getLocation();

      // Check if within 800m of dealership
      if (distance > 800) {
        toast.error("You must be at the dealership to punch in/out");
        return;
      }

      const res = await fetch("/api/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({
          type,
          location: { ...coords, verified: true, distance },
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Update status and refresh latest record
        await fetchCurrentStatus();
        toast.success(`Clocked ${type === "in" ? "in" : "out"} successfully`);

        // If records are visible, refresh them
        if (showRecords) {
          await fetchPunchRecords();
        }
      }
    } catch (error) {
      toast.error(error.message || "Action failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRange = async () => {
    if (!deleteRange.start || !deleteRange.end) {
      toast.error("Select both start and end dates");
      return;
    }

    if (
      !window.confirm(
        `Delete records between ${deleteRange.start.toLocaleDateString()} and ${deleteRange.end.toLocaleDateString()}?`
      )
    )
      return;

    try {
      setIsDeleting(true);
      const res = await fetch("/api/punch/delete-range", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({
          start: deleteRange.start,
          end: deleteRange.end,
          adminId: selectedAdmin !== "all" ? session.user.id : null,
        }),
      });

      if (!res.ok) throw new Error("Deletion failed");
      const { deletedCount } = await res.json();
      toast.success(`${deletedCount} records deleted`);
      // Refresh records if they're visible
      if (showRecords) {
        await fetchPunchRecords();
      }
      setDeleteRange({ start: null, end: null });
    } catch (error) {
      toast.error(error.message || "Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const applyDateFilter = (type) => {
    let start, end;
    const today = new Date();

    switch (type) {
      case "today":
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date(today.setHours(23, 59, 59, 999));
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case "none":
        start = null;
        end = null;
        break;
      default:
        return;
    }

    setDateFilter({
      ...dateFilter,
      type: type === "none" ? "none" : "range",
      start,
      end,
    });
  };

  const clearFilters = () => {
    setDateFilter({ start: null, end: null, type: "none" });
    setSelectedAdmin("all");
  };

  // Helper functions
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const allAdmins = useMemo(() => {
    const names = new Set(records.map((r) => r.admin?.name).filter(Boolean));
    return Array.from(names).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records;

    if (selectedAdmin !== "all") {
      result = result.filter((r) => r.admin?.name === selectedAdmin);
    }

    if (dateFilter.type !== "none" && dateFilter.start && dateFilter.end) {
      result = result.filter((record) => {
        const recordDate = new Date(record.time);
        return recordDate >= dateFilter.start && recordDate <= dateFilter.end;
      });
    }

    return result;
  }, [records, selectedAdmin, dateFilter]);

  const groupedRecords = useMemo(() => {
    return filteredRecords.reduce((acc, record) => {
      const d = new Date(record.time);
      const monthYear = `${d.toLocaleString("default", {
        month: "long",
      })} ${d.getFullYear()}`;
      const adminName = record.admin?.name || "Unknown";
      const key = `${monthYear} • ${adminName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      acc[key].sort((a, b) => new Date(b.time) - new Date(a.time));
      return acc;
    }, {});
  }, [filteredRecords]);

  if (authStatus !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-pulse flex items-center space-x-4">
          <div className="h-8 w-8 rounded-full bg-lime-400 opacity-80"></div>
          <span className="text-lg font-medium text-gray-100">
            Verifying credentials...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <h1 className="text-base sm:text-2xl font-bold flex items-center gap-2">
                <FaUserClock className="text-lime-400" />
                <span>Time Tracker</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <FiUser className="text-sm" />
                <span>{session.user.name}</span>
                <span>•</span>
                <span>{formatDate(currentTime)}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <IoMdTime className="text-lime-400" />
                  <span className="font-medium">{formatTime(currentTime)}</span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm
                  ${
                    currentStatus === "in"
                      ? "bg-lime-900/50 text-lime-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      currentStatus === "in" ? "bg-lime-400" : "bg-gray-500"
                    }`}
                  ></span>
                  <span>{currentStatus === "in" ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Punch Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => handlePunchAction("in")}
            disabled={currentStatus === "in" || isLoading}
            className={`p-4 rounded-lg transition-all flex items-center justify-center gap-2
              ${
                currentStatus === "in" || isLoading
                  ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-lime-600 to-lime-500 hover:shadow-lg hover:shadow-lime-500/20 cursor-pointer"
              }`}
          >
            <FiLogIn className="text-lg" />
            <span>Clock In</span>
          </button>

          <button
            onClick={() => handlePunchAction("out")}
            disabled={currentStatus !== "in" || isLoading}
            className={`p-4 rounded-lg transition-all flex items-center justify-center gap-2
              ${
                currentStatus !== "in" || isLoading
                  ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-900/50 to-red-700/20 border border-gray-700 hover:shadow-lg cursor-pointer"
              }`}
          >
            <FiLogOut className="text-lg" />
            <span>Clock Out</span>
          </button>
        </div>

        {/* Records Toggle */}
        <div className="mb-6">
          <button
            onClick={toggleRecords}
            className={`w-full p-4 rounded-lg transition-all flex items-center justify-between ${
              showRecords
                ? "bg-gray-800/50"
                : "bg-gray-800/30 hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <FiCalendar className="text-lime-400" />
              <span className="text-sm sm:text-xl">
                {showRecords ? "Hide Records" : "Show Records"}
              </span>
            </div>
            {showRecords ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>

        {/* Records Section - Only rendered when visible */}
        {showRecords && (
          <>
            {/* Filters */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 mb-6 overflow-hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FiFilter className="text-lime-400" />
                  <span className="text-sm sm:text-xl">Filters</span>
                </div>
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>

              {showFilters && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Employee
                      </label>
                      <select
                        value={selectedAdmin}
                        onChange={(e) => setSelectedAdmin(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                      >
                        <option value="all">All Employees</option>
                        {allAdmins.map((name) => (
                          <option key={name} value={name}>
                            {name === session.user.name
                              ? `${name} (You)`
                              : name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date Range
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => applyDateFilter("today")}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${
                            dateFilter.type === "range" &&
                            new Date(dateFilter.start).toDateString() ===
                              new Date().toDateString()
                              ? "bg-lime-600 text-white"
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => applyDateFilter("month")}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${
                            dateFilter.type === "range" &&
                            dateFilter.start?.getMonth() ===
                              new Date().getMonth()
                              ? "bg-lime-600 text-white"
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                        >
                          This Month
                        </button>
                        <button
                          onClick={() => applyDateFilter("none")}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${
                            dateFilter.type === "none"
                              ? "bg-lime-600 text-white"
                              : "bg-gray-700 hover:bg-gray-600"
                          }`}
                        >
                          All Time
                        </button>
                      </div>
                    </div>
                  </div>

                  {(dateFilter.type !== "none" || selectedAdmin !== "all") && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="text-sm text-gray-400 hover:text-lime-400 transition-colors flex items-center gap-1"
                      >
                        <FiX className="h-4 w-4" />
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delete Section */}
            <div className="bg-gray-800/50  rounded-xl border border-gray-700 mb-8">
              <button
                onClick={() => setShowDelete(!showDelete)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FiTrash2 className="text-rose-400" />
                  <span className="text-sm sm:text-xl">Delete Records</span>
                </div>
                {showDelete ? <FiChevronUp /> : <FiChevronDown />}
              </button>

              {showDelete && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-700">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Start Date
                        </label>
                        <DatePicker
                          selected={deleteRange.start}
                          onChange={(date) =>
                            setDeleteRange({ ...deleteRange, start: date })
                          }
                          selectsStart
                          startDate={deleteRange.start}
                          endDate={deleteRange.end}
                          placeholderText="Select start"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          End Date
                        </label>
                        <DatePicker
                          selected={deleteRange.end}
                          onChange={(date) =>
                            setDeleteRange({ ...deleteRange, end: date })
                          }
                          selectsEnd
                          startDate={deleteRange.start}
                          endDate={deleteRange.end}
                          minDate={deleteRange.start}
                          placeholderText="Select end"
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleDeleteRange}
                      disabled={
                        !deleteRange.start || !deleteRange.end || isDeleting
                      }
                      className={`w-full bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
                        !deleteRange.start || !deleteRange.end || isDeleting
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isDeleting ? "Processing..." : "Delete Records"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Records Table */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-sm sm:text-lg font-medium flex items-center gap-2">
                  <FiCalendar className="text-lime-400" />
                  <span>Time Records</span>
                  {filteredRecords.length > 0 && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({filteredRecords.length})
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => fetchPunchRecords(true)}
                  disabled={isLoading}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin inline-block h-3 w-3 border border-lime-400 rounded-full border-t-transparent"></span>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>

              {isLoading && !hasFetchedRecords ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-10 w-10 border-2 border-lime-400 rounded-full border-t-transparent"></div>
                </div>
              ) : Object.keys(groupedRecords).length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {Object.entries(groupedRecords).map(([key, recs]) => (
                    <div key={key} className="p-4">
                      <h3 className="text-md font-semibold text-gray-300 mb-3">
                        {key}
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Location
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {recs.map((record, idx) => (
                              <tr key={idx} className="hover:bg-gray-800/30">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                  {new Date(record.time).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                                      record.type === "in"
                                        ? "bg-lime-900/50 text-lime-400"
                                        : "bg-gray-700 text-gray-400"
                                    }`}
                                  >
                                    {record.type === "in"
                                      ? "Clocked In"
                                      : "Clocked Out"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                                  {record.location?.verified ? (
                                    <span className="inline-flex items-center text-lime-400">
                                      <FaLocationArrow className="mr-1.5" />
                                      Verified ({record.location.distance}m)
                                    </span>
                                  ) : (
                                    <span>Not verified</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <FiClock className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-300">
                    No time records found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedAdmin !== "all" || dateFilter.type !== "none"
                      ? "Try adjusting your filters"
                      : "Clock in to start recording your time"}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
