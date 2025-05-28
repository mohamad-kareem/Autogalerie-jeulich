"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiFilter,
  FiSearch,
  FiUser,
  FiFileText,
  FiRefreshCw,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import Image from "next/image";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FixedSizeList as List } from "react-window";

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

const PriorityBadge = React.memo(({ priority, darkMode }) => {
  const priorityStyles = {
    light: {
      high: "bg-gradient-to-br from-red-500 to-orange-500",
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
      className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${
        darkMode
          ? priorityStyles.dark[priority]
          : priorityStyles.light[priority]
      } ${darkMode ? "text-white" : "text-gray-900"}`}
    >
      {priorityText[priority]}
    </span>
  );
});

const TaskCard = React.memo(
  ({ task, darkMode, handleEditTask, handleDeleteTask, admins }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div
        className={`h-full mb-3 rounded-lg border shadow-sm transition-all ${
          darkMode
            ? "bg-gray-700 border-gray-600 hover:border-blue-500"
            : "bg-white border-orange-200 hover:border-orange-400"
        }`}
      >
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3
                className={`font-medium ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {task.car}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-md ${
                    darkMode
                      ? "bg-blue-900 text-blue-200"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {task.needs}
                </span>
                <PriorityBadge priority={task.priority} darkMode={darkMode} />
              </div>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTask(task.id);
                }}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode
                    ? "text-blue-400 hover:bg-gray-600"
                    : "text-orange-600 hover:bg-orange-100"
                }`}
                title="Bearbeiten"
              >
                <FiEdit2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode
                    ? "text-red-400 hover:bg-gray-600"
                    : "text-red-600 hover:bg-red-100"
                }`}
                title="Löschen"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`mt-2 text-sm ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {isExpanded
                ? task.description
                : `${task.description.substring(0, 100)}${
                    task.description.length > 100 ? "..." : ""
                  }`}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            {task.assignedTo ? (
              <div className="flex items-center">
                <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2 border border-orange-200">
                  <Image
                    src={task.assignedTo.image}
                    alt={task.assignedTo.name}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <div
                className={`flex items-center text-xs ${
                  darkMode ? "text-blue-300" : "text-orange-500"
                }`}
              >
                <FiUser className="mr-1" />
                <span>unbekannt</span>
              </div>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs ${
                darkMode ? "text-blue-400" : "text-orange-600"
              } hover:underline cursor-pointer`}
            >
              {isExpanded ? "Weniger anzeigen" : "Mehr anzeigen"}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center">
                  <FiCalendar
                    className={`mr-2 ${
                      darkMode ? "text-blue-400" : "text-orange-500"
                    }`}
                  />
                  <span
                    className={darkMode ? "text-gray-300" : "text-gray-600"}
                  >
                    {new Date(task.createdAt).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {task.assignedBy && (
                  <div className="flex items-center">
                    <FiUser
                      className={`mr-2 ${
                        darkMode ? "text-blue-400" : "text-orange-500"
                      }`}
                    />
                    <span
                      className={darkMode ? "text-gray-300" : "text-gray-600"}
                    >
                      Besitzer: {task.assignedBy.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

const TaskColumn = React.memo(
  ({
    title,
    tasks,
    darkMode,
    handleEditTask,
    handleDeleteTask,
    admins,
    onAddTask,
    columnId,
  }) => {
    const Row = ({ index, style }) => {
      const task = tasks[index];
      return (
        <div style={style} className="px-1">
          <Draggable key={task.id} draggableId={task.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className="py-1"
              >
                <TaskCard
                  task={task}
                  darkMode={darkMode}
                  handleEditTask={handleEditTask}
                  handleDeleteTask={handleDeleteTask}
                  admins={admins}
                />
              </div>
            )}
          </Draggable>
        </div>
      );
    };

    return (
      <div
        className={`rounded-xl p-3 w-full ${
          columnId === "todo" ? "lg:w-3/4" : "lg:w-1/4"
        } shadow-inner transition-colors duration-300 ${
          darkMode
            ? "bg-gray-800"
            : "bg-gradient-to-b from-orange-100 to-amber-100"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className={`text-lg font-bold tracking-tight ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {title}{" "}
            <span className="text-xs font-normal opacity-60">
              ({tasks.length})
            </span>
          </h3>
          <button
            onClick={() => onAddTask(columnId)}
            className={`p-2 rounded-full group ${
              darkMode
                ? "text-blue-400 hover:bg-gray-700"
                : "text-orange-600 hover:bg-orange-200"
            }`}
            title="Aufgabe hinzufügen"
          >
            <FiPlus
              size={18}
              className="group-hover:rotate-90 transition-transform"
            />
          </button>
        </div>

        <Droppable
          droppableId={columnId}
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="p-1"
            >
              <TaskCard
                task={tasks[rubric.source.index]}
                darkMode={darkMode}
                handleEditTask={handleEditTask}
                handleDeleteTask={handleDeleteTask}
                admins={admins}
              />
            </div>
          )}
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${
                columnId === "todo"
                  ? "grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                  : "space-y-3"
              }`}
            >
              {columnId === "todo" ? (
                tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <TaskCard
                          task={task}
                          darkMode={darkMode}
                          handleEditTask={handleEditTask}
                          handleDeleteTask={handleDeleteTask}
                          admins={admins}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <List
                  height={Math.min(600, tasks.length * 150)}
                  itemCount={tasks.length}
                  itemSize={150}
                  width="100%"
                  outerRef={provided.innerRef}
                >
                  {Row}
                </List>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  }
);

const TaskFormModal = React.memo(
  ({
    isOpen,
    onClose,
    taskForm,
    handleInputChange,
    handleSubmit,
    isEditing,
    darkMode,
    needsOptions,
    priorityOptions,
    admins,
  }) => {
    if (!isOpen) return null;

    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          darkMode ? "bg-black/70" : "bg-black/50"
        }`}
      >
        <div
          className={`rounded-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
            darkMode
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-orange-200"
          } shadow-xl`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-xl font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {isEditing ? "Aufgabe bearbeiten" : "Neue Aufgabe erstellen"}
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-orange-100 text-orange-500"
                }`}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="car"
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-blue-300" : "text-orange-600"
                  }`}
                >
                  Fahrzeug *
                </label>
                <input
                  type="text"
                  id="car"
                  name="car"
                  value={taskForm.car}
                  onChange={handleInputChange}
                  placeholder="z.B. BMW 320d, VW Golf"
                  required
                  className={`w-full rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "border-orange-200 placeholder-orange-400"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="needs"
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-blue-300" : "text-orange-600"
                    }`}
                  >
                    Kategorie
                  </label>
                  <select
                    id="needs"
                    name="needs"
                    value={taskForm.needs}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "border-orange-200"
                    }`}
                  >
                    {needsOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-blue-300" : "text-orange-600"
                    }`}
                  >
                    Priorität
                  </label>
                  <div className="flex gap-2">
                    {priorityOptions.map((option) => (
                      <div key={option} className="flex-1">
                        <input
                          type="radio"
                          id={`priority-${option}`}
                          name="priority"
                          value={option}
                          checked={taskForm.priority === option}
                          onChange={handleInputChange}
                          className="hidden peer"
                        />
                        <label
                          htmlFor={`priority-${option}`}
                          className={`w-full block text-center py-2 px-3 text-sm rounded-lg cursor-pointer transition-all ${
                            darkMode
                              ? "peer-checked:bg-blue-600 peer-checked:text-white bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "peer-checked:bg-orange-600 peer-checked:text-white bg-orange-100 text-orange-800 hover:bg-orange-200"
                          }`}
                        >
                          {option === "high" && "Hoch"}
                          {option === "medium" && "Mittel"}
                          {option === "low" && "Niedrig"}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="assignedTo"
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-blue-300" : "text-orange-600"
                  }`}
                >
                  Zuweisen an
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={taskForm.assignedTo}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-orange-200"
                  }`}
                >
                  <option value="">unbekannt</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-blue-300" : "text-orange-600"
                  }`}
                >
                  Beschreibung
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={taskForm.description}
                  onChange={handleInputChange}
                  placeholder="Detaillierte Beschreibung der Aufgabe..."
                  rows={4}
                  className={`w-full rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "border-orange-200 placeholder-orange-400"
                  }`}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  darkMode
                    ? "text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600"
                    : "text-orange-700 hover:text-orange-900 bg-orange-100 hover:bg-orange-200"
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={!taskForm.car.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800 disabled:opacity-70"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-70"
                }`}
              >
                {isEditing ? "Speichern" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default function AdvancedTrelloPage() {
  const [tasks, setTasks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taskForm, setTaskForm] = useState({
    car: "",
    needs: "Neu Gekauft",
    description: "",
    assignedTo: "",
    priority: "medium",
    status: "todo",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [filters, setFilters] = useState({ needs: "", search: "" });
  const [darkMode, setDarkMode] = useState(false);

  const columns = useMemo(
    () => [
      { id: "todo", title: "Zu erledigen" },
      { id: "in_progress", title: "In Bearbeitung" },
    ],
    []
  );

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tasksRes, adminsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/admins"),
        ]);

        if (!tasksRes.ok || !adminsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [tasksData, adminsData] = await Promise.all([
          tasksRes.json(),
          adminsRes.json(),
        ]);

        setTasks(tasksData.map((t) => ({ ...t, id: t._id })));
        setAdmins(adminsData);
      } catch (err) {
        console.error(err);
        toast.error("Fehler beim Laden der Daten");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setIsModalOpen(false);
    setEditingTaskId(null);
    setTaskForm({
      car: "",
      needs: "Neu Gekauft",
      description: "",
      assignedTo: "",
      priority: "medium",
      status: "todo",
    });
  }, []);

  const handleAddTask = useCallback((columnId) => {
    setTaskForm((prev) => ({ ...prev, status: columnId }));
    setIsModalOpen(true);
  }, []);

  const handleSubmitTask = useCallback(async () => {
    if (!taskForm.car.trim()) {
      toast.error("Bitte Fahrzeug angeben!");
      return;
    }

    try {
      const url = editingTaskId ? "/api/tasks" : "/api/tasks";
      const method = editingTaskId ? "PATCH" : "POST";
      const body = JSON.stringify({
        ...(editingTaskId && { id: editingTaskId }),
        car: taskForm.car,
        needs: taskForm.needs,
        description: taskForm.description,
        priority: taskForm.priority,
        status: taskForm.status,
        ...(taskForm.assignedTo && { assignedTo: taskForm.assignedTo }),
      });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Speichern");
      }

      const result = await response.json();
      setTasks((prev) =>
        editingTaskId
          ? prev.map((task) =>
              task.id === result._id ? { ...result, id: result._id } : task
            )
          : [{ ...result, id: result._id }, ...prev]
      );

      toast.success(
        `Aufgabe erfolgreich ${editingTaskId ? "aktualisiert" : "erstellt"}!`,
        {
          style: {
            background: darkMode ? "#1E40AF" : "#F97316",
            color: "#fff",
          },
          iconTheme: {
            primary: darkMode ? "#1E3A8A" : "#EA580C",
            secondary: "#fff",
          },
        }
      );
      resetForm();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error(error.message || "Fehler beim Speichern der Aufgabe");
    }
  }, [taskForm, editingTaskId, darkMode, resetForm]);

  const handleEditTask = useCallback(
    (taskId) => {
      const taskToEdit = tasks.find((task) => task.id === taskId);
      if (!taskToEdit) return;

      setEditingTaskId(taskId);
      setTaskForm({
        car: taskToEdit.car,
        needs: taskToEdit.needs,
        description: taskToEdit.description,
        assignedTo: taskToEdit.assignedTo?._id || "",
        priority: taskToEdit.priority,
        status: taskToEdit.status || "todo",
      });
      setIsModalOpen(true);
    },
    [tasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId) => {
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
            background: darkMode ? "#1E40AF" : "#F97316",
            color: "#fff",
          },
          iconTheme: {
            primary: darkMode ? "#1E3A8A" : "#EA580C",
            secondary: "#fff",
          },
        });
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Fehler beim Löschen der Aufgabe");
      }
    },
    [darkMode]
  );

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksRes, adminsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/admins"),
      ]);

      if (!tasksRes.ok || !adminsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [tasksData, adminsData] = await Promise.all([
        tasksRes.json(),
        adminsRes.json(),
      ]);

      setTasks(tasksData.map((task) => ({ ...task, id: task._id })));
      setAdmins(adminsData);
      toast.success("Daten aktualisiert", {
        style: {
          background: darkMode ? "#1E40AF" : "#F97316",
          color: "#fff",
        },
        iconTheme: {
          primary: darkMode ? "#1E3A8A" : "#EA580C",
          secondary: "#fff",
        },
      });
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setIsLoading(false);
    }
  }, [darkMode]);

  const onDragEnd = useCallback(
    async (result) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const task = tasks.find((t) => t.id === draggableId);
      if (!task) return;

      // Optimistic update
      const updatedTask = { ...task, status: destination.droppableId };
      setTasks((prev) =>
        prev.map((t) => (t.id === draggableId ? updatedTask : t))
      );

      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: draggableId,
            status: destination.droppableId,
          }),
        });
      } catch (error) {
        console.error("Error updating task status:", error);
        // Revert on error
        setTasks((prev) => prev.map((t) => (t.id === draggableId ? task : t)));
        toast.error("Fehler beim Aktualisieren des Status");
      }
    },
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesNeed = !filters.needs || task.needs === filters.needs;
      const matchesSearch =
        !filters.search ||
        task.car.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description &&
          task.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()));
      return matchesNeed && matchesSearch;
    });
  }, [tasks, filters.needs, filters.search]);

  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.status === "todo"),
      in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    };
  }, [filteredTasks]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
          darkMode ? "bg-gray-900" : "bg-orange-50"
        }`}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-lg h-40 w-full ${
              darkMode ? "bg-gray-700" : "bg-orange-100"
            }`}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-b from-orange-500 to-amber-900"
      } p-2 sm:p-4`}
    >
      <div className="w-full max-w-[98vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h1
              className={`text-base sm:text-lg md:text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Aufgaben
            </h1>

            <button
              onClick={refreshData}
              className={`p-1 sm:p-2 rounded-lg ${
                darkMode
                  ? "text-blue-400 hover:bg-gray-700"
                  : "text-black hover:bg-orange-100"
              }`}
              title="Daten aktualisieren"
            >
              <FiRefreshCw className="text-base sm:text-lg" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1 sm:p-2 rounded-lg ${
                darkMode
                  ? "text-yellow-300 hover:bg-gray-700"
                  : "text-black hover:bg-orange-100"
              }`}
              title={
                darkMode ? "Zu Light Mode wechseln" : "Zu Dark Mode wechseln"
              }
            >
              {darkMode ? (
                <FiSun className="text-base sm:text-lg" />
              ) : (
                <FiMoon className="text-base sm:text-lg" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`mb-4 p-3 sm:p-4 rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch
                    className={darkMode ? "text-gray-400" : "text-orange-500"}
                  />
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Aufgaben suchen..."
                  className={`block w-full pl-10 pr-3 py-2 rounded-lg border text-xs sm:text-sm transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-orange-200 placeholder-orange-400"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                name="needs"
                value={filters.needs}
                onChange={handleFilterChange}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-orange-200"
                }`}
              >
                <option value="">Alle Kategorien</option>
                {needsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleAddTask("todo")}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                }`}
              >
                <FiPlus size={14} /> Aufgabe
              </button>
            </div>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start">
            {columns.map((column) => (
              <TaskColumn
                key={column.id}
                title={column.title}
                tasks={tasksByStatus[column.id] || []}
                darkMode={darkMode}
                handleEditTask={handleEditTask}
                handleDeleteTask={handleDeleteTask}
                admins={admins}
                onAddTask={handleAddTask}
                columnId={column.id}
              />
            ))}
          </div>
        </DragDropContext>

        {filteredTasks.length === 0 && (
          <div
            className={`mt-8 p-6 text-center rounded-lg ${
              darkMode ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <div
              className={`mx-auto h-16 w-16 sm:h-24 sm:w-24 mb-3 sm:mb-4 flex items-center justify-center ${
                darkMode ? "text-blue-400" : "text-orange-500"
              }`}
            >
              <FiFileText size={32} className="sm:size-12 opacity-50" />
            </div>
            <h3
              className={`text-base sm:text-lg font-semibold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {filters.needs || filters.search
                ? "Keine passenden Aufgaben gefunden"
                : "Keine Aufgaben vorhanden"}
            </h3>
            <p
              className={`max-w-md mx-auto mb-3 sm:mb-4 text-xs sm:text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {filters.needs || filters.search
                ? "Es gibt keine Aufgaben, die Ihren aktuellen Filtern entsprechen."
                : "Es wurden noch keine Aufgaben erstellt."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              {(filters.needs || filters.search) && (
                <button
                  onClick={() => setFilters({ needs: "", search: "" })}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-orange-100 hover:bg-orange-200 text-orange-800"
                  }`}
                >
                  Filter zurücksetzen
                </button>
              )}
              <button
                onClick={() => handleAddTask("todo")}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                }`}
              >
                <FiPlus className="mr-1 inline" /> Neue Aufgabe erstellen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {isModalOpen && (
        <TaskFormModal
          isOpen={isModalOpen}
          onClose={resetForm}
          taskForm={taskForm}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmitTask}
          isEditing={!!editingTaskId}
          darkMode={darkMode}
          needsOptions={needsOptions}
          priorityOptions={priorityOptions}
          admins={admins}
        />
      )}
    </div>
  );
}
