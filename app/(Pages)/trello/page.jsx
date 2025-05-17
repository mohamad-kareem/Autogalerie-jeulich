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
} from "react-icons/fi";

export default function TrelloClone() {
  const [board, setBoard] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    column: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [showAddListInput, setShowAddListInput] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef(null);

  // Dark orange gradient color palette
  const colors = {
    background: "bg-gradient-to-br from-amber-800 to-gray-700",
    columnBg: "bg-[#2c2a27]/90", // deep warm gray-brown blend
    columnHeaderBg: "bg-[#3b3732]/95", // richer contrast for headers
    cardBg: "bg-[#443f38]/90", // mid-tone card background
    cardHover: "hover:bg-[#504942]", // subtle hover contrast
    cardBorder: "border-[#5b5246]", // softer brown-gray border
    primary: "bg-amber-600 hover:bg-amber-500",
    secondary: "bg-gray-600 hover:bg-gray-500",
    danger: "bg-red-600 hover:bg-red-500",
    success: "bg-orange-600 hover:bg-orange-500",
    text: "text-gray-100",
    textSecondary: "text-gray-300",
    accent: "border-amber-400",
    completed: "border-orange-500",
    scrollbar:
      "scrollbar-thumb-amber-500 scrollbar-track-gray-800 scrollbar-thin",
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
        console.error("Failed to fetch data:", error);
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
      console.error("Failed to update board:", error);
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

    const newColumns = [...board.columns];
    const sourceColIndex = newColumns.findIndex(
      (col) => col.name === source.droppableId
    );
    const destColIndex = newColumns.findIndex(
      (col) => col.name === destination.droppableId
    );

    const sourceCol = newColumns[sourceColIndex];
    const destCol = newColumns[destColIndex];
    const sourceTasks = [...sourceCol.tasks];
    const destTasks = destCol ? [...destCol.tasks] : [];

    const [movedTask] = sourceTasks.splice(source.index, 1);
    sourceTasks.forEach((task, index) => {
      task.position = index;
    });

    destTasks.splice(destination.index, 0, movedTask);
    destTasks.forEach((task, index) => {
      task.position = index;
    });

    newColumns[sourceColIndex] = {
      ...sourceCol,
      tasks: sourceTasks,
    };

    if (destCol) {
      newColumns[destColIndex] = {
        ...destCol,
        tasks: destTasks,
      };
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
    });

    setNewTask({ title: "", description: "", column: "" });
  };

  const startEditingTask = (columnName, task) => {
    setEditingTask({
      columnName,
      taskId: task._id,
      title: task.title,
      description: task.description || "",
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

    const newName = `${colName} (Copy)`;
    await updateBoard("ADD_COLUMN", {
      name: newName,
    });

    for (const task of columnToCopy.tasks) {
      await updateBoard("ADD_TASK", {
        columnName: newName,
        title: task.title,
        description: task.description,
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

  const sortListByTitle = async (colName) => {
    const columnToSort = board.columns.find((col) => col.name === colName);
    if (!columnToSort) return;

    const sortedTasks = [...columnToSort.tasks].sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    sortedTasks.forEach((task, index) => {
      task.position = index;
    });

    const newColumns = board.columns.map((col) =>
      col.name === colName ? { ...col, tasks: sortedTasks } : col
    );

    await updateBoard("UPDATE_COLUMNS", {
      columns: newColumns,
    });

    setShowColumnMenu(null);
  };

  const deleteColumn = async (colName) => {
    if (confirm(`Are you sure you want to delete the "${colName}" column?`)) {
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

  if (loading) {
    return (
      <div
        className={`min-h-screen ${colors.background} ${colors.text} p-4 flex items-center justify-center`}
      >
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-amber-600 rounded-full mb-2"></div>
          <div>Loading board...</div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div
        className={`min-h-screen ${colors.background} ${colors.text} p-4 flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div>Failed to load board. Please try again.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${colors.background} ${colors.text} p-2 pb-8`}
    >
      {/* Header with Admin Avatars */}
      <div className="sticky top-0 z-10 mb-6 bg-gray-850/95 backdrop-blur-sm rounded-lg shadow-lg border-b border-gray-700">
        <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto relative flex flex-col items-center md:h-16">
          <div className="w-full flex justify-center">
            <h1 className="text-xl md:text-2xl font-bold text-amber-300 text-center">
              بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم
            </h1>
          </div>

          <div className="flex -space-x-2 mt-4 md:mt-0 md:absolute md:top-1/2 md:left-4 md:-translate-y-1/2">
            {admins.map((admin, index) => (
              <div
                key={index}
                className="relative group"
                data-tooltip={admin.name}
              >
                <img
                  src={admin.image || "/default-avatar.png"}
                  alt={admin.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-700 hover:border-amber-500 transition-all"
                />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {admin.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="w-full mx-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="all-columns"
            direction="horizontal"
            type="COLUMN"
          >
            {(provided) => (
              <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-thin custom-scroll">
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex space-x-4 min-h-[calc(100vh-180px)] pb-4"
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
                            className={`${colors.columnBg} w-80 min-w-[20rem] flex-shrink-0 rounded-xl shadow-lg border ${colors.cardBorder} relative transition-all hover:shadow-amber-500/30`}
                            style={{
                              ...provided.draggableProps.style,
                              height: "fit-content",
                            }}
                          >
                            {/* Column Header */}
                            <div
                              {...provided.dragHandleProps}
                              className={`${colors.columnHeaderBg} p-3 rounded-t-lg flex justify-between items-center sticky top-0 z-10 border-b ${colors.cardBorder}`}
                            >
                              <h2 className="text-sm font-semibold truncate max-w-[180px] text-amber-200">
                                {column.name}
                              </h2>

                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setShowColumnMenu(
                                      showColumnMenu === column.name
                                        ? null
                                        : column.name
                                    )
                                  }
                                  className={`${colors.textSecondary} hover:text-white p-1 rounded hover:bg-gray-700 transition-colors`}
                                >
                                  <FiMoreVertical size={16} />
                                </button>

                                {showColumnMenu === column.name && (
                                  <div
                                    ref={menuRef}
                                    className={`absolute bg-gray-900 ${
                                      colors.text
                                    } rounded-lg shadow-xl w-48 p-1 z-50 border ${
                                      colors.cardBorder
                                    } ${isMobile ? "left-0" : "right-0"} top-8`}
                                  >
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                                      onClick={() => {
                                        setNewTask({
                                          column: column.name,
                                          title: "",
                                          description: "",
                                        });
                                        setShowColumnMenu(null);
                                      }}
                                    >
                                      <FiPlus className="mr-2" size={14} /> Add
                                      card
                                    </button>
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                                      onClick={() => copyList(column.name)}
                                    >
                                      <FiCopy className="mr-2" size={14} /> Copy
                                      list
                                    </button>
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                                      onClick={() => moveListToEnd(column.name)}
                                    >
                                      <FiMove className="mr-2" size={14} /> Move
                                      to end
                                    </button>
                                    <button
                                      className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                                      onClick={() =>
                                        sortListByTitle(column.name)
                                      }
                                    >
                                      <FiCopy className="mr-2" size={14} /> Sort
                                      by name
                                    </button>
                                    <hr className="my-1 border-gray-700" />
                                    <button
                                      onClick={() => deleteColumn(column.name)}
                                      className="flex items-center w-full p-2 text-red-500 hover:bg-gray-800 text-sm rounded"
                                    >
                                      <FiTrash2 className="mr-2" size={14} />{" "}
                                      Delete list
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
                                  className={`p-3 overflow-y-auto ${colors.scrollbar}`}
                                  style={{
                                    minHeight: "40px",
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
                                            } p-3 rounded-lg mb-3 border transition-all ${
                                              task.completed
                                                ? colors.completed
                                                : colors.cardBorder
                                            } shadow-sm ${
                                              colors.cardHover
                                            } group`}
                                          >
                                            {editingTask?.taskId ===
                                            task._id ? (
                                              <div className="space-y-3">
                                                <input
                                                  type="text"
                                                  className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} focus:ring-1 focus:ring-amber-500 focus:outline-none`}
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
                                                  className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} focus:ring-1 focus:ring-amber-500 focus:outline-none`}
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
                                                  placeholder="Add description..."
                                                />
                                                <div className="flex justify-end space-x-2">
                                                  <button
                                                    onClick={saveEditedTask}
                                                    className={`${colors.success} px-3 py-1 rounded text-white text-xs flex items-center`}
                                                  >
                                                    <FiSave
                                                      className="mr-1"
                                                      size={12}
                                                    />{" "}
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      setEditingTask(null)
                                                    }
                                                    className={`${colors.secondary} px-3 py-1 rounded text-white text-xs flex items-center`}
                                                  >
                                                    <FiX
                                                      className="mr-1"
                                                      size={12}
                                                    />{" "}
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="relative group">
                                                  {/* ✅ Check Button: only shows on hover or if completed */}
                                                  {(task.completed || true) && (
                                                    <button
                                                      onClick={() =>
                                                        toggleComplete(
                                                          column.name,
                                                          task._id
                                                        )
                                                      }
                                                      className={`absolute top-2 left-1 z-10 w-5 h-5 flex items-center justify-center rounded-full border-2
        transition-all duration-200
        ${
          task.completed
            ? "border-orange-500 bg-orange-500 text-white"
            : "border-gray-500 text-gray-400 opacity-0 group-hover:opacity-100 hover:border-orange-400 hover:text-orange-400"
        }`}
                                                    >
                                                      {task.completed && (
                                                        <FiCheck size={12} />
                                                      )}
                                                    </button>
                                                  )}

                                                  {/* Main content shifted only when hovered or completed */}
                                                  <div
                                                    className={`transition-all duration-300 pr-2 ${
                                                      task.completed
                                                        ? "pl-8"
                                                        : "group-hover:pl-8"
                                                    }`}
                                                  >
                                                    <h3
                                                      className={`text-sm font-medium ${
                                                        task.completed
                                                          ? "line-through text-gray-400"
                                                          : colors.text
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
                                      className={`${colors.columnBg} p-3 rounded-lg mt-2 border ${colors.cardBorder} shadow-inner`}
                                    >
                                      <input
                                        type="text"
                                        className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} mb-2 focus:ring-1 focus:ring-amber-500 focus:outline-none`}
                                        placeholder="Task title"
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
                                        className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} focus:ring-1 focus:ring-amber-500 focus:outline-none`}
                                        placeholder="Description (optional)"
                                        rows={2}
                                        value={newTask.description}
                                        onChange={(e) =>
                                          setNewTask({
                                            ...newTask,
                                            description: e.target.value,
                                          })
                                        }
                                      ></textarea>
                                      <div className="flex justify-end space-x-2 mt-2">
                                        <button
                                          onClick={() => addTask(column.name)}
                                          className={`${colors.primary} px-3 py-1.5 rounded text-white text-xs font-medium`}
                                        >
                                          Add Task
                                        </button>
                                        <button
                                          onClick={() =>
                                            setNewTask({
                                              title: "",
                                              description: "",
                                              column: "",
                                            })
                                          }
                                          className={`${colors.secondary} px-3 py-1.5 rounded text-white text-xs font-medium`}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setNewTask({
                                          ...newTask,
                                          column: column.name,
                                        })
                                      }
                                      className={`text-xs ${colors.textSecondary} mt-1 hover:text-white w-full p-2 rounded flex items-center ${colors.cardHover} transition-colors`}
                                    >
                                      <FiPlus className="mr-2" size={14} /> Add
                                      a card
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
                  <div className="min-w-[20rem] w-80">
                    {showAddListInput ? (
                      <div
                        className={`${colors.columnBg} border ${colors.cardBorder} p-3 rounded-lg shadow-md`}
                      >
                        <input
                          type="text"
                          placeholder="Enter list title..."
                          className={`w-full p-2 mb-2 text-sm ${colors.columnBg} ${colors.text} rounded border ${colors.cardBorder} focus:ring-1 focus:ring-amber-500 focus:outline-none`}
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={addColumn}
                            className={`${colors.primary} px-3 py-2 text-xs md:text-sm rounded text-white font-medium`}
                          >
                            Add list
                          </button>
                          <button
                            onClick={() => setShowAddListInput(false)}
                            className={`${colors.secondary} px-3 py-2 text-xs md:text-sm rounded text-white font-medium`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddListInput(true)}
                        className={`w-full ${colors.columnBg} border-2 border-dashed ${colors.cardBorder} ${colors.text} p-3 rounded-lg hover:bg-gray-700/50 transition-all flex items-center justify-center space-x-2 h-12`}
                      >
                        <FiPlus size={16} className="text-amber-400" />
                        <span className="text-sm">Add another list</span>
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
