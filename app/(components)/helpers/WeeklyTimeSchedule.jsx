"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiTrash2, FiX, FiCheck, FiChevronDown } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";

const cx = (...c) => c.filter(Boolean).join(" ");

const DAYS = [
  { key: "mon", label: "Mo" },
  { key: "tue", label: "Di" },
  { key: "wed", label: "Mi" },
  { key: "thu", label: "Do" },
  { key: "fri", label: "Fr" },
  { key: "sat", label: "Sa" },
];

const START_HOUR = 10;
const END_HOUR = 19;
const VISIBLE_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 65;
const MINUTES_PER_DAY = 24 * 60;
const SNAP_MIN = 30;
const MIN_EVENT_MIN = 60;

const CREATE_EDITOR_MIN_HEIGHT = 170;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function snapMinutes(min) {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}
function minutesToY(min) {
  const minutesFromStart = min - START_HOUR * 60;
  return (minutesFromStart / 60) * HOUR_HEIGHT;
}
function yToMinutes(y) {
  return (y / HOUR_HEIGHT) * 60 + START_HOUR * 60;
}
function fmtTime(min) {
  const m = clamp(Math.round(min), 0, MINUTES_PER_DAY);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

const COLOR_OPTIONS = [
  { id: "red", name: "Dringend", dot: "bg-rose-500" },
  { id: "yellow", name: "Wichtig", dot: "bg-amber-400" },
  { id: "green", name: "Bestätigt", dot: "bg-emerald-400" },
];

function variantClass(variant, darkMode) {
  const map = {
    red: {
      bg: darkMode ? "bg-rose-500/10" : "bg-rose-500/12",
      border: darkMode ? "border-rose-400/35" : "border-rose-500/30",
      text: darkMode ? "text-rose-200" : "text-rose-900",
      hover: darkMode ? "hover:bg-rose-500/16" : "hover:bg-rose-500/18",
    },
    yellow: {
      bg: darkMode ? "bg-amber-400/10" : "bg-amber-400/14",
      border: darkMode ? "border-amber-300/35" : "border-amber-500/30",
      text: darkMode ? "text-amber-100" : "text-amber-900",
      hover: darkMode ? "hover:bg-amber-400/16" : "hover:bg-amber-400/18",
    },
    green: {
      bg: darkMode ? "bg-emerald-400/10" : "bg-emerald-400/14",
      border: darkMode ? "border-emerald-300/35" : "border-emerald-500/30",
      text: darkMode ? "text-emerald-100" : "text-emerald-900",
      hover: darkMode ? "hover:bg-emerald-400/16" : "hover:bg-emerald-400/18",
    },
  };

  return map[variant] || map.green;
}

async function apiGet(createdBy) {
  const qs = createdBy ? `?createdBy=${encodeURIComponent(createdBy)}` : "";
  const res = await fetch(`/api/schedule${qs}`, { cache: "no-store" });
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || "Failed to load");
  return data.items || [];
}

async function apiCreate(payload) {
  const res = await fetch(`/api/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || "Create failed");
  return data.item;
}

async function apiUpdate(id, patch) {
  const res = await fetch(`/api/schedule/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || "Update failed");
  return data.item;
}

async function apiDelete(id) {
  const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || "Delete failed");
  return true;
}

