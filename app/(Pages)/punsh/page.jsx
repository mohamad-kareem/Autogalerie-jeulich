"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FiLogIn,
  FiLogOut,
  FiClock,
  FiUser,
  FiCalendar,
  FiTrash2,
  FiEdit,
} from "react-icons/fi";
import { FaLocationArrow, FaUserClock } from "react-icons/fa";
import { MdOutlineSecurity } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import { toast } from "react-hot-toast";

export default function PunchClockPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState("out");
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);

  const dealershipCoords = { lat: 50.9116416, lng: 6.373376 };

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAdminStatus();
      fetchPunchRecords();
    }
  }, [session]);

  const fetchAdminStatus = async () => {
    try {
      const res = await fetch(`/api/admins/${session.user.id}`);
      const data = await res.json();
      if (data?.currentStatus) setCurrentStatus(data.currentStatus);
    } catch (error) {
      console.error("Status fetch error:", error);
    }
  };

  const fetchPunchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/punch");
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error("Punch records fetch error:", error);
      toast.error("Failed to load records");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 1000;
  };

  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      if (!navigator.geolocation) {
        setIsLoading(false);
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
          setDistance(dist.toFixed(0));
          setIsLoading(false);
          resolve({ coords, distance: dist });
        },
        () => {
          setIsLoading(false);
          reject("Location access denied.");
        }
      );
    });
  };

  const handlePunchAction = async (type) => {
    if (!session?.user?.id) return;
    try {
      const { coords, distance } = await getLocation();
      if (distance > 200) {
        toast.error("You must be at the dealership to punch.");
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
        setCurrentStatus(data.status);
        fetchPunchRecords();
        toast.success(`Successfully clocked ${type === "in" ? "in" : "out"}`);
      }
    } catch (error) {
      toast.error("Punch failed. Please try again.");
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/punch/${recordId}`, {
        method: "DELETE",
        headers: {
          "x-admin-id": session.user.id,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete record");
      }

      fetchPunchRecords();
      toast.success("Record deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (type) => {
    if (type === "in") return "bg-emerald-100 text-emerald-800";
    return "bg-slate-100 text-slate-800";
  };

  const getActionLabel = (type) =>
    type === "in" ? "Clocked In" : "Clocked Out";

  const allAdmins = useMemo(() => {
    const names = new Set(records.map((r) => r.admin?.name).filter(Boolean));
    return Array.from(names).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return selectedAdmin === "all"
      ? records
      : records.filter((r) => r.admin?.name === selectedAdmin);
  }, [records, selectedAdmin]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse flex items-center space-x-4">
          <MdOutlineSecurity className="h-8 w-8 text-indigo-600" />
          <span className="text-lg font-medium text-slate-700">
            Verifying credentials...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <FaUserClock className="text-indigo-600" />
              <span>Time Tracking System</span>
            </h1>
            <div className="flex items-center text-slate-600 mt-2 gap-2">
              <FiUser className="text-sm" />
              <span className="text-sm sm:text-base">
                {session.user.name} • {formatDate(currentTime)}
              </span>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
            <IoMdTime className="text-indigo-600 text-lg" />
            <span className="font-medium text-slate-800">
              {formatTime(currentTime)}
            </span>
          </div>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">Status</h3>
                <p className="mt-1 text-lg font-semibold text-slate-800">
                  {currentStatus === "in" ? "On Duty" : "Off Duty"}
                </p>
              </div>
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  currentStatus === "in"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {currentStatus === "in" ? (
                  <FiLogIn className="text-xl" />
                ) : (
                  <FiLogOut className="text-xl" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">
                  Location Verification
                </h3>
                <p className="mt-1 text-lg font-semibold text-slate-800">
                  {location ? "Verified" : "Not Verified"}
                </p>
                {location && (
                  <p className="text-xs text-slate-500 mt-1">
                    {distance}m from dealership
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <FaLocationArrow className="text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-500">
                  Last Action
                </h3>
                <p className="mt-1 text-lg font-semibold text-slate-800">
                  {records[0]?.type === "in" ? "Clocked In" : "Clocked Out"}
                </p>
                {records[0] && (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(records[0].time).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <FiClock className="text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Punch Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MdOutlineSecurity className="text-indigo-600" />
            <span>Time Clock</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handlePunchAction("in")}
              disabled={currentStatus === "in" || isLoading}
              className={`py-4 px-6 rounded-lg flex flex-col items-center justify-center text-center font-medium transition-all ${
                currentStatus === "in" || isLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600 shadow-md hover:shadow-lg"
              }`}
            >
              <FiLogIn className="text-2xl mb-2" />
              <span className="font-semibold">Punch IN</span>
              <span className="text-xs mt-1">Start your shift</span>
            </button>
            <button
              onClick={() => handlePunchAction("out")}
              disabled={currentStatus !== "in" || isLoading}
              className={`py-4 px-6 rounded-lg flex flex-col items-center justify-center text-center font-medium transition-all ${
                currentStatus !== "in" || isLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-400 to-pink-500 text-white hover:from-rose-500 hover:to-pink-600 shadow-md hover:shadow-lg"
              }`}
            >
              <FiLogOut className="text-2xl mb-2" />
              <span className="font-semibold">Punch Out</span>
              <span className="text-xs mt-1">End your shift</span>
            </button>
          </div>
        </div>

        {/* Punch Records */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FiCalendar className="text-indigo-600" />
              <span>Time Records</span>
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="admin-filter" className="text-sm text-slate-600">
                Filter by:
              </label>
              <select
                id="admin-filter"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Team Members</option>
                {allAdmins.map((name) => (
                  <option key={name} value={name}>
                    {name === session.user.name ? `${name} (You)` : name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
            </div>
          ) : Object.keys(groupedRecords).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedRecords).map(([key, recs]) => (
                <div
                  key={key}
                  className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <h3 className="text-md font-semibold text-slate-700 mb-4">
                    {key}
                  </h3>
                  <div className="overflow-hidden shadow-xs rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Location Verification
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {recs.map((record, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">
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
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  record.type
                                )}`}
                              >
                                {getActionLabel(record.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                              {record.location?.verified ? (
                                <span className="inline-flex items-center text-emerald-600">
                                  <FaLocationArrow className="mr-1.5" />
                                  Verified ({record.location.distance}m)
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  Not verified
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                              <button
                                onClick={() => handleDeleteRecord(record._id)}
                                disabled={isDeleting}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                title="Delete record"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
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
              <FiClock className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-700">
                No time records found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Punch IN to start recording your time
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
