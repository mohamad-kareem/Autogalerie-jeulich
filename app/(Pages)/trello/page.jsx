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

  // Enhanced color palette with better contrast
  const colors = {
    background: "bg-gray-900",
    columnBg: "bg-gray-800/90",
    columnHeaderBg: "bg-gray-800",
    cardBg: "bg-gray-750",
    cardHover: "hover:bg-gray-700",
    cardBorder: "border-gray-700",
    primary: "bg-indigo-600 hover:bg-indigo-500",
    secondary: "bg-gray-700 hover:bg-gray-600",
    danger: "bg-rose-600 hover:bg-rose-500",
    success: "bg-emerald-600 hover:bg-emerald-500",
    text: "text-gray-100",
    textSecondary: "text-gray-400",
    accent: "border-indigo-500",
    completed: "border-emerald-500",
    scrollbar:
      "scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-thin",
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Close menu when clicking outside
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
        // Simulated API calls - replace with actual API calls
        const adminData = [
          { name: "Admin 1", image: "/default-avatar.png" },
          { name: "Admin 2", image: "/default-avatar.png" },
        ];
        setAdmins(adminData);

        // Sample board data
        const boardData = {
          columns: [
            {
              name: "To Do",
              tasks: [
                {
                  _id: "1",
                  title: "Design UI mockups",
                  description: "Create Figma designs for all pages",
                  position: 0,
                  completed: false,
                },
                {
                  _id: "2",
                  title: "Set up database",
                  description: "Configure MongoDB Atlas",
                  position: 1,
                  completed: false,
                },
              ],
            },
            {
              name: "In Progress",
              tasks: [
                {
                  _id: "3",
                  title: "Implement authentication",
                  description: "Add JWT auth with NextAuth.js",
                  position: 0,
                  completed: false,
                },
              ],
            },
            {
              name: "Done",
              tasks: [
                {
                  _id: "4",
                  title: "Project setup",
                  description: "Initialize Next.js project",
                  position: 0,
                  completed: true,
                },
              ],
            },
          ],
        };
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
      // Simulate API call - replace with actual API call
      console.log("Updating board:", action, payload);

      // For demo purposes, we'll update the state directly
      let updatedBoard = { ...board };

      switch (action) {
        case "UPDATE_COLUMNS":
          updatedBoard.columns = payload.columns;
          break;
        case "ADD_TASK":
          const col = updatedBoard.columns.find(
            (c) => c.name === payload.columnName
          );
          if (col) {
            col.tasks.push({
              _id: `task-${Date.now()}`,
              title: payload.title,
              description: payload.description,
              position: col.tasks.length,
              completed: false,
            });
          }
          break;
        case "UPDATE_TASK":
        case "REMOVE_TASK":
        case "ADD_COLUMN":
        case "DELETE_COLUMN":
          // Implement other actions as needed
          break;
        default:
          break;
      }

      setBoard(updatedBoard);
      return updatedBoard;
    } catch (error) {
      console.error("Failed to update board:", error);
      throw error;
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

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

    // Remove from source
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // Update positions in source column
    sourceTasks.forEach((task, index) => {
      task.position = index;
    });

    // Insert into destination
    destTasks.splice(destination.index, 0, movedTask);

    // Update positions in destination column
    destTasks.forEach((task, index) => {
      task.position = index;
    });

    // Update the columns
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

    // Optimistic update
    setBoard({ ...board, columns: newColumns });

    // Update in database
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

    // Add all tasks from the copied column
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

    // Update positions
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
          <div className="h-8 w-8 bg-indigo-600 rounded-full mb-2"></div>
          <div>Loading board...</div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div
        className={`min-h-screen ${colors.background} ${colors.text} p-4 flex items-center justify-center `}
      >
        <div className="text-center">
          <div className="text-rose-500 mb-2">⚠️</div>
          <div>Failed to load board. Please try again.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${colors.background} ${colors.text} p-4 pb-8 mt-15`}
    >
      {/* Header with Admin Avatars */}
      <div className="sticky top-0 z-10 mb-6 p-4 bg-gray-850/95 backdrop-blur-sm rounded-lg shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col items-center space-y-3">
          <h1 className="text-xl md:text-2xl font-bold text-indigo-300 text-center">
            بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيم
          </h1>

          <div className="flex -space-x-2">
            {admins.map((admin, index) => (
              <div
                key={index}
                className="relative group"
                data-tooltip={admin.name}
              >
                <img
                  src={admin.image || "/default-avatar.png"}
                  alt={admin.name}
                  className="w-8 h-8 rounded-full border-2 border-gray-700 hover:border-indigo-500 transition-all"
                />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {admin.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="max-w-7xl mx-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-4 overflow-x-auto pb-4 horizontal-scroll">
            {board.columns.map((column) => (
              <Droppable droppableId={column.name} key={column.name}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${colors.columnBg} w-72 min-w-72 flex-shrink-0 rounded-lg shadow-lg border ${colors.columnBorder} relative transition-all hover:shadow-indigo-500/10`}
                  >
                    {/* Column Header */}
                    <div
                      className={`${colors.columnHeaderBg} p-3 rounded-t-lg flex justify-between items-center sticky top-0 z-10 border-b ${colors.cardBorder}`}
                    >
                      <h2 className="text-sm font-semibold truncate max-w-[180px] text-indigo-200">
                        {column.name}{" "}
                        <span className="text-gray-500">
                          ({column.tasks.length})
                        </span>
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
                              <FiPlus className="mr-2" size={14} /> Add card
                            </button>
                            <button
                              className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                              onClick={() => copyList(column.name)}
                            >
                              <FiCopy className="mr-2" size={14} /> Copy list
                            </button>
                            <button
                              className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                              onClick={() => moveListToEnd(column.name)}
                            >
                              <FiMove className="mr-2" size={14} /> Move to end
                            </button>
                            <button
                              className="flex items-center w-full p-2 hover:bg-gray-800 text-sm rounded"
                              onClick={() => sortListByTitle(column.name)}
                            >
                              <FiCopy className="mr-2" size={14} /> Sort by name
                            </button>
                            <hr className="my-1 border-gray-700" />
                            <button
                              onClick={() => deleteColumn(column.name)}
                              className="flex items-center w-full p-2 text-rose-500 hover:bg-gray-800 text-sm rounded"
                            >
                              <FiTrash2 className="mr-2" size={14} /> Delete
                              list
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tasks List - Fixed height with scroll */}
                    <div
                      className={`p-2 overflow-y-auto ${colors.scrollbar}`}
                      style={{ height: "calc(100vh - 200px)" }}
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
                                } p-3 rounded-lg mb-2 border transition-all ${
                                  task.completed
                                    ? colors.completed
                                    : colors.cardBorder
                                } shadow-sm ${colors.cardHover} group`}
                              >
                                {editingTask?.taskId === task._id ? (
                                  <div className="space-y-3">
                                    <input
                                      type="text"
                                      className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} focus:ring-1 focus:ring-indigo-500 focus:outline-none`}
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
                                      className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} focus:ring-1 focus:ring-indigo-500 focus:outline-none`}
                                      value={editingTask.description}
                                      onChange={(e) =>
                                        setEditingTask({
                                          ...editingTask,
                                          description: e.target.value,
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
                                        <FiSave className="mr-1" size={12} />{" "}
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingTask(null)}
                                        className={`${colors.secondary} px-3 py-1 rounded text-white text-xs flex items-center`}
                                      >
                                        <FiX className="mr-1" size={12} />{" "}
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-start">
                                        <button
                                          onClick={() =>
                                            toggleComplete(
                                              column.name,
                                              task._id
                                            )
                                          }
                                          className="mr-2 mt-0.5"
                                        >
                                          <FiCheck
                                            size={16}
                                            className={`rounded-full p-0.5 ${
                                              task.completed
                                                ? "bg-emerald-500 text-white"
                                                : "text-gray-500 hover:text-emerald-400 border border-gray-500 hover:border-emerald-400"
                                            }`}
                                          />
                                        </button>
                                        <div>
                                          <h3
                                            className={`text-sm font-medium ${
                                              task.completed
                                                ? "line-through text-gray-500"
                                                : colors.text
                                            }`}
                                          >
                                            {task.title}
                                          </h3>
                                          {task.description && (
                                            <p
                                              className={`text-xs ${colors.textSecondary} mt-1`}
                                            >
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() =>
                                            startEditingTask(column.name, task)
                                          }
                                          className="text-indigo-400 hover:text-indigo-300 p-1"
                                          title="Edit"
                                        >
                                          <FiEdit2 size={14} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteTask(column.name, task._id)
                                          }
                                          className="text-rose-400 hover:text-rose-300 p-1"
                                          title="Delete"
                                        >
                                          <FiTrash2 size={14} />
                                        </button>
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
                            className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} mb-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none`}
                            placeholder="Task title"
                            value={newTask.title}
                            onChange={(e) =>
                              setNewTask({ ...newTask, title: e.target.value })
                            }
                            autoFocus
                          />
                          <textarea
                            className={`w-full p-2 text-sm rounded ${colors.columnBg} ${colors.text} border ${colors.cardBorder} focus:ring-1 focus:ring-indigo-500 focus:outline-none`}
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
                            setNewTask({ ...newTask, column: column.name })
                          }
                          className={`text-xs ${colors.textSecondary} mt-1 hover:text-white w-full p-2 rounded flex items-center ${colors.cardHover} transition-colors`}
                        >
                          <FiPlus className="mr-2" size={14} /> Add a card
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}

            {/* Add New List Section */}
            <div className="min-w-72 w-72">
              {showAddListInput ? (
                <div
                  className={`${colors.columnBg} border ${colors.cardBorder} p-3 rounded-lg shadow-md`}
                >
                  <input
                    type="text"
                    placeholder="Enter list title..."
                    className={`w-full p-2 mb-2 text-sm ${colors.columnBg} ${colors.text} rounded border ${colors.cardBorder} focus:ring-1 focus:ring-indigo-500 focus:outline-none`}
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
                  className={`w-full ${colors.columnBg} border-2 border-dashed ${colors.cardBorder} ${colors.text} p-3 rounded-lg hover:bg-gray-750 transition-all flex items-center justify-center space-x-2 h-12`}
                >
                  <FiPlus size={16} className="text-indigo-400" />
                  <span className="text-sm">Add another list</span>
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
