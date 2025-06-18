"use client";
import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FiPlus,
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiCopy,
  FiMove,
  FiX,
  FiSave,
  FiCheckCircle,
  FiPaperclip,
  FiMessageSquare,
  FiChevronDown,
} from "react-icons/fi";

export default function TrelloClone() {
  const [board, setBoard] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    column: "",
    color: "gray", // Default color
  });
  const [editingTask, setEditingTask] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [showAddListInput, setShowAddListInput] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);
  const [activeTaskMenu, setActiveTaskMenu] = useState(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  // Priority options
  const priorities = [
    { value: "red", label: "High Priority" },
    { value: "orange", label: "Medium Priority" },
    { value: "green", label: "Low Priority" },
    { value: "blue", label: "Normal" },
    { value: "purple", label: "Feature" },
    { value: "gray", label: "No Priority" },
  ];

  // Modern color palette with blue accent
  const colors = {
    background: "bg-gradient-to-br from-indigo-800 to-black/70",
    columnBg: "bg-black/30",
    columnHeaderBg: "bg-black/30",
    cardBg: "bg-gray-200",
    cardHover: "hover:bg-blue-50",
    cardBorder: "border-gray-800",
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-gray-200 hover:bg-gray-300",
    danger: "bg-red-500 hover:bg-red-600",
    success: "bg-green-500 hover:bg-green-600",
    text: "text-gray-700",
    textSecondary: "text-gray-500",
    accent: "border-blue-500",

    scrollbar: "custom-scroll",
    headerBg: "bg-black/30",
    buttonText: "text-gray-100",
    columnText: "text-gray-100 font-semibold",
    addListButton: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  };

  const getPriorityBorderClass = (color) => {
    return (
      {
        red: "border-red-500",
        orange: "border-orange-500",
        green: "border-green-500",
        blue: "border-blue-500",
        purple: "border-purple-500",
        gray: "border-gray-300",
      }[color] || "border-gray-300"
    );
  };

  const getPriorityBgClass = (color) => {
    return (
      {
        red: "bg-red-500",
        orange: "bg-orange-500",
        green: "bg-green-500",
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        gray: "bg-gray-300",
      }[color] || "bg-gray-300"
    );
  };
  const getPriorityTextClass = (color) => {
    return (
      {
        red: "text-red-500",
        orange: "text-orange-500",
        green: "text-green-500",
        blue: "text-blue-500",
        purple: "text-purple-500",
        gray: "text-gray-300",
      }[color] || "text-gray-300"
    );
  };
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowColumnMenu(null);
        setActiveTaskMenu(null);
        setShowPriorityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminResponse = await fetch("/api/admins");
        const adminData = await adminResponse.json();
        setAdmins(adminData);

        const boardResponse = await fetch("/api/board");
        const boardData = await boardResponse.json();
        setBoard(boardData);
      } catch (error) {
        console.error("Daten konnten nicht geladen werden:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateBoard = async (action, payload) => {
    try {
      const response = await fetch("/api/board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, payload }),
      });
      const updatedBoard = await response.json();
      setBoard(updatedBoard);
      return updatedBoard;
    } catch (error) {
      console.error("Board konnte nicht aktualisiert werden:", error);
      throw error;
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "COLUMN") {
      const newColumns = [...board.columns];
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      newColumns.forEach((column, index) => {
        column.position = index;
      });

      setBoard({ ...board, columns: newColumns });
      await updateBoard("UPDATE_COLUMNS", { columns: newColumns });
      return;
    }

    const newColumns = board.columns.map((col) => ({
      ...col,
      tasks: [...col.tasks],
    }));

    const sourceColIndex = newColumns.findIndex(
      (col) => col.name === source.droppableId
    );
    const destColIndex = newColumns.findIndex(
      (col) => col.name === destination.droppableId
    );

    const sourceCol = newColumns[sourceColIndex];
    const destCol = newColumns[destColIndex];

    const [movedTask] = sourceCol.tasks.splice(source.index, 1);

    if (sourceColIndex === destColIndex) {
      sourceCol.tasks.splice(destination.index, 0, movedTask);
      sourceCol.tasks.forEach((task, idx) => (task.position = idx));
    } else {
      destCol.tasks.splice(destination.index, 0, movedTask);
      sourceCol.tasks.forEach((task, idx) => (task.position = idx));
      destCol.tasks.forEach((task, idx) => (task.position = idx));
    }

    setBoard({ ...board, columns: newColumns });
    await updateBoard("UPDATE_COLUMNS", { columns: newColumns });
  };

  const addTask = async (columnName) => {
    if (!newTask.title.trim()) return;

    await updateBoard("ADD_TASK", {
      columnName,
      title: newTask.title,
      description: newTask.description,
      color: newTask.color,
    });

    setNewTask({ title: "", description: "", column: "", color: "gray" });
  };

  const startEditingTask = (columnName, task) => {
    setEditingTask({
      columnName,
      taskId: task._id,
      title: task.title,
      description: task.description || "",
      color: task.color || "gray",
    });
  };

  const saveEditedTask = async () => {
    if (!editingTask?.title.trim()) return;

    await updateBoard("UPDATE_TASK", {
      columnName: editingTask.columnName,
      taskId: editingTask.taskId,
      updates: {
        title: editingTask.title,
        description: editingTask.description,
        color: editingTask.color,
      },
    });

    setEditingTask(null);
  };

  const toggleComplete = async (columnName, taskId) => {
    await updateBoard("UPDATE_TASK", {
      columnName,
      taskId,
      updates: {
        completed: !board.columns
          .find((col) => col.name === columnName)
          .tasks.find((t) => t._id === taskId).completed,
      },
    });
  };

  const deleteTask = async (columnName, taskId) => {
    await updateBoard("REMOVE_TASK", {
      columnName,
      taskId,
    });
  };

  const copyList = async (colName) => {
    const columnToCopy = board.columns.find((col) => col.name === colName);
    if (!columnToCopy) return;

    const newName = `${colName} (Kopie)`;
    await updateBoard("ADD_COLUMN", {
      name: newName,
    });

    for (const task of columnToCopy.tasks) {
      await updateBoard("ADD_TASK", {
        columnName: newName,
        title: task.title,
        description: task.description,
        color: task.color || "gray",
      });
    }

    setShowColumnMenu(null);
  };

  const moveListToEnd = async (colName) => {
    const newColumns = board.columns.filter((col) => col.name !== colName);
    const columnToMove = board.columns.find((col) => col.name === colName);
    newColumns.push(columnToMove);

    await updateBoard("UPDATE_COLUMNS", {
      columns: newColumns,
    });

    setShowColumnMenu(null);
  };

  const deleteColumn = async (colName) => {
    if (confirm(`Möchten Sie die Spalte "${colName}" wirklich löschen?`)) {
      await updateBoard("DELETE_COLUMN", {
        columnName: colName,
      });
      setShowColumnMenu(null);
    }
  };

  const addColumn = async () => {
    if (!newListName.trim()) return;

    await updateBoard("ADD_COLUMN", {
      name: newListName,
    });

    setNewListName("");
    setShowAddListInput(false);
  };

  const handlePriorityChange = (color) => {
    if (editingTask) {
      setEditingTask({ ...editingTask, color });
    } else {
      setNewTask({ ...newTask, color });
    }
    setShowPriorityDropdown(false);
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${colors.background} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-600">Lade Board...</div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div
        className={`min-h-screen ${colors.background} flex items-center justify-center`}
      >
        <div className="text-center p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-md">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Board konnte nicht geladen werden
          </h2>
          <p className="text-gray-500 mb-4">
            Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es
            erneut.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`${colors.primary} px-4 py-2 rounded text-white font-medium`}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} pb-8 `}>
      {/* Header */}
      <header
        className={`${colors.headerBg} py-4 px-6 shadow-sm border-b border-gray-800 sticky top-0 z-10`}
      >
        <div className="max-w-[1800px] mx-auto flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {admins.map((admin, index) => (
                <div key={index} className="relative group">
                  <img
                    src={admin.image || "/default-avatar.png"}
                    alt={admin.name}
                    className="w-8 h-8 rounded-full border-2 border-white hover:border-blue-500 transition-all"
                  />
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {admin.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">
            بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم
          </h1>
        </div>
      </header>

      {/* Board Content */}
      <div className="pt-6 px-4 max-w-[1800px] mx-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="COLUMN"
          >
            {(provided) => (
              <div className="w-full overflow-x-auto overflow-y-hidden pb-4">
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex items-start gap-4 min-h-[calc(100vh-120px)]"
                >
                  {board.columns
                    .sort((a, b) => a.position - b.position)
                    .map((column, index) => (
                      <Draggable
                        key={column.name}
                        draggableId={column.name}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`${colors.columnBg} w-77 flex-shrink-0 rounded-lg shadow-xs border ${colors.cardBorder}`}
                            style={provided.draggableProps.style}
                          >
                            {/* Column Header */}
                            <div
                              {...provided.dragHandleProps}
                              className={`${colors.columnHeaderBg} px-3 py-3 rounded-t-lg flex justify-between items-center sticky top-0 z-10 border-b ${colors.cardBorder}`}
                            >
                              <div className="flex items-center">
                                <h2 className={`${colors.columnText} text-sm`}>
                                  {column.name}
                                </h2>
                                <span className="ml-2 text-xs bg-black/30 text-gray-300 px-2 py-0.5 rounded-full">
                                  {column.tasks.length}
                                </span>
                              </div>
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setShowColumnMenu(
                                      showColumnMenu === column.name
                                        ? null
                                        : column.name
                                    )
                                  }
                                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
                                >
                                  <FiMoreVertical size={16} />
                                </button>

                                {showColumnMenu === column.name && (
                                  <div
                                    ref={menuRef}
                                    className={`absolute bg-white ${
                                      colors.text
                                    } rounded shadow-lg w-48 p-1 z-50 border ${
                                      colors.cardBorder
                                    } ${isMobile ? "left-0" : "right-0"} top-8`}
                                  >
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-100 text-sm rounded text-left"
                                      onClick={() => {
                                        setNewTask({
                                          column: column.name,
                                          title: "",
                                          description: "",
                                          color: "gray",
                                        });
                                        setShowColumnMenu(null);
                                      }}
                                    >
                                      <FiPlus className="mr-2" size={14} />{" "}
                                      Aufgabe hinzufügen
                                    </button>
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-100 text-sm rounded text-left"
                                      onClick={() => copyList(column.name)}
                                    >
                                      <FiCopy className="mr-2" size={14} />{" "}
                                      Liste kopieren
                                    </button>
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-100 text-sm rounded text-left"
                                      onClick={() => moveListToEnd(column.name)}
                                    >
                                      <FiMove className="mr-2" size={14} /> Ans
                                      Ende verschieben
                                    </button>
                                    <hr className="my-1 border-gray-200" />
                                    <button
                                      onClick={() => deleteColumn(column.name)}
                                      className="flex items-center w-full p-2 text-red-500 hover:bg-gray-100 text-sm rounded text-left"
                                    >
                                      <FiTrash2 className="mr-2" size={14} />
                                      Liste löschen
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tasks List */}
                            <Droppable droppableId={column.name} type="TASK">
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`p-2 overflow-y-auto ${colors.scrollbar}`}
                                  style={{
                                    minHeight: "5px",
                                    maxHeight: "calc(100vh - 180px)",
                                  }}
                                >
                                  {column.tasks
                                    .sort((a, b) => a.position - b.position)
                                    .map((task, index) => (
                                      <Draggable
                                        draggableId={task._id}
                                        index={index}
                                        key={task._id}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`${
                                              colors.cardBg
                                            } p-3 rounded mb-2 shadow-xs border-l-5 ${getPriorityBorderClass(
                                              task.color
                                            )} border ${
                                              task.completed
                                                ? colors.completed
                                                : colors.cardBorder
                                            } ${
                                              colors.cardHover
                                            } transition-all`}
                                          >
                                            {editingTask?.taskId ===
                                            task._id ? (
                                              <div className="space-y-2">
                                                <input
                                                  type="text"
                                                  className={`w-full p-2 text-sm rounded bg-white ${colors.text} border ${colors.cardBorder} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                                  value={editingTask.title}
                                                  onChange={(e) =>
                                                    setEditingTask({
                                                      ...editingTask,
                                                      title: e.target.value,
                                                    })
                                                  }
                                                  autoFocus
                                                />
                                                <textarea
                                                  className={`w-full p-2 text-sm rounded bg-white ${colors.text} border ${colors.cardBorder} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                                  value={
                                                    editingTask.description
                                                  }
                                                  onChange={(e) =>
                                                    setEditingTask({
                                                      ...editingTask,
                                                      description:
                                                        e.target.value,
                                                    })
                                                  }
                                                  rows={3}
                                                  placeholder="Beschreibung hinzufügen..."
                                                />
                                                <div className="relative">
                                                  <button
                                                    onClick={() =>
                                                      setShowPriorityDropdown(
                                                        !showPriorityDropdown
                                                      )
                                                    }
                                                    className={`w-full text-left px-3 py-2 text-sm rounded border ${colors.cardBorder} flex items-center justify-between`}
                                                  >
                                                    <div className="flex items-center">
                                                      <div
                                                        className={`w-3 h-3 rounded-full mr-2 ${getPriorityBgClass(
                                                          editingTask.color
                                                        )}`}
                                                      ></div>
                                                      {
                                                        priorities.find(
                                                          (p) =>
                                                            p.value ===
                                                            editingTask.color
                                                        )?.label
                                                      }
                                                    </div>
                                                    <FiChevronDown
                                                      className={`transition-transform ${
                                                        showPriorityDropdown
                                                          ? "rotate-180"
                                                          : ""
                                                      }`}
                                                    />
                                                  </button>
                                                  {showPriorityDropdown && (
                                                    <div
                                                      ref={menuRef}
                                                      className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200"
                                                    >
                                                      {priorities.map(
                                                        (priority) => (
                                                          <button
                                                            key={priority.value}
                                                            onClick={() =>
                                                              handlePriorityChange(
                                                                priority.value
                                                              )
                                                            }
                                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center ${
                                                              editingTask.color ===
                                                              priority.value
                                                                ? "bg-blue-50"
                                                                : ""
                                                            }`}
                                                          >
                                                            <div
                                                              className={`w-3 h-3 rounded-full mr-2 ${getPriorityBgClass(
                                                                priority.value
                                                              )}`}
                                                            ></div>
                                                            {priority.label}
                                                          </button>
                                                        )
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                  <button
                                                    onClick={saveEditedTask}
                                                    className={`${colors.primary} px-3 py-1.5 rounded text-white text-xs flex items-center`}
                                                  >
                                                    <FiSave
                                                      className="mr-1"
                                                      size={12}
                                                    />{" "}
                                                    Speichern
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      setEditingTask(null)
                                                    }
                                                    className={`${colors.secondary} px-3 py-1.5 rounded ${colors.text} text-xs flex items-center`}
                                                  >
                                                    <FiX
                                                      className="mr-1"
                                                      size={12}
                                                    />{" "}
                                                    Abbrechen
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="relative">
                                                  {task.completed && (
                                                    <div className="absolute top-1 left-0">
                                                      <FiCheckCircle
                                                        className={getPriorityTextClass(
                                                          task.color
                                                        )}
                                                        size={20}
                                                      />
                                                    </div>
                                                  )}
                                                  <div
                                                    className={`${
                                                      task.completed
                                                        ? "pl-7"
                                                        : ""
                                                    } cursor-pointer`}
                                                    onClick={() =>
                                                      setActiveTaskMenu(
                                                        activeTaskMenu ===
                                                          task._id
                                                          ? null
                                                          : task._id
                                                      )
                                                    }
                                                  >
                                                    <h3
                                                      className={`text-sm font-medium ${
                                                        colors.text
                                                      } ${
                                                        task.completed
                                                          ? "line-through text-gray-300"
                                                          : ""
                                                      }`}
                                                    >
                                                      {task.title}
                                                    </h3>
                                                    {task.description && (
                                                      <p
                                                        className={`text-xs ${colors.textSecondary} mt-1 line-clamp-2`}
                                                      >
                                                        {task.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>

                                                {activeTaskMenu ===
                                                  task._id && (
                                                  <div
                                                    ref={menuRef}
                                                    className="absolute bg-white shadow-lg rounded-md border border-gray-200 z-50 p-2 w-64 mt-1"
                                                  >
                                                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                                                      <h4 className="font-medium text-sm">
                                                        Aufgabenaktionen
                                                      </h4>
                                                      <button
                                                        onClick={() =>
                                                          setActiveTaskMenu(
                                                            null
                                                          )
                                                        }
                                                        className="text-gray-500 hover:text-gray-800"
                                                      >
                                                        <FiX size={16} />
                                                      </button>
                                                    </div>
                                                    <button
                                                      onClick={() => {
                                                        startEditingTask(
                                                          column.name,
                                                          task
                                                        );
                                                        setActiveTaskMenu(null);
                                                      }}
                                                      className="flex items-center w-full p-2 hover:bg-gray-100 text-sm rounded text-left"
                                                    >
                                                      <FiEdit2
                                                        className="mr-2"
                                                        size={14}
                                                      />{" "}
                                                      Bearbeiten
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        toggleComplete(
                                                          column.name,
                                                          task._id
                                                        );
                                                        setActiveTaskMenu(null);
                                                      }}
                                                      className="flex items-center w-full p-2 hover:bg-gray-100 text-sm rounded text-left"
                                                    >
                                                      <FiCheckCircle
                                                        className="mr-2"
                                                        size={14}
                                                      />{" "}
                                                      {task.completed
                                                        ? "Als unvollständig markieren"
                                                        : "Als erledigt markieren"}
                                                    </button>
                                                    <div className="px-2 py-1 text-xs font-medium text-gray-500">
                                                      Priorität ändern
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 p-1">
                                                      {priorities.map(
                                                        (priority) => (
                                                          <button
                                                            key={priority.value}
                                                            onClick={() => {
                                                              updateBoard(
                                                                "UPDATE_TASK",
                                                                {
                                                                  columnName:
                                                                    column.name,
                                                                  taskId:
                                                                    task._id,
                                                                  updates: {
                                                                    color:
                                                                      priority.value,
                                                                  },
                                                                }
                                                              );
                                                              setActiveTaskMenu(
                                                                null
                                                              );
                                                            }}
                                                            className={`px-2 py-1 text-xs rounded border ${
                                                              task.color ===
                                                              priority.value
                                                                ? "ring-2 ring-offset-1 ring-blue-500"
                                                                : "border-transparent"
                                                            } ${getPriorityBgClass(
                                                              priority.value
                                                            )} bg-opacity-20 hover:bg-opacity-30`}
                                                          >
                                                            {priority.label}
                                                          </button>
                                                        )
                                                      )}
                                                    </div>
                                                    <hr className="my-1 border-gray-200" />
                                                    <button
                                                      onClick={() => {
                                                        deleteTask(
                                                          column.name,
                                                          task._id
                                                        );
                                                        setActiveTaskMenu(null);
                                                      }}
                                                      className="flex items-center w-full p-2 text-red-500 hover:bg-gray-100 text-sm rounded text-left"
                                                    >
                                                      <FiTrash2
                                                        className="mr-2"
                                                        size={14}
                                                      />{" "}
                                                      Löschen
                                                    </button>
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  {provided.placeholder}

                                  {/* Add Task Section */}
                                  {newTask.column === column.name ? (
                                    <div
                                      className={`bg-white p-3 rounded shadow-xs border ${colors.cardBorder}`}
                                    >
                                      <input
                                        type="text"
                                        className={`w-full p-2 text-sm rounded bg-white ${colors.text} border ${colors.cardBorder} mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                        placeholder="Aufgabentitel"
                                        value={newTask.title}
                                        onChange={(e) =>
                                          setNewTask({
                                            ...newTask,
                                            title: e.target.value,
                                          })
                                        }
                                        autoFocus
                                      />
                                      <textarea
                                        className={`w-full p-2 text-sm rounded bg-white ${colors.text} border ${colors.cardBorder} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                                        placeholder="Beschreibung (optional)"
                                        rows={2}
                                        value={newTask.description}
                                        onChange={(e) =>
                                          setNewTask({
                                            ...newTask,
                                            description: e.target.value,
                                          })
                                        }
                                      ></textarea>
                                      <div className="mt-2 mb-3">
                                        <label className="block text-xs text-gray-500 mb-1">
                                          Priorität
                                        </label>
                                        <div className="relative">
                                          <button
                                            onClick={() =>
                                              setShowPriorityDropdown(
                                                !showPriorityDropdown
                                              )
                                            }
                                            className={`w-full text-left px-3 py-2 text-sm rounded border ${colors.cardBorder} flex items-center justify-between`}
                                          >
                                            <div className="flex items-center">
                                              <div
                                                className={`w-3 h-3 rounded-full mr-2 ${getPriorityBgClass(
                                                  newTask.color
                                                )}`}
                                              ></div>
                                              {
                                                priorities.find(
                                                  (p) =>
                                                    p.value === newTask.color
                                                )?.label
                                              }
                                            </div>
                                            <FiChevronDown
                                              className={`transition-transform ${
                                                showPriorityDropdown
                                                  ? "rotate-180"
                                                  : ""
                                              }`}
                                            />
                                          </button>
                                          {showPriorityDropdown && (
                                            <div
                                              ref={menuRef}
                                              className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200"
                                            >
                                              {priorities.map((priority) => (
                                                <button
                                                  key={priority.value}
                                                  onClick={() =>
                                                    handlePriorityChange(
                                                      priority.value
                                                    )
                                                  }
                                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center ${
                                                    newTask.color ===
                                                    priority.value
                                                      ? "bg-blue-50"
                                                      : ""
                                                  }`}
                                                >
                                                  <div
                                                    className={`w-3 h-3 rounded-full mr-2 ${getPriorityBgClass(
                                                      priority.value
                                                    )}`}
                                                  ></div>
                                                  {priority.label}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <button
                                          onClick={() => addTask(column.name)}
                                          className={`${colors.primary} px-3 py-1.5 rounded text-white text-xs font-medium`}
                                        >
                                          Aufgabe hinzufügen
                                        </button>
                                        <button
                                          onClick={() =>
                                            setNewTask({
                                              title: "",
                                              description: "",
                                              column: "",
                                              color: "gray",
                                            })
                                          }
                                          className={`${colors.secondary} px-3 py-1.5 rounded ${colors.text} text-xs font-medium`}
                                        >
                                          Abbrechen
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setNewTask({
                                          ...newTask,
                                          column: column.name,
                                          color: "gray",
                                        })
                                      }
                                      className={`text-sm ${colors.textSecondary} mt-1 hover:bg-gray-200 w-full p-2 rounded flex items-center transition-colors`}
                                    >
                                      <FiPlus className="mr-2" size={14} />{" "}
                                      Aufgabe hinzufügen
                                    </button>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}

                  {/* Add New List Section */}
                  <div className="w-72 flex-shrink-0">
                    {showAddListInput ? (
                      <div
                        className={`bg-white border ${colors.cardBorder} p-3 rounded-lg shadow-xs`}
                      >
                        <input
                          type="text"
                          placeholder="Listenname eingeben..."
                          className={`w-full p-2 mb-2 text-sm bg-white ${colors.text} rounded border ${colors.cardBorder} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={addColumn}
                            className={`${colors.primary} px-3 py-2 text-xs rounded text-white font-medium`}
                          >
                            Liste erstellen
                          </button>
                          <button
                            onClick={() => setShowAddListInput(false)}
                            className={`${colors.secondary} px-3 py-2 text-xs rounded ${colors.text} font-medium`}
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddListInput(true)}
                        className={`w-full ${colors.addListButton} p-3 rounded-lg transition-all flex items-center justify-start space-x-2`}
                      >
                        <FiPlus size={16} className="text-gray-500" />
                        <span className="text-sm">Neue Liste hinzufügen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
