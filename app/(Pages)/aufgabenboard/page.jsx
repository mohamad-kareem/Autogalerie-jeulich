// app/aufgabenboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FiPlus,
  FiX,
  FiCheck,
  FiEdit2,
  FiMoreHorizontal,
  FiTrash2,
  FiGrid,
} from "react-icons/fi";
import PageLoader from "@/app/(components)/helpers/PageLoader";

// Color options for tasks
const COLOR_OPTIONS = [
  { id: "default", name: "Standard", class: "bg-white border border-[#dfe2e6]", dot: "bg-slate-300" },
  { id: "blue", name: "Blau", class: "bg-sky-50 border border-sky-200 border-l-4 border-l-sky-500", dot: "bg-sky-500" },
  { id: "green", name: "Grün", class: "bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500", dot: "bg-emerald-500" },
  { id: "red", name: "Rot", class: "bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500", dot: "bg-rose-500" },
  {
    id: "yellow",
    name: "Gelb",
    class: "bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500", dot: "bg-amber-400",
  },
  {
    id: "purple",
    name: "Lila",
    class: "bg-violet-50 border border-violet-200 border-l-4 border-l-violet-500", dot: "bg-violet-500",
  },
  { id: "pink", name: "Pink", class: "bg-pink-50 border border-pink-200 border-l-4 border-l-pink-500", dot: "bg-pink-500" },
  {
    id: "indigo",
    name: "Indigo",
    class: "bg-indigo-50 border border-indigo-200 border-l-4 border-l-indigo-500", dot: "bg-indigo-500",
  },
];

// Completely empty board – just the structure
const EMPTY_BOARD = {
  columns: {},
  columnOrder: [],
  tasks: {},
};

