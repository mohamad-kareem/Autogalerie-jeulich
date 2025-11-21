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

  // add-list state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  // edit-task modal
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState("");

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

        // safety: ensure done exists
        Object.values(loaded.tasks || {}).forEach((task) => {
          if (typeof task.done === "undefined") task.done = false;
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
  };

  const cancelAddCard = () => {
    setActiveAddColumn(null);
    setNewCardText("");
  };

  const handleCreateCard = (columnId) => {
    if (!newCardText.trim()) return;

    const id = `t_${Date.now()}`;
    const task = {
      id,
      title: newCardText.trim(),
      done: false,
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
  };

  const closeEditTask = () => {
    setEditTaskId(null);
    setEditText("");
  };

  const handleSaveEditTask = (e) => {
    e.preventDefault();
    if (!editTaskId) return;
    if (!editText.trim()) return;

    updateBoard((prev) => {
      const task = prev.tasks[editTaskId];
      if (!task) return prev;
      const updatedTask = { ...task, title: editText.trim() };
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-900/90 to-slate-950 flex items-center justify-center text-amber-50">
        <p className="text-sm">Lade Aufgabenboard…</p>
      </div>
    );
  }

  const totalTasks = Object.keys(board.tasks || {}).length;

  return (
    <div className="pt-1  h-screen overflow-y-hidden bg-gradient-to-b from-amber-900 via-amber-900/90 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full flex-col px-3 pb-4 pt-1 sm:px-6 lg:px-4">
        {/* Header */}
        <header className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500/20 border border-gray-400/40">
              <FiGrid className="h-5 w-5 text-gray-300" />
            </div>
            <h1 className="text-xl sm:text-3xl  font-playfair leading-tight tracking-widest text-amber-50">
              Trello
            </h1>
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
                        className={`flex w-66 flex-shrink-0 flex-col rounded-xl border bg-black/85 p-2 sm:p-3 px-1 sm:px-2 py-2 shadow-md ${
                          snapshot.isDraggingOver
                            ? "border-amber-400/60"
                            : "border-black/60"
                        }`}
                      >
                        {/* Column header */}
                        <div className="mb-2 ml-3 flex items-center justify-between gap-2">
                          <h2 className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wide">
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
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-amber-100 hover:bg-amber-500/10"
                              title="Listenoptionen"
                            >
                              <FiMoreHorizontal className="h-4 w-4" />
                            </button>

                            {openColumnMenuId === column.id && (
                              <div className="absolute right-0 mt-1 w-40 rounded-md border border-slate-700 bg-slate-900 text-xs shadow-lg z-20">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteList(column.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-rose-200 hover:bg-rose-500/10"
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
                                  className={`group rounded-md bg-gray-800 px-2.5 py-2 text-xs sm:text-sm text-slate-50 shadow-sm transition-all ${
                                    snapshot.isDragging
                                      ? "ring-2 ring-amber-400/80"
                                      : "hover:bg-slate-800/90"
                                  } ${task.done ? "opacity-75" : ""}`}
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
                                              ? "border-white bg-yellow-300 text-black"
                                              : "border-amber-300 bg-black/30 text-amber-200"
                                          }`}
                                        title={
                                          task.done
                                            ? "Als nicht erledigt markieren"
                                            : "Als erledigt markieren"
                                        }
                                      >
                                        {task.done && (
                                          <FiCheck className="h-3 w-3 text-black" />
                                        )}
                                      </button>
                                    )}

                                    {/* Text */}
                                    <div className="flex-1">
                                      <p
                                        className={`whitespace-pre-wrap leading-snug ${
                                          task.done
                                            ? "line-through text-slate-300"
                                            : "text-gray-300"
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
                                      className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-amber-200 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-amber-500/10"
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
                                className="w-full rounded-md border border-amber-500/40 bg-slate-950/80 px-2 py-1.5 text-xs text-amber-50 outline-none placeholder:text-amber-200/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                                placeholder="Neue Karte eingeben…"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCreateCard(column.id)}
                                  className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
                                >
                                  Karte hinzufügen
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelAddCard}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-amber-200 hover:bg-amber-500/10"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAddCard(column.id)}
                              className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-amber-100/80 hover:text-amber-50 hover:bg-white/10 transition-colors"
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
                  <div className="flex flex-col rounded-xl border border-amber-400/60 bg-black/60 p-2 sm:p-3 shadow-md">
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
                      className="w-full rounded-md border border-amber-500/60 bg-slate-950/80 px-2 py-1.5 text-xs text-amber-50 outline-none placeholder:text-amber-200/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                      placeholder="Listenname eingeben…"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateList}
                        className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
                      >
                        Liste hinzufügen
                      </button>
                      <button
                        type="button"
                        onClick={cancelAddList}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-amber-100 hover:bg-amber-500/10"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startAddList}
                    className="flex h-full w-full items-center justify-center rounded-xl bg-gray-500 px-3 py-2 text-xs font-medium text-black/90 hover:bg-gray-400 border border-gray-500/60 shadow-sm"
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
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 text-slate-50 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <h2 className="text-sm font-semibold">Karte bearbeiten</h2>
                <button
                  type="button"
                  onClick={closeEditTask}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-slate-800 hover:text-slate-50"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={handleSaveEditTask}
                className="px-4 py-3 space-y-3"
              >
                <div>
                  <textarea
                    rows={4}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-50 outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/60"
                    placeholder="Kartentext bearbeiten…"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pb-3">
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/70 bg-transparent px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/10"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeEditTask}
                      className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
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