export default function WeeklyTimeSchedule({
  darkMode = false,
  createdBy = "",
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [creating, setCreating] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("green");
  const [showColor, setShowColor] = useState(false);

  const [hoverSlot, setHoverSlot] = useState(null);

  const containerRef = useRef(null);
  const newEventRef = useRef(null);
  const colorDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  const saveTimersRef = useRef(new Map());

  const colW = 100 / DAYS.length;
  const gridHeightPx = VISIBLE_HOURS * HOUR_HEIGHT;

  const visibleHours = useMemo(
    () => Array.from({ length: VISIBLE_HOURS + 1 }, (_, i) => START_HOUR + i),
    [],
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet(createdBy)
      .then((items) => {
        if (!alive) return;
        setEvents(items);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [createdBy]);

  useEffect(() => {
    function onDown(e) {
      if (
        showColor &&
        colorDropdownRef.current &&
        !colorDropdownRef.current.contains(e.target)
      ) {
        setShowColor(false);
      }
      if (
        creating &&
        newEventRef.current &&
        !newEventRef.current.contains(e.target)
      ) {
        setCreating(null);
        setNewTitle("");
        setNewColor("green");
        setShowColor(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [creating, showColor]);

  function scheduleServerSave(id, patch) {
    const map = saveTimersRef.current;
    const existing = map.get(id);
    if (existing?.timer) clearTimeout(existing.timer);

    const mergedPatch = { ...(existing?.patch || {}), ...patch };

    const timer = setTimeout(async () => {
      try {
        await apiUpdate(id, mergedPatch);
      } catch {
      } finally {
        map.delete(id);
      }
    }, 350);

    map.set(id, { timer, patch: mergedPatch });
  }

  function handleGridClick(dayKey, e) {
    if (creating || isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = snapMinutes(yToMinutes(y));

    const startMin = clamp(
      minutes,
      START_HOUR * 60,
      END_HOUR * 60 - MIN_EVENT_MIN,
    );
    const endMin = clamp(
      startMin + MIN_EVENT_MIN,
      startMin + MIN_EVENT_MIN,
      END_HOUR * 60,
    );

    setCreating({ day: dayKey, startMin, endMin });

    setNewTitle("");
    setNewColor("green");
    setShowColor(false);

    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function handleDayMouseMove(dayKey, e) {
    if (creating || isDragging || dragging || resizing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = clamp(e.clientY - rect.top, 0, gridHeightPx);
    const minutes = snapMinutes(yToMinutes(y));
    const startMin = clamp(
      minutes,
      START_HOUR * 60,
      END_HOUR * 60 - MIN_EVENT_MIN,
    );
    setHoverSlot({ day: dayKey, startMin, endMin: startMin + MIN_EVENT_MIN });
  }

  function saveNewEvent() {
    if (!creating || !newTitle.trim()) return;

    const payload = {
      createdBy: createdBy || "",
      day: creating.day,
      startMin: creating.startMin,
      endMin: creating.endMin,
      title: newTitle.trim(),
      variant: newColor,
    };

    const tempId = `tmp_${Date.now()}`;
    const optimistic = { _id: tempId, ...payload };

    setEvents((p) => [...p, optimistic]);
    setCreating(null);
    setNewTitle("");
    setNewColor("green");
    setShowColor(false);

    apiCreate(payload)
      .then((real) => {
        setEvents((prev) => prev.map((x) => (x._id === tempId ? real : x)));
      })
      .catch(() => {
        setEvents((prev) => prev.filter((x) => x._id !== tempId));
      });
  }

  function startDrag(e, ev) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHoverSlot(null);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    const dayWidthPx = rect.width / DAYS.length;

    setDragging({
      id: ev._id,
      startX: x,
      startY: y,
      originalStartMin: ev.startMin,
      originalEndMin: ev.endMin,
      originalDay: ev.day,
      dayWidthPx,
    });
  }

  function startResize(e, ev) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHoverSlot(null);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;

    setResizing({
      id: ev._id,
      startY: y,
      originalEndMin: ev.endMin,
    });
  }

  function onMove(e) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      const x = e.clientX - rect.left;
      const y = clamp(e.clientY - rect.top, 0, gridHeightPx);

      const dayIndex = clamp(
        Math.floor(x / dragging.dayWidthPx),
        0,
        DAYS.length - 1,
      );
      const newDay = DAYS[dayIndex].key;

      const deltaY = y - dragging.startY;
      const deltaMin = yToMinutes(deltaY) - yToMinutes(0);

      const duration = dragging.originalEndMin - dragging.originalStartMin;

      const newStartMin = clamp(
        snapMinutes(dragging.originalStartMin + deltaMin),
        START_HOUR * 60,
        END_HOUR * 60 - MIN_EVENT_MIN,
      );

      const newEndMin = clamp(
        newStartMin + duration,
        newStartMin + MIN_EVENT_MIN,
        END_HOUR * 60,
      );

      setEvents((prev) =>
        prev.map((x) =>
          x._id === dragging.id
            ? { ...x, day: newDay, startMin: newStartMin, endMin: newEndMin }
            : x,
        ),
      );

      if (!String(dragging.id).startsWith("tmp_")) {
        scheduleServerSave(dragging.id, {
          day: newDay,
          startMin: newStartMin,
          endMin: newEndMin,
        });
      }
    }

    if (resizing) {
      const y = clamp(e.clientY - rect.top, 0, gridHeightPx);
      const deltaY = y - resizing.startY;
      const deltaMin = yToMinutes(deltaY) - yToMinutes(0);

      const current = events.find((x) => x._id === resizing.id);
      if (!current) return;

      const newEndMin = clamp(
        snapMinutes(resizing.originalEndMin + deltaMin),
        current.startMin + MIN_EVENT_MIN,
        END_HOUR * 60,
      );

      setEvents((prev) =>
        prev.map((x) =>
          x._id === resizing.id ? { ...x, endMin: newEndMin } : x,
        ),
      );

      if (!String(resizing.id).startsWith("tmp_")) {
        scheduleServerSave(resizing.id, { endMin: newEndMin });
      }
    }
  }

  function onUp() {
    setIsDragging(false);
    setDragging(null);
    setResizing(null);
  }

  useEffect(() => {
    if (!dragging && !resizing) return;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, resizing, events]);

  async function removeEvent(id) {
    setEvents((p) => p.filter((x) => x._id !== id));
    if (String(id).startsWith("tmp_")) return;
    try {
      await apiDelete(id);
    } catch {
      // optional: refetch if needed
    }
  }

  function autoGrow(el) {
    if (!el) return;
    const max = CREATE_EDITOR_MIN_HEIGHT - 36 - 40;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }

  // FIXED COLOR SCHEME FOR BETTER CONTRAST
  const shell = darkMode ? "bg-gray-900" : "bg-gray-50";
  const gridBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-300";
  const dayHeaderBg = darkMode ? "bg-gray-800" : "bg-gray-200";
  const dayHeaderText = darkMode ? "text-white" : "text-gray-800";
  const timeHeaderBg = darkMode ? "bg-gray-800" : "bg-gray-200";
  const timeHeaderText = darkMode ? "text-gray-300" : "text-gray-700";
  const hourText = darkMode ? "text-gray-400" : "text-gray-600";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-600";

  return (
    <div className={`min-h-screen ${shell} pt-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1
              className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Wochenplan
            </h1>
          </div>
        </div>

        <div
          className={` border ${borderColor} overflow-hidden shadow-sm ${gridBg}`}
          ref={containerRef}
        >
          <div className="flex">
            {/* Time column */}
            <div className="w-16 flex-shrink-0 border-r border-gray-300 dark:border-gray-700">
              <div
                className={`h-10 ${timeHeaderBg} flex items-center justify-center border-b ${borderColor}`}
              >
                <span className={`text-xs font-medium ${timeHeaderText}`}>
                  ZEIT
                </span>
              </div>

              <div className="relative" style={{ height: gridHeightPx }}>
                {visibleHours.map((hour) => (
                  <div
                    key={hour}
                    className={`absolute left-0 right-0 border-t ${borderColor}`}
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  >
                    <div
                      className={`text-xs ${hourText} w-full text-center py-2`}
                    >
                      {hour}:00
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="flex-1">
              <div className="flex">
                {DAYS.map((day) => (
                  <div
                    key={day.key}
                    className={`flex-1 h-10 ${dayHeaderBg} border-r ${borderColor} last:border-r-0 flex items-center justify-center`}
                  >
                    <div className={`font-medium ${dayHeaderText}`}>
                      {day.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: gridHeightPx }}>
                {/* hour lines */}
                {visibleHours.map((hour) => (
                  <div
                    key={hour}
                    className={`absolute left-0 right-0 border-t ${borderColor}`}
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* click columns */}
                {DAYS.map((day, index) => (
                  <div
                    key={day.key}
                    className={`absolute top-0 bottom-0 border-r ${borderColor} last:border-r-0`}
                    style={{
                      left: `${index * colW}%`,
                      width: `${colW}%`,
                    }}
                    onClick={(e) => handleGridClick(day.key, e)}
                    onMouseMove={(e) => handleDayMouseMove(day.key, e)}
                    onMouseLeave={() => setHoverSlot(null)}
                  />
                ))}

                {/* hover slot */}
                {hoverSlot && !creating && !dragging && !resizing && (
                  <div
                    className={cx(
                      "absolute z-[5] pointer-events-none border",
                      darkMode
                        ? "border-white/20 bg-white/10"
                        : "border-gray-400/30 bg-gray-400/10",
                    )}
                    style={{
                      left: `${DAYS.findIndex((d) => d.key === hoverSlot.day) * colW}%`,
                      width: `${colW}%`,
                      top: minutesToY(hoverSlot.startMin),
                      height: Math.max(
                        minutesToY(hoverSlot.endMin) -
                          minutesToY(hoverSlot.startMin),
                        40,
                      ),
                    }}
                  />
                )}

                {/* creating editor */}
                {creating &&
                  (() => {
                    const dayIndex = DAYS.findIndex(
                      (d) => d.key === creating.day,
                    );
                    if (dayIndex === -1) return null;

                    const baseTop = minutesToY(creating.startMin);
                    const top = clamp(
                      baseTop,
                      2,
                      gridHeightPx - CREATE_EDITOR_MIN_HEIGHT - 2,
                    );

                    return (
                      <div
                        ref={newEventRef}
                        className="absolute z-40 shadow-xl"
                        style={{
                          left: `${dayIndex * colW}%`,
                          width: `${colW}%`,
                          top,
                          height: CREATE_EDITOR_MIN_HEIGHT,
                        }}
                      >
                        <div
                          className={cx(
                            "h-full overflow-hidden border rounded",
                            darkMode
                              ? "border-blue-500/50 bg-gray-800"
                              : "border-blue-400 bg-white",
                          )}
                        >
                          {/* header */}
                          <div
                            className={cx(
                              "h-9 flex items-center justify-between px-2",
                              darkMode
                                ? "border-b border-gray-700"
                                : "border-b border-gray-200",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative" ref={colorDropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setShowColor((s) => !s)}
                                  className={cx(
                                    "h-7 px-2 rounded border text-xs flex items-center gap-1",
                                    darkMode
                                      ? "border-gray-600 hover:bg-gray-700 text-gray-200"
                                      : "border-gray-300 hover:bg-gray-100 text-gray-700",
                                  )}
                                >
                                  <div
                                    className={cx(
                                      "w-3 h-3 rounded-full",
                                      COLOR_OPTIONS.find(
                                        (c) => c.id === newColor,
                                      )?.dot,
                                    )}
                                  />
                                  <FiChevronDown className="w-3 h-3" />
                                </button>

                                {showColor && (
                                  <div
                                    className={cx(
                                      "absolute top-full left-0 mt-1 py-1 rounded shadow-lg z-50 min-w-[150px]",
                                      darkMode
                                        ? "bg-gray-800 border border-gray-700"
                                        : "bg-white border border-gray-200",
                                    )}
                                  >
                                    {COLOR_OPTIONS.map((c) => (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                          setNewColor(c.id);
                                          setShowColor(false);
                                        }}
                                        className={cx(
                                          "w-full px-3 py-2 text-sm flex items-center gap-2",
                                          darkMode
                                            ? "text-gray-200 hover:bg-gray-700"
                                            : "text-gray-700 hover:bg-gray-100",
                                        )}
                                      >
                                        <div
                                          className={`w-3 h-3 rounded-full ${c.dot}`}
                                        />
                                        <span>{c.name}</span>
                                        {newColor === c.id && (
                                          <FiCheck className="w-3 h-3 ml-auto" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className={`text-[11px] ${textMuted}`}>
                                {fmtTime(creating.startMin)}–
                                {fmtTime(creating.endMin)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCreating(null);
                                setNewTitle("");
                                setNewColor("green");
                                setShowColor(false);
                              }}
                              className={cx(
                                "h-7 w-7 rounded flex items-center justify-center",
                                darkMode
                                  ? "hover:bg-gray-700 text-gray-300"
                                  : "hover:bg-gray-100 text-gray-600",
                              )}
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </div>

                          {/* body */}
                          <div className="flex flex-col h-[calc(100%-36px)]">
                            <div className="flex-1">
                              <textarea
                                ref={textareaRef}
                                value={newTitle}
                                onChange={(e) => {
                                  setNewTitle(e.target.value);
                                  autoGrow(e.target);
                                }}
                                onInput={(e) => autoGrow(e.target)}
                                className={cx(
                                  "w-full h-full border-0 outline-none resize-none",
                                  "text-sm leading-snug px-3 py-3",
                                  darkMode
                                    ? "bg-gray-800 text-white placeholder-gray-400"
                                    : "bg-white text-gray-900 placeholder-gray-500",
                                )}
                                placeholder="Terminname eingeben"
                                autoFocus
                              />
                            </div>

                            <div
                              className={cx(
                                "h-10 flex items-center justify-end px-3",
                                darkMode
                                  ? "border-t border-gray-700"
                                  : "border-t border-gray-200",
                              )}
                            >
                              <button
                                type="button"
                                onClick={saveNewEvent}
                                disabled={!newTitle.trim()}
                                className={cx(
                                  "h-8 px-3 rounded text-sm font-medium transition-colors",
                                  newTitle.trim()
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed",
                                )}
                              >
                                Speichern
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* existing events */}
                {events.map((ev) => {
                  const dayIndex = DAYS.findIndex((d) => d.key === ev.day);
                  if (dayIndex === -1) return null;

                  const top = minutesToY(ev.startMin);
                  const h = minutesToY(ev.endMin) - minutesToY(ev.startMin);
                  if (h <= 0) return null;

                  const v = variantClass(ev.variant, darkMode);

                  return (
                    <div
                      key={ev._id}
                      className={cx(
                        "absolute border shadow-sm group overflow-hidden ",
                        v.border,
                        v.bg,
                        dragging?.id === ev._id || resizing?.id === ev._id
                          ? "ring-1 ring-blue-500 z-30"
                          : "z-20 hover:shadow",
                      )}
                      style={{
                        left: `${dayIndex * colW}%`,
                        width: `${colW}%`,
                        top,
                        height: h,
                        minHeight: 40,
                      }}
                    >
                      <div
                        className="relative h-full cursor-move"
                        onMouseDown={(e) => startDrag(e, ev)}
                      >
                        <div className="px-3 py-2">
                          <div
                            className={cx(
                              "text-xs font-medium leading-snug",
                              "whitespace-pre-wrap break-words",
                              v.text,
                            )}
                            style={{ wordBreak: "break-word" }}
                          >
                            {ev.title}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEvent(ev._id);
                          }}
                          className={cx(
                            "absolute top-1.5 right-1.5",
                            "opacity-0 group-hover:opacity-100",
                            "p-1 rounded",
                            "hover:bg-white/20 dark:hover:bg-black/25 transition",
                            darkMode ? "text-gray-300" : "text-gray-600",
                          )}
                          title="Löschen"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/10 dark:hover:bg-white/10 transition-colors rounded-b"
                        onMouseDown={(e) => startResize(e, ev)}
                      >
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
                          <MdDragIndicator className="w-3 h-3 rotate-90" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* current time line */}
                {(() => {
                  const nowMin =
                    new Date().getHours() * 60 + new Date().getMinutes();
                  const within =
                    nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;
                  if (!within) return null;

                  return (
                    <div
                      className="absolute left-0 right-0 h-px bg-red-500 pointer-events-none z-10"
                      style={{ top: minutesToY(nowMin) }}
                    >
                      <div className="absolute -top-0.5 left-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* legend */}
        <div className="mt-4 flex items-center gap-3">
          {COLOR_OPTIONS.map((c) => (
            <div key={c.id} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span className={`text-xs ${textMuted}`}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
