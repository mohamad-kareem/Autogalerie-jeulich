"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "react-icons/fi";
import { FaUserClock } from "react-icons/fa";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function PunchClockPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState("out");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Fetch records when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchPunchRecords();
    }
  }, [session]);

  const fetchPunchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/punch");
      const data = await res.json();
      setRecords(data);

      if (session?.user?.id) {
        const userRecords = data.filter(
          (r) => r.admin?._id === session.user.id
        );
        const lastRecord = userRecords[0];
        setCurrentStatus(lastRecord?.type || "out");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load records");
    } finally {
      setIsLoading(false);
    }
  };

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
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentStatus(type);
        fetchPunchRecords();
        toast.success(`Clocked ${type === "in" ? "in" : "out"} successfully`);
      }
    } catch (error) {
      toast.error("Action failed. Please try again.");
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
      fetchPunchRecords();
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

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
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
        {/* Header - Optimized for mobile */}
        <header className="mb-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center ">
              <h1 className="text-m sm:text-2xl font-bold flex items-center gap-2">
                <FaUserClock className="text-lime-400" />
                <span>Time Tracker</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>{session.user.name}</span>
                <span>•</span>
                <span>{currentTime.toLocaleDateString()}</span>
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
        </header>

        {/* Punch Actions - Stacked on mobile */}
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

        {/* Filters - Collapsible */}
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
                        {name === session.user.name ? `${name} (You)` : name}
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
                        dateFilter.start?.getMonth() === new Date().getMonth()
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

        {/* Delete Section - Collapsible */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 mb-8 overflow-hidden">
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

        {/* Records Table - Responsive */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-sm sm:text-lg font-medium">
              Time Records
              {filteredRecords.length > 0 && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({filteredRecords.length})
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-10 w-10 border-2 border-lime-400 rounded-full border-t-transparent"></div>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-800/50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-lime-900/50 flex items-center justify-center text-lime-400">
                            <FiUser className="h-3 w-3" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium">
                              {record.admin?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-none">
                              {record.admin?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {new Date(record.time).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatTime(record.time)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-4 font-medium rounded-full ${
                            record.type === "in"
                              ? "bg-lime-900/50 text-lime-400"
                              : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {record.type === "in" ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <FiClock className="mx-auto h-10 w-10 text-gray-600" />
              <h3 className="mt-3 text-sm font-medium text-gray-300">
                No records found
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {selectedAdmin !== "all" || dateFilter.type !== "none"
                  ? "Adjust your filters"
                  : "Clock in to begin tracking"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
