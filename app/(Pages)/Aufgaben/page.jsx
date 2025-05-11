"use client";

import React, { useState, useEffect } from "react";
import {
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiUser,
  FiKey,
  FiFileText,
  FiRefreshCw,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import Image from "next/image";
import toast from "react-hot-toast";

const needsOptions = [
  "Reklamation",
  "Abmelden",
  "Neu Gekauft",
  "Erledigen",
  "Termin",
  "Hassuna",
  "Fotos+inserieren",
  "Kunden",
  "verkauft",
];

const priorityOptions = ["low", "medium", "high"];

const PriorityBadge = ({ priority, darkMode }) => {
  const priorityStyles = {
    light: {
      high: "bg-gradient-to-br from-red-400 to-red-500",
      medium: "bg-gradient-to-br from-green-400 to-green-500",
      low: "bg-gradient-to-br from-blue-200 to-blue-300",
    },
    dark: {
      high: "bg-gradient-to-br from-red-600 to-red-700",
      medium: "bg-gradient-to-br from-green-600 to-green-700",
      low: "bg-gradient-to-br from-blue-400 to-blue-500",
    },
  };

  const priorityText = {
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
  };

  return (
    <span
      className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
        darkMode
          ? priorityStyles.dark[priority]
          : priorityStyles.light[priority]
      } ${darkMode ? "text-white" : "text-gray-900"}`}
    >
      {priorityText[priority]}
    </span>
  );
};

const SortIcon = ({ direction, darkMode }) => {
  return direction === "asc" ? (
    <FiChevronUp
      size={14}
      className={darkMode ? "text-blue-300" : "text-blue-500"}
    />
  ) : (
    <FiChevronDown
      size={14}
      className={darkMode ? "text-blue-300" : "text-blue-500"}
    />
  );
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({
    car: "",
    needs: "Neu Gekauft",
    description: "",
    assignedTo: "",
    priority: "medium",
  });
  const [filters, setFilters] = useState({ needs: "", search: "" });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or use system preference
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
    // Apply dark mode class to body
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tasksResponse, adminsResponse] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/admins"),
        ]);

        if (!tasksResponse.ok || !adminsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [tasksData, adminsData] = await Promise.all([
          tasksResponse.json(),
          adminsResponse.json(),
        ]);

        setTasks(tasksData.map((task) => ({ ...task, id: task._id })));
        setAdmins(adminsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Fehler beim Laden der Daten");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setIsAddingTask(false);
    setEditingTaskId(null);
    setTaskForm({
      car: "",
      needs: "Neu Gekauft",
      description: "",
      assignedTo: "",
      priority: "medium",
    });
  };

  const handleAddTask = async () => {
    if (!taskForm.car.trim()) {
      toast.error("Bitte Fahrzeug angeben!");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car: taskForm.car,
          needs: taskForm.needs,
          description: taskForm.description,
          priority: taskForm.priority,
          ...(taskForm.assignedTo && { assignedTo: taskForm.assignedTo }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Erstellen");
      }

      const newTask = await response.json();
      setTasks((prev) => [{ ...newTask, id: newTask._id }, ...prev]);
      toast.success("Aufgabe erfolgreich erstellt!", {
        style: {
          background: darkMode ? "#1E40AF" : "#2563EB",
          color: "#fff",
        },
        iconTheme: {
          primary: darkMode ? "#1E3A8A" : "#1E40AF",
          secondary: "#fff",
        },
      });
      resetForm();
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error(error.message || "Fehler beim Erstellen der Aufgabe");
    }
  };

  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (!taskToEdit) return;

    setEditingTaskId(taskId);
    setTaskForm({
      car: taskToEdit.car,
      needs: taskToEdit.needs,
      description: taskToEdit.description,
      assignedTo: taskToEdit.assignedTo?._id || "",
      priority: taskToEdit.priority,
    });
  };

  const handleUpdateTask = async () => {
    if (!taskForm.car.trim()) {
      toast.error("Bitte Fahrzeug angeben!");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTaskId,
          car: taskForm.car,
          needs: taskForm.needs,
          description: taskForm.description,
          priority: taskForm.priority,
          ...(taskForm.assignedTo && { assignedTo: taskForm.assignedTo }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Aktualisieren");
      }

      const updatedTask = await response.json();
      setTasks((prev) =>
        prev.map((task) =>
          task.id === updatedTask._id
            ? { ...updatedTask, id: updatedTask._id }
            : task
        )
      );
      toast.success("Aufgabe erfolgreich aktualisiert!", {
        style: {
          background: darkMode ? "#1E40AF" : "#2563EB",
          color: "#fff",
        },
        iconTheme: {
          primary: darkMode ? "#1E3A8A" : "#1E40AF",
          secondary: "#fff",
        },
      });
      resetForm();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Fehler beim Aktualisieren der Aufgabe");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Möchten Sie diese Aufgabe wirklich löschen?")) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Löschen");
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Aufgabe erfolgreich gelöscht!", {
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
      console.error("Error deleting task:", error);
      toast.error("Fehler beim Löschen der Aufgabe");
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const filteredTasks = sortedTasks.filter((task) => {
    const matchesNeed = !filters.needs || task.needs === filters.needs;
    const matchesSearch =
      !filters.search ||
      task.car.toLowerCase().includes(filters.search.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesNeed && matchesSearch;
  });

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, adminsResponse] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/admins"),
      ]);

      if (!tasksResponse.ok || !adminsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const [tasksData, adminsData] = await Promise.all([
        tasksResponse.json(),
        adminsResponse.json(),
      ]);

      setTasks(tasksData.map((task) => ({ ...task, id: task._id })));
      setAdmins(adminsData);
      setIsLoading(false);
      toast.success("Daten aktualisiert", {
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
      console.error("Refresh error:", error);
      toast.error("Fehler beim Aktualisieren");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${
          darkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-blue-300 to-blue-900"
        } p-10 md:pl-17 mt-10`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
                darkMode ? "border-blue-500" : "border-white"
              }`}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900" : "bg-gradient-to-br from-blue-400 to-blue-950"
      } p-4`}
    >
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-4">
          {/* Title always on top */}
          <h1
            className={`text-xl sm:text-2xl font-bold ${
              darkMode ? "text-white" : "text-white"
            }`}
          >
            Aufgabenverwaltung
          </h1>

          {/* On mobile: task count + toggle icon side-by-side
      On larger: stack under title */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className={darkMode ? "text-blue-300" : "text-blue-100"}>
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "Aufgabe" : "Aufgaben"} gefunden
            </p>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "bg-blue-800 text-yellow-300 hover:bg-blue-700"
                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
              } transition-colors`}
              title={
                darkMode ? "Zu Light Mode wechseln" : "Zu Dark Mode wechseln"
              }
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`rounded-xl shadow-md overflow-hidden mb-8 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div
            className={`px-6 py-4 border-b ${
              darkMode
                ? "border-gray-700 bg-gray-700"
                : "border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100"
            } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center">
                <FiFilter
                  className={
                    darkMode ? "text-blue-400 mr-2" : "text-blue-500 mr-2"
                  }
                />
                <select
                  name="needs"
                  value={filters.needs}
                  onChange={handleFilterChange}
                  className={`rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    darkMode
                      ? "bg-gray-600 border-gray-600 text-white"
                      : "bg-white border-blue-200"
                  }`}
                >
                  <option value="">Alle Kategorien</option>
                  {needsOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch
                    className={darkMode ? "text-blue-400" : "text-blue-400"}
                  />
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Aufgaben suchen..."
                  className={`block w-full pl-10 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all ${
                    darkMode
                      ? "bg-gray-600 border-gray-600 text-white placeholder-gray-300"
                      : "bg-white border-blue-200"
                  }`}
                />
              </div>

              <button
                onClick={() => setIsAddingTask(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <FiPlus size={16} /> Neue Aufgabe
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? "bg-gray-700" : "bg-blue-50"}>
                <tr>
                  <th
                    onClick={() => requestSort("car")}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode
                        ? "text-blue-300 hover:bg-gray-600"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Fahrzeug
                      {sortConfig.key === "car" && (
                        <SortIcon
                          direction={sortConfig.direction}
                          darkMode={darkMode}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => requestSort("needs")}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                      darkMode
                        ? "text-blue-300 hover:bg-gray-600"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Kategorie
                      {sortConfig.key === "needs" && (
                        <SortIcon
                          direction={sortConfig.direction}
                          darkMode={darkMode}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    Beschreibung
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    Zugewiesen
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    Priorität
                  </th>
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                      darkMode ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    Aktionen
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
                {isAddingTask && (
                  <tr className={darkMode ? "bg-gray-700" : "bg-blue-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="car"
                        value={taskForm.car}
                        onChange={handleInputChange}
                        placeholder="Fahrzeug"
                        required
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        name="needs"
                        value={taskForm.needs}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      >
                        {needsOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="description"
                        value={taskForm.description}
                        onChange={handleInputChange}
                        placeholder="Beschreibung"
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        name="assignedTo"
                        value={taskForm.assignedTo}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      >
                        <option value="">Nicht zugewiesen</option>
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      >
                        {priorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={handleAddTask}
                        disabled={!taskForm.car.trim()}
                        className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                        title="Speichern"
                      >
                        <FiCheck />
                      </button>
                      <button
                        onClick={resetForm}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                        title="Abbrechen"
                      >
                        <FiX />
                      </button>
                    </td>
                  </tr>
                )}

                {editingTaskId && (
                  <tr className={darkMode ? "bg-gray-700" : "bg-blue-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        name="car"
                        value={taskForm.car}
                        onChange={handleInputChange}
                        required
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        name="needs"
                        value={taskForm.needs}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      >
                        {needsOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        name="description"
                        value={taskForm.description}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        name="assignedTo"
                        value={taskForm.assignedTo}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      >
                        <option value="">Nicht zugewiesen</option>
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleInputChange}
                        className={`rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          darkMode
                            ? "bg-gray-600 border-gray-600 text-white"
                            : "border-blue-200"
                        }`}
                      >
                        {priorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={handleUpdateTask}
                        disabled={!taskForm.car.trim()}
                        className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                        title="Speichern"
                      >
                        <FiCheck />
                      </button>
                      <button
                        onClick={resetForm}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                        title="Abbrechen"
                      >
                        <FiX />
                      </button>
                    </td>
                  </tr>
                )}

                {filteredTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr
                      className={`cursor-pointer transition-colors ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-blue-50"
                      } ${
                        expandedTaskId === task.id
                          ? darkMode
                            ? "bg-gray-700"
                            : "bg-blue-50"
                          : ""
                      }`}
                      onClick={() =>
                        setExpandedTaskId(
                          expandedTaskId === task.id ? null : task.id
                        )
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-semibold ${
                            darkMode ? "text-white" : "text-blue-900"
                          }`}
                        >
                          {task.car}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm px-3 py-1 rounded-md inline-block ${
                            darkMode
                              ? "bg-blue-900 text-blue-200"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {task.needs}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-sm max-w-xs truncate ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {task.description || (
                            <span
                              className={
                                darkMode
                                  ? "text-gray-400 italic"
                                  : "text-gray-400 italic"
                              }
                            >
                              Keine Beschreibung
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.assignedTo ? (
                          <div className="flex items-center">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border border-blue-200">
                              <Image
                                src={task.assignedTo.image}
                                alt={task.assignedTo.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span
                              className={`text-sm ${
                                darkMode ? "text-white" : "text-blue-800"
                              }`}
                            >
                              {task.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center ${
                              darkMode ? "text-blue-300" : "text-blue-400"
                            }`}
                          >
                            <FiUser className="mr-2" />
                            <span className="text-sm">Nicht zugewiesen</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PriorityBadge
                          priority={task.priority}
                          darkMode={darkMode}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? "text-blue-400 hover:bg-gray-600"
                              : "text-blue-600 hover:bg-blue-100"
                          }`}
                          title="Bearbeiten"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? "text-red-400 hover:bg-gray-600"
                              : "text-red-600 hover:bg-red-100"
                          }`}
                          title="Löschen"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>

                    {expandedTaskId === task.id && (
                      <tr className={darkMode ? "bg-gray-700" : "bg-blue-50"}>
                        <td colSpan="6" className="px-6 py-4">
                          <div
                            className={`p-6 rounded-lg border ${
                              darkMode
                                ? "bg-gray-800 border-gray-600 shadow-xs"
                                : "bg-white border-blue-200 shadow-xs"
                            }`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2">
                                <div className="flex items-center mb-4">
                                  <div
                                    className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${
                                      darkMode ? "bg-blue-500" : "bg-blue-500"
                                    }`}
                                  ></div>
                                  <h3
                                    className={`text-lg font-semibold ${
                                      darkMode ? "text-white" : "text-blue-800"
                                    }`}
                                  >
                                    Aufgabendetails
                                  </h3>
                                </div>
                                <div className="prose prose-sm max-w-none">
                                  {task.description ? (
                                    <div
                                      className={`whitespace-pre-line p-4 rounded-lg border ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-gray-200"
                                          : "bg-blue-50 border-blue-200 text-gray-600"
                                      }`}
                                    >
                                      {task.description}
                                    </div>
                                  ) : (
                                    <div
                                      className={`italic p-4 rounded-lg border ${
                                        darkMode
                                          ? "bg-gray-700 border-gray-600 text-gray-400"
                                          : "bg-blue-50 border-blue-200 text-blue-400"
                                      }`}
                                    >
                                      Keine Beschreibung vorhanden
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center">
                                  <div
                                    className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${
                                      darkMode ? "bg-blue-500" : "bg-blue-500"
                                    }`}
                                  ></div>
                                  <h3
                                    className={`text-lg font-semibold ${
                                      darkMode ? "text-white" : "text-blue-800"
                                    }`}
                                  >
                                    Weitere Details
                                  </h3>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <FiCalendar
                                        className={
                                          darkMode
                                            ? "text-blue-400"
                                            : "text-blue-400"
                                        }
                                      />
                                    </div>
                                    <div className="ml-3">
                                      <p
                                        className={`text-sm font-medium ${
                                          darkMode
                                            ? "text-blue-400"
                                            : "text-blue-500"
                                        }`}
                                      >
                                        Erstellt am
                                      </p>
                                      <p
                                        className={`text-sm ${
                                          darkMode
                                            ? "text-white"
                                            : "text-blue-800"
                                        }`}
                                      >
                                        {new Date(
                                          task.createdAt
                                        ).toLocaleDateString("de-DE", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  {task.assignedBy && (
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0 mt-1">
                                        <FiUser
                                          className={
                                            darkMode
                                              ? "text-blue-400"
                                              : "text-blue-400"
                                          }
                                        />
                                      </div>
                                      <div className="ml-3">
                                        <p
                                          className={`text-sm font-medium ${
                                            darkMode
                                              ? "text-blue-400"
                                              : "text-blue-500"
                                          }`}
                                        >
                                          Erstellt von
                                        </p>
                                        <div className="flex items-center mt-1">
                                          <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2 border border-blue-200">
                                            <Image
                                              src={task.assignedBy.image}
                                              alt={task.assignedBy.name}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                          <p
                                            className={`text-sm ${
                                              darkMode
                                                ? "text-white"
                                                : "text-blue-800"
                                            }`}
                                          >
                                            {task.assignedBy.name}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <FiKey
                                        className={
                                          darkMode
                                            ? "text-blue-400"
                                            : "text-blue-400"
                                        }
                                      />
                                    </div>
                                    <div className="ml-3">
                                      <p
                                        className={`text-sm font-medium ${
                                          darkMode
                                            ? "text-blue-400"
                                            : "text-blue-500"
                                        }`}
                                      >
                                        Priorität
                                      </p>
                                      <div className="mt-1">
                                        <PriorityBadge
                                          priority={task.priority}
                                          darkMode={darkMode}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && !isAddingTask && !editingTaskId && (
            <div className="p-12 text-center">
              <div
                className={`mx-auto h-24 w-24 mb-4 flex items-center justify-center ${
                  darkMode ? "text-blue-400" : "text-blue-400"
                }`}
              >
                <FiFileText size={48} className="opacity-50" />
              </div>
              <h3
                className={`text-lg font-semibold mb-1 ${
                  darkMode ? "text-white" : "text-blue-800"
                }`}
              >
                {filters.needs || filters.search
                  ? "Keine passenden Aufgaben gefunden"
                  : "Keine Aufgaben vorhanden"}
              </h3>
              <p className="text-blue-600 max-w-md mx-auto mb-4">
                {filters.needs || filters.search
                  ? "Es gibt keine Aufgaben, die Ihren aktuellen Filtern entsprechen."
                  : "Es wurden noch keine Aufgaben erstellt oder alle Aufgaben wurden abgeschlossen."}
              </p>
              <div className="flex justify-center gap-3">
                {(filters.needs || filters.search) && (
                  <button
                    onClick={() => setFilters({ needs: "", search: "" })}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center transition-colors"
                  >
                    Filter zurücksetzen
                  </button>
                )}
                <button
                  onClick={() => setIsAddingTask(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center transition-colors shadow-sm"
                >
                  <FiPlus className="mr-2" /> Neue Aufgabe erstellen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
