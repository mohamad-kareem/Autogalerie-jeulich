"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiTrash2, FiX, FiCheck, FiChevronDown, FiPlus } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";

const cx = (...c) => c.filter(Boolean).join(" ");

const DAYS = [
  { key: "mon", label: "Mo", full: "Montag" },
  { key: "tue", label: "Di", full: "Dienstag" },
  { key: "wed", label: "Mi", full: "Mittwoch" },
  { key: "thu", label: "Do", full: "Donnerstag" },
  { key: "fri", label: "Fr", full: "Freitag" },
  { key: "sat", label: "Sa", full: "Samstag" },
];

const START_HOUR = 10;
const END_HOUR = 19;
const VISIBLE_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 44;
const HOUR_HEIGHT_MOBILE = 48;
const MINUTES_PER_DAY = 24 * 60;
const SNAP_MIN = 30;
const MIN_EVENT_MIN = 60;

const CREATE_EDITOR_MIN_HEIGHT = 150;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function snapMinutes(min) {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}
function minutesToY(min, isMobile) {
  const minutesFromStart = min - START_HOUR * 60;
  const hourHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
  return (minutesFromStart / 60) * hourHeight;
}
function yToMinutes(y, isMobile) {
  const hourHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
  return (y / hourHeight) * 60 + START_HOUR * 60;
}
function fmtTime(min) {
  const m = clamp(Math.round(min), 0, MINUTES_PER_DAY);
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Dates of this week's Mon–Sat and the index of today (-1 on Sunday). */
function currentWeek() {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const dates = DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const todayIndex = now.getDay() === 0 ? -1 : now.getDay() - 1;
  // ISO calendar week
  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const week = 1 + Math.round(((thursday - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return { dates, todayIndex, week };
}

const COLOR_OPTIONS = [
  { id: "red", name: "Dringend", dot: "bg-rose-500" },
  { id: "yellow", name: "Wichtig", dot: "bg-amber-400" },
  { id: "green", name: "Bestätigt", dot: "bg-emerald-400" },
];

function variantClass(variant, darkMode) {
  const map = {
    red: {
      accent: "border-l-rose-500",
      bg: darkMode ? "bg-rose-500/15" : "bg-rose-50",
      border: darkMode ? "border-rose-400/30" : "border-rose-200",
      text: darkMode ? "text-rose-200" : "text-rose-900",
      hover: darkMode ? "hover:bg-rose-500/16" : "hover:bg-rose-500/18",
    },
    yellow: {
      accent: "border-l-amber-400",
      bg: darkMode ? "bg-amber-400/15" : "bg-amber-50",
      border: darkMode ? "border-amber-300/30" : "border-amber-200",
      text: darkMode ? "text-amber-100" : "text-amber-900",
      hover: darkMode ? "hover:bg-amber-400/16" : "hover:bg-amber-400/18",
    },
    green: {
      accent: "border-l-emerald-500",
      bg: darkMode ? "bg-emerald-400/15" : "bg-emerald-50",
      border: darkMode ? "border-emerald-300/30" : "border-emerald-200",
      text: darkMode ? "text-emerald-100" : "text-emerald-900",
      hover: darkMode ? "hover:bg-emerald-400/16" : "hover:bg-emerald-400/18",
    },
  };
  return map[variant] || map.green;
}

/* ---------------- API (GLOBAL) ---------------- */

async function apiGet() {
  const res = await fetch(`/api/schedule`, { cache: "no-store" });
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
  className = "",
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDay, setActiveDay] = useState("mon");

  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [creating, setCreating] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("green");
  const [showColor, setShowColor] = useState(false);
  const [showMobileEditor, setShowMobileEditor] = useState(false);

  const [hoverSlot, setHoverSlot] = useState(null);

  const containerRef = useRef(null);
  const daysContainerRef = useRef(null);
  const newEventRef = useRef(null);
  const colorDropdownRef = useRef(null);
  const textareaRef = useRef(null);

  const saveTimersRef = useRef(new Map());

  const hourHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
  const colW = 100 / DAYS.length;
  const gridHeightPx = VISIBLE_HOURS * hourHeight;

  const visibleHours = useMemo(
    () => Array.from({ length: VISIBLE_HOURS + 1 }, (_, i) => START_HOUR + i),
    [],
  );

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet()
      .then((items) => {
        if (!alive) return;
        setEvents(items);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

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
        setShowMobileEditor(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
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
    const minutes = snapMinutes(yToMinutes(y, isMobile));

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

    if (isMobile) {
      setCreating({ day: dayKey, startMin, endMin });
      setShowMobileEditor(true);
    } else {
      setCreating({ day: dayKey, startMin, endMin });
    }

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
    const minutes = snapMinutes(yToMinutes(y, isMobile));
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
    setShowMobileEditor(false);

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

    const rect = daysContainerRef.current?.getBoundingClientRect();
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

    const rect = daysContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;

    setResizing({
      id: ev._id,
      startY: y,
      originalEndMin: ev.endMin,
    });
  }

  function onMove(e) {
    const rect = daysContainerRef.current?.getBoundingClientRect();
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
      const deltaMin = yToMinutes(deltaY, isMobile) - yToMinutes(0, isMobile);

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
      const deltaMin = yToMinutes(deltaY, isMobile) - yToMinutes(0, isMobile);

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
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, resizing, events]);

  async function removeEvent(id) {
    setEvents((p) => p.filter((x) => x._id !== id));
    if (String(id).startsWith("tmp_")) return;
    try {
      await apiDelete(id);
    } catch {}
  }

  function autoGrow(el) {
    if (!el) return;
    const max = CREATE_EDITOR_MIN_HEIGHT - 36 - 40;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }

  // Mobile: Get events for active day
  const mobileDayEvents = useMemo(() => {
    return events.filter((event) => event.day === activeDay);
  }, [events, activeDay]);

  const shell = "";
  const gridBg = darkMode ? "bg-gray-800" : "bg-white";
  const borderColor = darkMode ? "border-gray-700/70" : "border-gray-100";
  const frameBorder = darkMode ? "border-gray-700" : "border-gray-200";
  const dayHeaderBg = darkMode ? "bg-gray-800" : "bg-gray-50/80";
  const dayHeaderText = darkMode ? "text-gray-200" : "text-gray-700";
  const timeHeaderBg = darkMode ? "bg-gray-800" : "bg-gray-50/80";
  const timeHeaderText = darkMode ? "text-gray-400" : "text-gray-500";
  const hourText = darkMode ? "text-gray-500" : "text-gray-400";
  const textMuted = darkMode ? "text-gray-400" : "text-gray-500";
  const { dates: weekDates, todayIndex, week } = currentWeek();
  const dateLabel = (d) => d.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });
  const todayTint = darkMode ? "bg-sky-400/5" : "bg-sky-50/60";

  return (
    <section className={cx("w-full mt-6", shell, className)}>
      <div
        className={cx(
          "w-full overflow-hidden rounded-lg border shadow-sm",
          frameBorder,
          gridBg,
        )}
      >
        <div
          className={cx(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-3 py-2",
            frameBorder,
          )}
        >
          <div className="flex items-baseline gap-2">
            <h2
              className={`text-sm font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Wochenplan
            </h2>
            <span className={`text-[11px] tabular-nums ${textMuted}`}>
              KW {week} · {dateLabel(weekDates[0])} – {dateLabel(weekDates[weekDates.length - 1])}
            </span>
            {loading && <span className={`text-[11px] ${textMuted}`}>Lädt…</span>}
          </div>
          <div className="flex items-center gap-3">
            {COLOR_OPTIONS.map((c) => (
              <div key={c.id} className="flex items-center gap-1">
                <div className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                <span className={`text-[11px] ${textMuted}`}>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile day selector */}
        {isMobile && (
          <div className={cx("overflow-x-auto border-b px-2 py-1.5", frameBorder)}>
            <div className="flex gap-1 min-w-max">
              {DAYS.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setActiveDay(day.key)}
                  className={cx(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    activeDay === day.key
                      ? darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-900 text-white"
                      : darkMode
                        ? "text-gray-400 hover:bg-gray-700/60"
                        : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Full width container */}
        <div className={cx("w-full overflow-hidden", gridBg)} ref={containerRef}>
          {/* Desktop View */}
          {!isMobile ? (
            <div className="flex w-full">
              {/* Time column */}
              <div className={`w-11 flex-shrink-0 border-r ${frameBorder}`}>
                <div className={`h-9 ${timeHeaderBg} border-b ${frameBorder}`} />

                <div className="relative" style={{ height: gridHeightPx }}>
                  {visibleHours.slice(0, -1).map((hour) => (
                    <div
                      key={hour}
                      className={`absolute right-1.5 text-[10px] leading-none tabular-nums ${hourText}`}
                      style={{ top: (hour - START_HOUR) * hourHeight + 3 }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Days */}
              <div className="flex-1 min-w-0">
                <div className="flex">
                  {DAYS.map((day, index) => (
                    <div
                      key={day.key}
                      className={cx(
                        "flex-1 h-9 border-r border-b last:border-r-0 flex items-center justify-center gap-1.5",
                        frameBorder,
                        index === todayIndex ? todayTint : dayHeaderBg,
                      )}
                    >
                      <span
                        className={cx(
                          "text-[11px] font-semibold uppercase tracking-wide",
                          index === todayIndex ? "text-sky-600" : dayHeaderText,
                        )}
                      >
                        {day.label}
                      </span>
                      <span
                        className={cx(
                          "text-[11px] tabular-nums",
                          index === todayIndex
                            ? "rounded bg-sky-600 px-1 font-semibold text-white"
                            : textMuted,
                        )}
                      >
                        {dateLabel(weekDates[index])}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="relative"
                  style={{ height: gridHeightPx }}
                  ref={daysContainerRef}
                >
                  {/* today */}
                  {todayIndex >= 0 && (
                    <div
                      className={cx("absolute top-0 bottom-0 pointer-events-none", todayTint)}
                      style={{ left: `${todayIndex * colW}%`, width: `${colW}%` }}
                    />
                  )}

                  {/* hour lines, faint half-hour lines */}
                  {visibleHours.map((hour) => (
                    <React.Fragment key={hour}>
                      <div
                        className={`absolute left-0 right-0 border-t ${borderColor}`}
                        style={{ top: (hour - START_HOUR) * hourHeight }}
                      />
                      {hour < END_HOUR && (
                        <div
                          className={cx(
                            "absolute left-0 right-0 border-t border-dashed",
                            darkMode ? "border-gray-700/40" : "border-gray-100/70",
                          )}
                          style={{ top: (hour - START_HOUR) * hourHeight + hourHeight / 2 }}
                        />
                      )}
                    </React.Fragment>
                  ))}

                  {/* click columns */}
                  {DAYS.map((day, index) => (
                    <div
                      key={day.key}
                      className={`absolute top-0 bottom-0 border-r ${borderColor} last:border-r-0`}
                      style={{ left: `${index * colW}%`, width: `${colW}%` }}
                      onClick={(e) => handleGridClick(day.key, e)}
                      onMouseMove={(e) => handleDayMouseMove(day.key, e)}
                      onMouseLeave={() => setHoverSlot(null)}
                    />
                  ))}

                  {/* hover slot */}
                  {hoverSlot && !creating && !dragging && !resizing && (
                    <div
                      className={cx(
                        "absolute z-[5] pointer-events-none rounded-md border border-dashed",
                        darkMode
                          ? "border-white/20 bg-white/5"
                          : "border-sky-300 bg-sky-50/60",
                      )}
                      style={{
                        left: `calc(${
                          DAYS.findIndex((d) => d.key === hoverSlot.day) * colW
                        }% + 2px)`,
                        width: `calc(${colW}% - 4px)`,
                        top: minutesToY(hoverSlot.startMin, isMobile),
                        height: Math.max(
                          minutesToY(hoverSlot.endMin, isMobile) -
                            minutesToY(hoverSlot.startMin, isMobile),
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

                      const baseTop = minutesToY(creating.startMin, isMobile);
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
                              "h-full overflow-hidden border rounded-md",
                              darkMode
                                ? "border-sky-500/50 bg-gray-800"
                                : "border-sky-400 bg-white",
                            )}
                          >
                            {/* header */}
                            <div
                              className={cx(
                                "h-8 flex items-center justify-between px-2",
                                darkMode
                                  ? "border-b border-gray-700"
                                  : "border-b border-gray-200",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="relative"
                                  ref={colorDropdownRef}
                                >
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
                            <div className="flex flex-col h-[calc(100%-32px)]">
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
                                    "text-xs leading-snug px-2.5 py-2",
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
                                  "h-9 flex items-center justify-end px-2",
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
                                    "h-7 px-3 rounded text-xs font-semibold transition-colors",
                                    newTitle.trim()
                                      ? "bg-gray-900 hover:bg-gray-800 text-white dark:bg-sky-600 dark:hover:bg-sky-500"
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

                    const top = minutesToY(ev.startMin, isMobile);
                    const h =
                      minutesToY(ev.endMin, isMobile) -
                      minutesToY(ev.startMin, isMobile);
                    if (h <= 0) return null;

                    const v = variantClass(ev.variant, darkMode);

                    return (
                      <div
                        key={ev._id}
                        className={cx(
                          "absolute rounded-md border border-l-[3px] group overflow-hidden",
                          v.border,
                          v.accent,
                          v.bg,
                          dragging?.id === ev._id || resizing?.id === ev._id
                            ? "ring-1 ring-sky-500 shadow-md z-30"
                            : "z-20 hover:shadow-sm",
                        )}
                        style={{
                          left: `calc(${dayIndex * colW}% + 2px)`,
                          width: `calc(${colW}% - 4px)`,
                          top: top + 1,
                          height: h - 2,
                          minHeight: 30,
                        }}
                      >
                        <div
                          className="relative h-full cursor-move"
                          onMouseDown={(e) => startDrag(e, ev)}
                        >
                          {ev.endMin - ev.startMin <= 60 ? (
                            // Short slot: time inline, title on up to two lines.
                            <div className="px-1.5 py-1">
                              <div
                                className={cx("text-[11px] font-medium leading-snug max-h-[2.75em] overflow-hidden break-words", v.text)}
                              >
                                <span className="mr-1 text-[10px] font-normal tabular-nums opacity-70">
                                  {fmtTime(ev.startMin)}
                                </span>
                                {ev.title}
                              </div>
                            </div>
                          ) : (
                            <div className="px-1.5 py-1">
                              <div className={cx("text-[10px] leading-tight tabular-nums opacity-70", v.text)}>
                                {fmtTime(ev.startMin)}–{fmtTime(ev.endMin)}
                              </div>
                              <div
                                className={cx(
                                  "text-[11px] font-medium leading-snug",
                                  "whitespace-pre-wrap break-words",
                                  v.text,
                                )}
                                style={{ wordBreak: "break-word" }}
                              >
                                {ev.title}
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEvent(ev._id);
                            }}
                            className={cx(
                              "absolute top-0.5 right-0.5",
                              "opacity-0 group-hover:opacity-100",
                              "p-1 rounded",
                              darkMode ? "bg-gray-800/90" : "bg-white/90",
                              "hover:bg-white/20 dark:hover:bg-black/25 transition",
                              darkMode ? "text-gray-300" : "text-gray-600",
                            )}
                            title="Löschen"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div
                          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                          onMouseDown={(e) => startResize(e, ev)}
                        >
                        </div>
                      </div>
                    );
                  })}

                  {/* current time line */}
                  {(() => {
                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    const within =
                      nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;
                    if (!within) return null;

                    if (todayIndex < 0) return null;

                    return (
                      <div
                        className="absolute h-px bg-rose-500 pointer-events-none z-30"
                        style={{
                          top: minutesToY(nowMin, isMobile),
                          left: `${todayIndex * colW}%`,
                          width: `${colW}%`,
                        }}
                      >
                        <div className="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            // Mobile View
            <div className="flex flex-col ">
              {/* Mobile header with time and day */}
              <div className={`flex h-8 items-center justify-center gap-1.5 border-b ${frameBorder} ${dayHeaderBg}`}>
                <span className={`text-xs font-semibold ${dayHeaderText}`}>
                  {DAYS.find((d) => d.key === activeDay)?.full}
                </span>
                <span className={`text-[11px] tabular-nums ${textMuted}`}>
                  {dateLabel(weekDates[DAYS.findIndex((d) => d.key === activeDay)])}
                </span>
              </div>

              {/* Mobile grid */}
              <div
                className="relative overflow-y-hidden "
                style={{
                  height: Math.min(gridHeightPx + 60, window.innerHeight * 0.6),
                }}
                ref={daysContainerRef}
              >
                {/* Time labels */}
                <div className={`absolute left-0 top-0 bottom-0 w-11 border-r ${frameBorder}`}>
                  {visibleHours.slice(0, -1).map((hour) => (
                    <div
                      key={hour}
                      className={`absolute right-1.5 text-[10px] leading-none tabular-nums ${hourText}`}
                      style={{ top: (hour - START_HOUR) * hourHeight + 3 }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* Main day column */}
                <div
                  className="absolute left-11 right-0 top-0 bottom-0"
                  onClick={(e) => handleGridClick(activeDay, e)}
                  onMouseMove={(e) => handleDayMouseMove(activeDay, e)}
                  onMouseLeave={() => setHoverSlot(null)}
                >
                  {/* Hour lines */}
                  {visibleHours.map((hour) => (
                    <div
                      key={hour}
                      className={`absolute left-0 right-0 border-t ${borderColor}`}
                      style={{ top: (hour - START_HOUR) * hourHeight }}
                    />
                  ))}

                  {/* Hover slot */}
                  {hoverSlot && !creating && !dragging && !resizing && (
                    <div
                      className={cx(
                        "absolute z-[5] pointer-events-none border",
                        darkMode
                          ? "border-white/20 bg-white/10"
                          : "border-gray-400/30 bg-gray-400/10",
                      )}
                      style={{
                        left: 0,
                        right: 0,
                        top: minutesToY(hoverSlot.startMin, isMobile),
                        height: Math.max(
                          minutesToY(hoverSlot.endMin, isMobile) -
                            minutesToY(hoverSlot.startMin, isMobile),
                          40,
                        ),
                      }}
                    />
                  )}

                  {/* Events for active day */}
                  {mobileDayEvents.map((ev) => {
                    const top = minutesToY(ev.startMin, isMobile);
                    const h =
                      minutesToY(ev.endMin, isMobile) -
                      minutesToY(ev.startMin, isMobile);
                    if (h <= 0) return null;

                    const v = variantClass(ev.variant, darkMode);

                    return (
                      <div
                        key={ev._id}
                        className={cx(
                          "absolute left-1.5 right-1.5 border border-l-[3px] group overflow-hidden rounded-md",
                          v.border,
                          v.accent,
                          v.bg,
                          dragging?.id === ev._id || resizing?.id === ev._id
                            ? "ring-1 ring-blue-500 z-30"
                            : "z-20",
                        )}
                        style={{
                          top,
                          height: Math.max(h - 2, 40),
                        }}
                      >
                        <div
                          className="relative h-full px-2.5 py-1.5"
                          onMouseDown={(e) => startDrag(e, ev)}
                          onTouchStart={(e) => startDrag(e, ev)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div
                                className={cx(
                                  "text-xs font-medium leading-snug",
                                  v.text,
                                )}
                                style={{ wordBreak: "break-word" }}
                              >
                                {ev.title}
                              </div>
                              <div className={`text-[10px] tabular-nums ${textMuted}`}>
                                {fmtTime(ev.startMin)} – {fmtTime(ev.endMin)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeEvent(ev._id);
                              }}
                              className={cx(
                                "p-1 rounded ml-1",
                                "hover:bg-white/20 dark:hover:bg-black/25 transition",
                                darkMode ? "text-gray-300" : "text-gray-600",
                              )}
                              title="Löschen"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div
                            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize"
                            onMouseDown={(e) => startResize(e, ev)}
                            onTouchStart={(e) => startResize(e, ev)}
                          >
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
                              <MdDragIndicator className="w-4 h-4 rotate-90" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current time line for mobile */}
                  {(() => {
                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    const within =
                      nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;
                    if (!within) return null;

                    return (
                      <div
                        className="absolute left-0 right-0 h-px bg-red-500 pointer-events-none z-10"
                        style={{ top: minutesToY(nowMin, isMobile) }}
                      >
                        <div className="absolute -top-0.5 left-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Mobile Editor Modal */}
          {isMobile && showMobileEditor && creating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div
                ref={newEventRef}
                className={cx(
                  "w-full max-w-md max-h-[85vh] overflow-hidden border rounded-lg shadow-xl flex flex-col",
                  darkMode
                    ? "border-blue-500/50 bg-gray-800"
                    : "border-blue-400 bg-white",
                )}
              >
                {/* header */}
                <div
                  className={cx(
                    "h-12 flex items-center justify-between px-4",
                    darkMode
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative" ref={colorDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowColor((s) => !s)}
                        className={cx(
                          "h-8 px-3 rounded border text-sm flex items-center gap-2",
                          darkMode
                            ? "border-gray-600 hover:bg-gray-700 text-gray-200"
                            : "border-gray-300 hover:bg-gray-100 text-gray-700",
                        )}
                      >
                        <div
                          className={cx(
                            "w-3 h-3 rounded-full",
                            COLOR_OPTIONS.find((c) => c.id === newColor)?.dot,
                          )}
                        />
                        <FiChevronDown className="w-3 h-3" />
                      </button>

                      {showColor && (
                        <div
                          className={cx(
                            "absolute top-full left-0 mt-1 py-2 rounded-lg shadow-lg z-50 min-w-[180px]",
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
                                "w-full px-4 py-3 text-sm flex items-center gap-3",
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
                                <FiCheck className="w-4 h-4 ml-auto" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`text-sm ${textMuted}`}>
                      {fmtTime(creating.startMin)}–{fmtTime(creating.endMin)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCreating(null);
                      setNewTitle("");
                      setNewColor("green");
                      setShowColor(false);
                      setShowMobileEditor(false);
                    }}
                    className={cx(
                      "h-8 w-8 rounded flex items-center justify-center",
                      darkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-600",
                    )}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* body */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <textarea
                      ref={textareaRef}
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        autoGrow(e.target);
                      }}
                      onInput={(e) => autoGrow(e.target)}
                      className={cx(
                        "w-full min-h-[120px] border rounded-lg outline-none resize-none",
                        "text-base leading-relaxed p-3",
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500",
                      )}
                      placeholder="Terminname eingeben"
                      autoFocus
                    />
                  </div>
                </div>

                {/* footer */}
                <div
                  className={cx(
                    "h-14 flex items-center justify-between px-4",
                    darkMode
                      ? "border-t border-gray-700"
                      : "border-t border-gray-200",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCreating(null);
                      setNewTitle("");
                      setNewColor("green");
                      setShowColor(false);
                      setShowMobileEditor(false);
                    }}
                    className={cx(
                      "h-10 px-4 rounded text-sm font-medium",
                      darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={saveNewEvent}
                    disabled={!newTitle.trim()}
                    className={cx(
                      "h-10 px-6 rounded text-sm font-medium transition-colors",
                      newTitle.trim()
                        ? darkMode
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed",
                    )}
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
