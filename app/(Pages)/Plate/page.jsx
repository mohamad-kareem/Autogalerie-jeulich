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
  FiTrash2,
} from "react-icons/fi";
import CarTypeSelector from "@/app/(components)/CarTypeSelector";
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
  const [isOpen, setIsOpen] = useState(false);
  const [carTypeFilter, setCarTypeFilter] = useState("");

  const [formData, setFormData] = useState({
    plateNumber: "",
    employeeName: "",
    destination: "",
    from: "",
    startTime: new Date(),
    endTime: null,
    notes: "",
    carType: "",
  });
  useEffect(() => {
    if (session?.user?.name) {
      setFormData((prev) => ({
        ...prev,
        employeeName: session.user.name,
      }));
    }
  }, [session]);

  const [reportFilters, setReportFilters] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
    plateNumber: "all",
  });

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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
    console.log("Submitting formData:", formData);

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

      toast.success("Plate usage logged successfully", {
        style: {
          background: darkMode ? "#1E40AF" : "#2563EB",
          color: "#fff",
        },
        iconTheme: {
          primary: darkMode ? "#1E3A8A" : "#1E40AF",
          secondary: "#fff",
        },
      });

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
        from: "",
        startTime: new Date(),
        endTime: null,
        notes: "",
        carType: "", // ✅ Include carType here
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

      toast.success("Plate marked as returned", {
        style: {
          background: darkMode ? "#1E40AF" : "#2563EB",
          color: "#fff",
        },
        iconTheme: {
          primary: darkMode ? "#1E3A8A" : "#1E40AF",
          secondary: "#fff",
        },
      });

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
          from: entry.from,
          carType: entry.carType,
          notes: entry.notes,
        };
      });

      exportPlateReport(exportData, "PlateReport");
      toast.success("Excel report downloaded successfully", {
        style: {
          background: darkMode ? "#1E40AF" : "#2563EB",
          color: "#fff",
        },
        iconTheme: {
          primary: darkMode ? "#1E3A8A" : "#1E40AF",
          secondary: "#fff",
        },
      });
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`/api/plates/usage/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete");
      }

      // Update local state
      setPlateUsage((prev) => prev.filter((entry) => entry._id !== id));

      toast.success("Entry deleted successfully", {
        style: {
          background: darkMode ? "#1E40AF" : "#2563EB",
          color: "#fff",
        },
      });
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
      <div
        className={`flex justify-center items-center min-h-screen ${
          darkMode ? "bg-gray-900" : "bg-blue-50"
        }`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            darkMode ? "border-blue-500" : "border-blue-600"
          }`}
        ></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900" : "bg-blue-50"
      } p-4 sm:p-6`}
    >
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto">
        {/* Header with dark mode toggle */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div>
            <h1
              className={`text-xl sm:text-3xl font-bold ${
                darkMode ? "text-white" : "text-blue-900"
              }`}
            >
              Nummernschildverfolgung
            </h1>
            <p
              className={`${
                darkMode ? "text-gray-300" : "text-blue-800"
              } mt-1 sm:mt-2 text-xs sm:text-base`}
            >
              Verfolge und verwalte Nummernschilder
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 sm:p-2.5 rounded-full text-sm sm:text-base mt-10  ${
              darkMode
                ? "bg-blue-800 text-yellow-300 hover:bg-blue-700"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            } transition-colors`}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <FiSun size={14} className="sm:size-5" />
            ) : (
              <FiMoon size={14} className="sm:size-5" />
            )}
          </button>
        </div>

        {/* Tabs - Responsive with scroll on small screens */}
        <div className="overflow-x-auto">
          <div
            className={`flex border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } mb-6 min-w-max sm:min-w-0`}
          >
            <button
              onClick={() => setActiveTab("log")}
              className={`px-3 py-2 sm:px-4 font-medium text-sm sm:text-base flex items-center ${
                activeTab === "log"
                  ? darkMode
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-blue-600 border-b-2 border-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiUser className="inline mr-1 sm:mr-2" />
              Log Plate
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-2 sm:px-4 font-medium text-sm sm:text-base flex items-center ${
                activeTab === "report"
                  ? darkMode
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-blue-600 border-b-2 border-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiCalendar className="inline mr-1 sm:mr-2" />
              Usage Report
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-2 sm:px-4 font-medium text-sm sm:text-base flex items-center ${
                activeTab === "active"
                  ? darkMode
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-blue-600 border-b-2 border-blue-600"
                  : darkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FiClock className="inline mr-1 sm:mr-2" />
              Active Plates
            </button>
          </div>
        </div>

        {/* Log Plate Usage Tab */}
        {activeTab === "log" && (
          <div
            className={`rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${
                darkMode ? "text-white" : "text-blue-900"
              }`}
            >
              <FiUser className="inline mr-2 text-blue-500" />
              Log New Plate Usage
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Plate Number */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Plate Number <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="plateNumber"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Start Time */}
                  <div>
                    <label
                      className={`block text-xs sm:text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Start Time
                    </label>
                    <DatePicker
                      selected={formData.startTime}
                      onChange={(date) => handleDateChange(date, "startTime")}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      wrapperClassName={darkMode ? "dark:text-white" : ""}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* from */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    from <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="from"
                    value={formData.from}
                    onChange={handleInputChange}
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">Select starting location</option>
                    <option value="Hassona">Hassona</option>
                    <option value="Probefahrt">Probefahrt</option>
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
                {/* Destination */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <CarTypeSelector
                  formData={formData}
                  handleInputChange={handleInputChange}
                  darkMode={darkMode}
                />

                {/* Notes */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes"
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
                {/* Employee Name */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Employee Name
                  </label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                    darkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    darkMode ? "focus:ring-offset-gray-800" : ""
                  }`}
                >
                  Log Plate Usage
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Usage Report Tab */}
        {activeTab === "report" && (
          <div
            className={`rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${
                darkMode ? "text-white" : "text-blue-900"
              }`}
            >
              <FiCalendar className="inline mr-2 text-blue-500" />
              Plate Usage Report
            </h2>

            <div
              className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-blue-50"
              }`}
            >
              <h3
                className={`text-base sm:text-lg font-medium mb-2 sm:mb-3 ${
                  darkMode ? "text-gray-300" : "text-blue-800"
                }`}
              >
                Report Filters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Date Range */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    wrapperClassName={darkMode ? "dark:text-white" : ""}
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    wrapperClassName={darkMode ? "dark:text-white" : ""}
                  />
                </div>

                {/* Plate Filter */}
                <div>
                  <label
                    className={`block text-xs sm:text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                    className={`w-full px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
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
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center ${
                    darkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    darkMode ? "focus:ring-offset-gray-800" : ""
                  }`}
                >
                  <FiDownload className="mr-1 sm:mr-2" />
                  Generate Report
                </button>
                <button
                  onClick={() => window.print()}
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center ${
                    darkMode
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  } focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                    darkMode ? "focus:ring-offset-gray-800" : ""
                  }`}
                >
                  <FiPrinter className="mr-1 sm:mr-2" />
                  Print Report
                </button>
              </div>
            </div>

            {/* Report Table - Responsive with horizontal scroll on small screens */}
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div
                  className={`overflow-hidden border rounded-lg ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <table className="min-w-full divide-y">
                    <thead className={darkMode ? "bg-gray-700" : "bg-blue-50"}>
                      <tr>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          Plate
                        </th>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          Employee
                        </th>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          Destination
                        </th>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          Start Time
                        </th>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          End Time
                        </th>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          Duration
                        </th>
                        <th
                          className={`px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium uppercase tracking-wider ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        darkMode
                          ? "divide-gray-700 bg-gray-800"
                          : "divide-gray-200 bg-white"
                      }`}
                    >
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
                              className={
                                darkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-blue-50"
                              }
                            >
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {usage.plateNumber}
                              </td>
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {usage.employeeName}
                              </td>
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {usage.destination}
                              </td>
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {startTime.toLocaleString()}
                              </td>
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {endTime ? endTime.toLocaleString() : "Active"}
                              </td>
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                {duration ? `${duration} hours` : "-"}
                              </td>
                              <td
                                className={`px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                <button
                                  onClick={() => handleDeleteEntry(usage._id)}
                                  className="hover:text-red-500 transition-colors"
                                  title="Delete entry"
                                >
                                  <FiTrash2 />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className={`px-3 py-4 sm:px-6 text-center text-xs sm:text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
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
          <div
            className={`rounded-lg shadow-md p-4 sm:p-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center ${
                darkMode ? "text-white" : "text-blue-900"
              }`}
            >
              <FiClock className="inline mr-2 text-blue-500" />
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
                        className={`rounded-lg p-3 sm:p-4 hover:shadow-md transition-all ${
                          darkMode
                            ? "border-gray-700 bg-gray-700 hover:shadow-lg"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3
                              className={`text-base sm:text-lg font-semibold ${
                                darkMode ? "text-white" : "text-gray-800"
                              }`}
                            >
                              {usage.plateNumber}
                            </h3>
                            <p
                              className={`text-xs sm:text-sm mt-1 ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <FiUser className="inline mr-1" />
                              {usage.employeeName}
                            </p>
                            <p
                              className={`text-xs sm:text-sm mt-1 ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <FiMapPin className="inline mr-1" />
                              {usage.destination}
                            </p>
                            <p
                              className={`text-xs sm:text-sm mt-1 ${
                                darkMode ? "text-gray-300" : "text-gray-600"
                              }`}
                            >
                              <FiClock className="inline mr-1" />
                              {startTime.toLocaleTimeString()} - Active for{" "}
                              {durationHours} hours
                            </p>
                          </div>
                          <button
                            onClick={() => handleReturnPlate(usage._id)}
                            className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm ${
                              darkMode
                                ? "bg-green-900 text-green-200 hover:bg-green-800"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            Mark Returned
                          </button>
                        </div>
                        {usage.from && (
                          <p
                            className={`text-xs sm:text-sm mt-2 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            <span className="font-medium">from:</span>{" "}
                            {usage.from}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div
                className={`text-center py-6 sm:py-8 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p className="text-sm sm:text-base">
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
