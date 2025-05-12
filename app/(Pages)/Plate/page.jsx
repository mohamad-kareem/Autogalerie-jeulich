"use client";

import { useState, useEffect } from "react";
import {
  FiClock,
  FiMapPin,
  FiUser,
  FiCalendar,
  FiPrinter,
  FiDownload,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { exportPlateReport } from "@/app/utils/PlateExportService";

const PlateTrackingPage = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("log");
  const [plates, setPlates] = useState([]);
  const [plateUsage, setPlateUsage] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    plateNumber: "",
    employeeName: session?.user?.name || "",
    destination: "",
    purpose: "",
    startTime: new Date(),
    endTime: null,
    notes: "",
  });

  const [reportFilters, setReportFilters] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
    plateNumber: "all",
  });

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  // Fetch plates and usage data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch available plates
        const platesRes = await fetch("/api/plates");
        if (!platesRes.ok) throw new Error("Failed to fetch plates");
        const platesData = await platesRes.json();
        setPlates(platesData);

        // Fetch plate usage
        const usageRes = await fetch("/api/plates/usage");
        if (!usageRes.ok) throw new Error("Failed to fetch plate usage");
        const usageData = await usageRes.json();
        setPlateUsage(usageData);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle date changes
  const handleDateChange = (date, field) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  // Submit plate usage
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.plateNumber || !formData.destination) {
      toast.error("Plate number and destination are required");
      return;
    }

    try {
      const response = await fetch("/api/plates/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          employeeId: session?.user?.id,
          status: "active",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to log plate usage");
      }

      toast.success("Plate usage logged successfully");

      // Refresh usage data
      const usageRes = await fetch("/api/plates/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setPlateUsage(usageData);
      }

      // Reset form
      setFormData({
        plateNumber: "",
        employeeName: session?.user?.name || "",
        destination: "",
        purpose: "",
        startTime: new Date(),
        endTime: null,
        notes: "",
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Mark plate as returned
  const handleReturnPlate = async (usageId) => {
    try {
      const response = await fetch(`/api/plates/usage/${usageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endTime: new Date(), status: "returned" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update plate status");
      }

      toast.success("Plate marked as returned");

      // Refresh usage data
      const usageRes = await fetch("/api/plates/usage");
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setPlateUsage(usageData);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Generate report
  const generateReport = async () => {
    try {
      const query = new URLSearchParams({
        startDate: reportFilters.startDate.toISOString(),
        endDate: reportFilters.endDate.toISOString(),
        plateNumber: reportFilters.plateNumber,
      }).toString();

      const response = await fetch(`/api/plates/report?${query}`);
      const reportData = await response.json();

      if (!Array.isArray(reportData.details)) {
        toast.error("Unexpected data format");
        return;
      }

      const exportData = reportData.details.map((entry) => {
        const startTime = new Date(entry.startTime);
        const endTime = entry.endTime ? new Date(entry.endTime) : null;
        const durationHours = endTime
          ? Math.round(((endTime - startTime) / (1000 * 60 * 60)) * 10) / 10
          : null;

        return {
          date: entry.startTime,
          plateNumber: entry.plateNumber,
          account: entry.employeeName,
          destination: entry.destination,
          endTime: entry.endTime,
          durationHours,
          carName: entry.purpose,
          notes: entry.notes,
        };
      });

      exportPlateReport(exportData, "PlateReport");
      toast.success("Excel report downloaded successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Filter plate usage for display
  const filteredUsage = plateUsage.filter((usage) => {
    const usageDate = new Date(usage.startTime);
    return (
      usageDate >= reportFilters.startDate &&
      usageDate <= reportFilters.endDate &&
      (reportFilters.plateNumber === "all" ||
        usage.plateNumber === reportFilters.plateNumber)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header with dark mode toggle */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Dealership Plate Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">
              Track and manage temporary plate usage for vehicle movements
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-yellow-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </div>

        {/* Tabs - Responsive with scroll on small screens */}
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab("log")}
              className={`px-3 py-2 sm:px-4 font-medium text-sm sm:text-base flex items-center ${
                activeTab === "log"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <FiUser className="inline mr-1 sm:mr-2" />
              Log Plate
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-2 sm:px-4 font-medium text-sm sm:text-base flex items-center ${
                activeTab === "report"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <FiCalendar className="inline mr-1 sm:mr-2" />
              Usage Report
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-2 sm:px-4 font-medium text-sm sm:text-base flex items-center ${
                activeTab === "active"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <FiClock className="inline mr-1 sm:mr-2" />
              Active Plates
            </button>
          </div>
        </div>

        {/* Log Plate Usage Tab */}
        {activeTab === "log" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 transition-colors duration-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 flex items-center">
              <FiUser className="inline mr-2 text-blue-500 dark:text-blue-400" />
              Log New Plate Usage
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Plate Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plate Number <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select a plate</option>
                    {plates.map((plate) => (
                      <option key={plate._id} value={plate.number}>
                        {plate.number} - {plate.type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Destination */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select destination</option>
                    <option value="Hassona">Hassona</option>
                    <option value="Toni">Toni</option>
                    <option value="Abo Abass">Abo Abass</option>
                    <option value="Abo Ali">Abo Ali</option>
                    <option value="Steuerberater">Steuerberater</option>
                    <option value="Mergene l Dahan">Mergene l Dahan</option>
                    <option value="Schwap">Schwap</option>
                    <option value="Rickim Elektronik GmbH">
                      Rickim Elektronik GmbH
                    </option>
                    <option value="Düren">Düren</option>
                    <option value="ATC Auto Teile Cologne Gmbh">
                      ATC Auto Teile Cologne Gmbh
                    </option>
                    <option value="Rainer Johnen">Rainer Johnen</option>
                    <option value="TÜV Inspection">TÜV Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose
                  </label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="Brief purpose description"
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Start Time */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <DatePicker
                    selected={formData.startTime}
                    onChange={(date) => handleDateChange(date, "startTime")}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    wrapperClassName="dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes"
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Log Plate Usage
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Usage Report Tab */}
        {activeTab === "report" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 transition-colors duration-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 flex items-center">
              <FiCalendar className="inline mr-2 text-blue-500 dark:text-blue-400" />
              Plate Usage Report
            </h2>

            <div className="mb-4 sm:mb-6 bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg transition-colors duration-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Report Filters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    selected={reportFilters.startDate}
                    onChange={(date) =>
                      setReportFilters({ ...reportFilters, startDate: date })
                    }
                    selectsStart
                    startDate={reportFilters.startDate}
                    endDate={reportFilters.endDate}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    wrapperClassName="dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <DatePicker
                    selected={reportFilters.endDate}
                    onChange={(date) =>
                      setReportFilters({ ...reportFilters, endDate: date })
                    }
                    selectsEnd
                    startDate={reportFilters.startDate}
                    endDate={reportFilters.endDate}
                    minDate={reportFilters.startDate}
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    wrapperClassName="dark:text-white"
                  />
                </div>

                {/* Plate Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plate Number
                  </label>
                  <select
                    value={reportFilters.plateNumber}
                    onChange={(e) =>
                      setReportFilters({
                        ...reportFilters,
                        plateNumber: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Plates</option>
                    {plates.map((plate) => (
                      <option key={plate._id} value={plate.number}>
                        {plate.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={generateReport}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center"
                >
                  <FiDownload className="mr-1 sm:mr-2" />
                  Generate Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white text-xs sm:text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center"
                >
                  <FiPrinter className="mr-1 sm:mr-2" />
                  Print Report
                </button>
              </div>
            </div>

            {/* Report Table - Responsive with horizontal scroll on small screens */}
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Plate
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Start Time
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          End Time
                        </th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsage.length > 0 ? (
                        filteredUsage.map((usage) => {
                          const startTime = new Date(usage.startTime);
                          const endTime = usage.endTime
                            ? new Date(usage.endTime)
                            : null;
                          const duration = endTime
                            ? Math.round(
                                ((endTime - startTime) / (1000 * 60 * 60)) * 10
                              ) / 10
                            : null;

                          return (
                            <tr
                              key={usage._id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                                {usage.plateNumber}
                              </td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                {usage.employeeName}
                              </td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                {usage.destination}
                              </td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                {startTime.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                {endTime ? endTime.toLocaleString() : "Active"}
                              </td>
                              <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                                {duration ? `${duration} hours` : "-"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-3 py-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                          >
                            No plate usage records found for the selected
                            filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Plates Tab */}
        {activeTab === "active" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 flex items-center">
              <FiClock className="inline mr-2 text-blue-500 dark:text-blue-400" />
              Currently Active Plates
            </h2>

            {plateUsage.filter((u) => u.status === "active").length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {plateUsage
                  .filter((usage) => usage.status === "active")
                  .map((usage) => {
                    const startTime = new Date(usage.startTime);
                    const durationHours =
                      Math.round(
                        ((new Date() - startTime) / (1000 * 60 * 60)) * 10
                      ) / 10;

                    return (
                      <div
                        key={usage._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md dark:hover:shadow-lg transition-all bg-white dark:bg-gray-700"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
                              {usage.plateNumber}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <FiUser className="inline mr-1" />
                              {usage.employeeName}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <FiMapPin className="inline mr-1" />
                              {usage.destination}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                              <FiClock className="inline mr-1" />
                              {startTime.toLocaleTimeString()} - Active for{" "}
                              {durationHours} hours
                            </p>
                          </div>
                          <button
                            onClick={() => handleReturnPlate(usage._id)}
                            className="px-2 py-1 sm:px-3 sm:py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs sm:text-sm rounded-md hover:bg-green-200 dark:hover:bg-green-800"
                          >
                            Mark Returned
                          </button>
                        </div>
                        {usage.purpose && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                            <span className="font-medium">Purpose:</span>{" "}
                            {usage.purpose}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  No plates are currently in use
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlateTrackingPage;