export default function AufgabenboardPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);

  // inline add-card state
  const [activeAddColumn, setActiveAddColumn] = useState(null);
  const [newCardText, setNewCardText] = useState("");
  const [newCardColor, setNewCardColor] = useState("default");

  // add-list state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  // edit-task modal
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editColor, setEditColor] = useState("default");

  // which task is currently hovered (for checkbox behavior)
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  // which column menu is open (three dots)
  const [openColumnMenuId, setOpenColumnMenuId] = useState(null);

  // ─────────────────────
  // Load board from API
  // ─────────────────────
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await fetch("/api/taskboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load board");
        const json = await res.json();
        const loaded = json.board || EMPTY_BOARD;

        // safety: ensure done exists and color exists
        Object.values(loaded.tasks || {}).forEach((task) => {
          if (typeof task.done === "undefined") task.done = false;
          if (typeof task.color === "undefined") task.color = "default";
        });

        setBoard(loaded);
      } catch (err) {
        console.error(err);
        setBoard(EMPTY_BOARD);
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, []);

  // save board to server
  const saveBoardToServer = async (nextBoard) => {
    try {
      await fetch("/api/taskboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: nextBoard }),
      });
    } catch (err) {
      console.error("Failed to save board:", err);
    }
  };

  // central update helper
  const updateBoard = (updater) => {
    setBoard((prev) => {
      const current = prev || EMPTY_BOARD;
      const next = typeof updater === "function" ? updater(current) : updater;
      saveBoardToServer(next); // fire-and-forget save
      return next;
    });
  };

  // Get color classes for task
  const getTaskColorClasses = (colorId) => {
    const colorOption =
      COLOR_OPTIONS.find((opt) => opt.id === colorId) || COLOR_OPTIONS[0];
    return colorOption.class;
  };

  // ─────────────────────
  // Board interactions
  // ─────────────────────
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    updateBoard((prev) => {
      const startColumn = prev.columns[source.droppableId];
      const finishColumn = prev.columns[destination.droppableId];

      if (!startColumn || !finishColumn) return prev;

      // same column
      if (startColumn === finishColumn) {
        const newTaskIds = Array.from(startColumn.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, draggableId);

        const newColumn = {
          ...startColumn,
          taskIds: newTaskIds,
        };

        return {
          ...prev,
          columns: {
            ...prev.columns,
            [newColumn.id]: newColumn,
          },
        };
      }

      // move to another column
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = {
        ...startColumn,
        taskIds: startTaskIds,
      };

      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinish = {
        ...finishColumn,
        taskIds: finishTaskIds,
      };

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [newStart.id]: newStart,
          [newFinish.id]: newFinish,
        },
      };
    });
  };

  const openAddCard = (columnId) => {
    setActiveAddColumn(columnId);
    setNewCardText("");
    setNewCardColor("default");
  };

  const cancelAddCard = () => {
    setActiveAddColumn(null);
    setNewCardText("");
    setNewCardColor("default");
  };

  const handleCreateCard = (columnId) => {
    if (!newCardText.trim()) return;

    const id = `t_${Date.now()}`;
    const task = {
      id,
      title: newCardText.trim(),
      done: false,
      color: newCardColor,
    };

    updateBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const updatedColumn = {
        ...column,
        taskIds: [...column.taskIds, id],
      };

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [id]: task,
        },
        columns: {
          ...prev.columns,
          [columnId]: updatedColumn,
        },
      };
    });

    setNewCardText("");
    setNewCardColor("default");
    setActiveAddColumn(null);
  };

  const toggleTaskDone = (taskId) => {
    updateBoard((prev) => {
      const task = prev.tasks[taskId];
      if (!task) return prev;
      const updatedTask = { ...task, done: !task.done };
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
      };
    });
  };

  const openEditTask = (task) => {
    setEditTaskId(task.id);
    setEditText(task.title);
    setEditColor(task.color || "default");
  };

  const closeEditTask = () => {
    setEditTaskId(null);
    setEditText("");
    setEditColor("default");
  };

  const handleSaveEditTask = (e) => {
    e.preventDefault();
    if (!editTaskId) return;
    if (!editText.trim()) return;

    updateBoard((prev) => {
      const task = prev.tasks[editTaskId];
      if (!task) return prev;
      const updatedTask = {
        ...task,
        title: editText.trim(),
        color: editColor,
      };
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [editTaskId]: updatedTask,
        },
      };
    });

    closeEditTask();
  };

  const handleDeleteTask = () => {
    if (!editTaskId) return;

    updateBoard((prev) => {
      const newTasks = { ...prev.tasks };
      delete newTasks[editTaskId];

      const newColumns = { ...prev.columns };
      Object.keys(newColumns).forEach((colId) => {
        newColumns[colId] = {
          ...newColumns[colId],
          taskIds: newColumns[colId].taskIds.filter((id) => id !== editTaskId),
        };
      });

      return {
        ...prev,
        tasks: newTasks,
        columns: newColumns,
      };
    });

    closeEditTask();
  };

  const startAddList = () => {
    setIsAddingList(true);
    setNewListTitle("");
  };

  const cancelAddList = () => {
    setIsAddingList(false);
    setNewListTitle("");
  };

  const handleCreateList = () => {
    if (!newListTitle.trim()) return;

    const id = `col_${Date.now()}`;
    const column = {
      id,
      title: newListTitle.trim(),
      taskIds: [],
    };

    updateBoard((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [id]: column,
      },
      columnOrder: [...prev.columnOrder, id],
    }));

    setNewListTitle("");
    setIsAddingList(false);
  };

  const handleDeleteList = (columnId) => {
    updateBoard((prev) => {
      const column = prev.columns[columnId];
      if (!column) return prev;

      const newTasks = { ...prev.tasks };
      column.taskIds.forEach((taskId) => {
        delete newTasks[taskId];
      });

      const newColumns = { ...prev.columns };
      delete newColumns[columnId];

      const newColumnOrder = prev.columnOrder.filter((id) => id !== columnId);

      return {
        ...prev,
        columns: newColumns,
        columnOrder: newColumnOrder,
        tasks: newTasks,
      };
    });

    if (openColumnMenuId === columnId) {
      setOpenColumnMenuId(null);
    }
  };

  if (loading || !board) {
    return <PageLoader />;
  }

  const totalTasks = Object.keys(board.tasks || {}).length;

  return (
    <div className="h-screen overflow-y-hidden pt-1 text-slate-800">
      <div className="mx-auto flex min-h-screen w-full flex-col px-3 pb-4 pt-1 sm:px-6 lg:px-4">
        {/* Header */}
        <header className="ind-plate mb-4 mt-3 flex items-center gap-3 px-4 py-3">
          <FiGrid className="h-4 w-4 text-[#3e454e]" />
          <div className="min-w-0">
            <h1 className="ind-title">Trello</h1>
            <p className="text-[12.5px] text-muted">Aufgaben-Board – Karten per Drag &amp; Drop verschieben</p>
          </div>
        </header>

        {/* Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="custom-scroll flex-1 overflow-x-auto pb-2">
            <div className="flex min-w-[900px] items-start gap-3 sm:gap-4">
              {board.columnOrder.map((columnId) => {
                const column = board.columns[columnId];
                const tasks = column.taskIds.map(
                  (taskId) => board.tasks[taskId]
                );

                return (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex w-66 flex-shrink-0 flex-col rounded-[4px] border bg-gradient-to-b from-[#eef0f2] to-[#e3e6ea] p-2 sm:p-3 px-1 sm:px-2 py-2 shadow-[0_1px_2px_rgba(20,26,33,0.08)] ${
                          snapshot.isDraggingOver
                            ? "border-[#59616c]"
                            : "border-[#c3c9d0]"
                        }`}
                      >
                        {/* Column header */}
                        <div className="mb-2 ml-3 flex items-center justify-between gap-2">
                          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3e454e]">
                            {column.title}
                          </h2>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenColumnMenuId((prev) =>
                                  prev === column.id ? null : column.id
                                )
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-black/5"
                              title="Listenoptionen"
                            >
                              <FiMoreHorizontal className="h-4 w-4" />
                            </button>

                            {openColumnMenuId === column.id && (
                              <div className="absolute right-0 mt-1 w-40 rounded-[4px] border border-[#b9bfc7] bg-white text-xs shadow-lg z-20">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteList(column.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50"
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                  <span>Liste löschen</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-2">
                          {tasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onMouseEnter={() => setHoveredTaskId(task.id)}
                                  onMouseLeave={() =>
                                    setHoveredTaskId((prev) =>
                                      prev === task.id ? null : prev
                                    )
                                  }
                                  className={`group rounded-md px-2.5 py-2 text-xs sm:text-sm text-slate-800 shadow-sm transition-all  ${
                                    snapshot.isDragging
                                      ? "ring-2 ring-[#59616c]/60"
                                      : "hover:shadow"
                                  } ${
                                    task.done ? "opacity-75" : ""
                                  } ${getTaskColorClasses(
                                    task.color || "default"
                                  )}`}
                                >
                                  <div className="flex items-start gap-2">
                                    {/* Done checkbox – only rendered when hovered or done */}
                                    {(task.done ||
                                      hoveredTaskId === task.id) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleTaskDone(task.id);
                                        }}
                                        className={`mt-0.5 cursor-pointer inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[10px] transition-all
                                          ${
                                            task.done
                                              ? "border-emerald-600 bg-emerald-500 text-white"
                                              : "border-slate-400 bg-white text-slate-500"
                                          }`}
                                        title={
                                          task.done
                                            ? "Als nicht erledigt markieren"
                                            : "Als erledigt markieren"
                                        }
                                      >
                                        {task.done && (
                                          <FiCheck className="h-3 w-3 text-white" />
                                        )}
                                      </button>
                                    )}

                                    {/* Text */}
                                    <div className="flex-1">
                                      <p
                                        className={`whitespace-pre-wrap leading-snug ${
                                          task.done
                                            ? "line-through text-slate-400"
                                            : "text-slate-800"
                                        }`}
                                      >
                                        {task.title}
                                      </p>
                                    </div>

                                    {/* Edit icon (hover) */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditTask(task);
                                      }}
                                      className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5"
                                      title="Karte bearbeiten"
                                    >
                                      <FiEdit2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </div>

                        {/* Add card area */}
                        <div className="mt-2">
                          {activeAddColumn === column.id ? (
                            <div className="space-y-2">
                              <textarea
                                autoFocus
                                rows={2}
                                value={newCardText}
                                onChange={(e) => setNewCardText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreateCard(column.id);
                                  }
                                }}
                                className="w-full rounded-md border border-[#cfd4da] bg-white px-2 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#59616c] focus:ring-1 focus:ring-[#59616c]/30"
                                placeholder="Neue Karte eingeben…"
                              />

                              {/* Color selection for new card */}
                              <div className="flex flex-wrap gap-1">
                                {COLOR_OPTIONS.map((color) => (
                                  <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setNewCardColor(color.id)}
                                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                                      color.dot
                                    } ${
                                      newCardColor === color.id
                                        ? "border-[#3e454e] ring-2 ring-[#3e454e]/25"
                                        : "border-transparent hover:scale-110"
                                    }`}
                                    title={color.name}
                                  />
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCreateCard(column.id)}
                                  className="rounded-md px-3 py-1.5 text-xs font-semibold border border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white hover:from-[#4b535d] hover:to-[#343a42]"
                                >
                                  Karte hinzufügen
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelAddCard}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-black/5"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAddCard(column.id)}
                              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-slate-600 hover:text-slate-900 hover:bg-black/5 transition-colors"
                            >
                              <FiPlus className="h-4 w-4 opacity-80" />
                              <span>Add a card</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}

              {/* Add another list */}
              <div className="w-64 flex-shrink-0">
                {isAddingList ? (
                  <div className="flex flex-col rounded-[4px] border border-[#c3c9d0] bg-gradient-to-b from-[#eef0f2] to-[#e3e6ea] p-2 sm:p-3 shadow-[0_1px_2px_rgba(20,26,33,0.08)]">
                    <input
                      autoFocus
                      type="text"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateList();
                        }
                      }}
                      className="w-full rounded-md border border-[#cfd4da] bg-white px-2 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#59616c] focus:ring-1 focus:ring-[#59616c]/30"
                      placeholder="Listenname eingeben…"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateList}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold border border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white hover:from-[#4b535d] hover:to-[#343a42]"
                      >
                        Liste hinzufügen
                      </button>
                      <button
                        type="button"
                        onClick={cancelAddList}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-black/5"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startAddList}
                    className="flex h-full w-full items-center justify-center rounded-[4px] border border-dashed border-[#a3aab3] bg-white/60 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900"
                  >
                    <FiPlus className="mr-1.5 h-4 w-4" />
                    Add another list
                  </button>
                )}
              </div>
            </div>
          </div>
        </DragDropContext>

        {/* Edit card modal */}
        {editTaskId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3">
            <div className="w-full max-w-md rounded-[4px] border border-[#b9bfc7] bg-white text-slate-800 shadow-2xl">
              <div className="ind-plate flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3">
                <h2 className="text-sm font-semibold">Karte bearbeiten</h2>
                <button
                  type="button"
                  onClick={closeEditTask}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-black/5 hover:text-slate-900"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={handleSaveEditTask}
                className="px-4 py-3 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Kartentext
                  </label>
                  <textarea
                    rows={4}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded-md border border-[#cfd4da] bg-white px-2 py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#59616c] focus:ring-1 focus:ring-[#59616c]/30"
                    placeholder="Kartentext bearbeiten…"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Farbe auswählen
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setEditColor(color.id)}
                        className={`flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-all ${
                          color.class
                        } ${
                          editColor === color.id
                            ? "ring-2 ring-[#3e454e] ring-offset-1"
                            : "opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeEditTask}
                      className="rounded-md border border-[#b9bfc7] bg-gradient-to-b from-white to-[#eef0f2] px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="rounded-md px-3 py-1.5 text-xs font-semibold border border-[#2f353c] bg-gradient-to-b from-[#59616c] to-[#3e454e] text-white hover:from-[#4b535d] hover:to-[#343a42]"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
