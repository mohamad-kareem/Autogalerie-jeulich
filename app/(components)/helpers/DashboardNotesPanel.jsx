"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiStar,
  FiEdit2,
  FiSave,
  FiX,
  FiMoreHorizontal,
} from "react-icons/fi";

const cx = (...c) => c.filter(Boolean).join(" ");

function fmtDate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * DashboardNotesPanel (compact)
 * - Header only: title + "Hinzufügen" button
 * - Clicking "Hinzufügen" reveals textarea + actions
 * - Each note has a 3-dots menu (Pin/Edit/Delete) that renders in a portal (fixes clipping)
 */
export default function DashboardNotesPanel({
  darkMode = false,
  createdBy = "",
}) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [busyId, setBusyId] = useState(null);
  const [menu, setMenu] = useState(null); // { id, x, y }
  const abortRef = useRef(null);

  const sortedNotes = useMemo(() => {
    const arr = Array.isArray(notes) ? [...notes] : [];
    arr.sort((a, b) => {
      const ap = a?.pinned ? 1 : 0;
      const bp = b?.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      const at = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const bt = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return bt - at;
    });
    return arr;
  }, [notes]);

  const load = async () => {
    try {
      setLoading(true);
      abortRef.current?.abort?.();
      abortRef.current = new AbortController();

      const res = await fetch("/api/dashboard-notes", {
        method: "GET",
        cache: "no-store",
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to load notes");
      const json = await res.json();
      setNotes(Array.isArray(json?.notes) ? json.notes : []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort?.();
  }, []);

  // Close menu on outside click / ESC, and keep it positioned on resize/scroll
  useEffect(() => {
    const close = () => setMenu(null);

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };

    const onDown = (e) => {
      // if click is inside the menu itself, ignore
      const el = e.target;
      if (el?.closest?.("[data-notes-menu]")) return;
      close();
    };

    const onScroll = () => {
      // optional: close on scroll so it never feels misplaced
      if (menu) close();
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const createNote = async () => {
    const value = text.trim();
    if (!value) return;

    setCreating(true);
    try {
      const res = await fetch("/api/dashboard-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, createdBy }),
      });

      if (!res.ok) throw new Error("Create failed");
      const json = await res.json();

      if (json?.note) {
        setNotes((prev) => [json.note, ...(Array.isArray(prev) ? prev : [])]);
      } else {
        await load();
      }

      setText("");
      setComposerOpen(false);
    } catch {
      alert("Fehler: Notiz konnte nicht erstellt werden.");
    } finally {
      setCreating(false);
    }
  };

  const togglePin = async (note) => {
    if (!note?._id) return;
    const id = note._id;

    // optimistic
    setNotes((prev) =>
      (Array.isArray(prev) ? prev : []).map((n) =>
        n._id === id ? { ...n, pinned: !n.pinned } : n,
      ),
    );

    setBusyId(id);
    try {
      const res = await fetch("/api/dashboard-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pinned: !note.pinned }),
      });

      if (!res.ok) throw new Error("Pin failed");
      const json = await res.json();

      if (json?.note) {
        setNotes((prev) =>
          (Array.isArray(prev) ? prev : []).map((n) =>
            n._id === id ? json.note : n,
          ),
        );
      } else {
        await load();
      }
    } catch {
      // rollback
      setNotes((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n._id === id ? { ...n, pinned: note.pinned } : n,
        ),
      );
      alert("Fehler: Pin konnte nicht gespeichert werden.");
    } finally {
      setBusyId(null);
      setMenu(null);
    }
  };

  const startEdit = (note) => {
    setEditId(note?._id || null);
    setEditText(String(note?.text || ""));
    setMenu(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditText("");
  };

  const saveEdit = async () => {
    const id = editId;
    const value = editText.trim();
    if (!id) return;
    if (!value) return alert("Notiztext darf nicht leer sein.");

    setSavingEdit(true);
    try {
      const res = await fetch("/api/dashboard-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text: value }),
      });

      if (!res.ok) throw new Error("Edit failed");
      const json = await res.json();

      if (json?.note) {
        setNotes((prev) =>
          (Array.isArray(prev) ? prev : []).map((n) =>
            n._id === id ? json.note : n,
          ),
        );
      } else {
        await load();
      }

      cancelEdit();
    } catch {
      alert("Fehler: Notiz konnte nicht gespeichert werden.");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteNote = async (id) => {
    if (!id) return;

    const prev = notes;
    setNotes((p) => (Array.isArray(p) ? p.filter((n) => n._id !== id) : p));

    setBusyId(id);
    try {
      const res = await fetch("/api/dashboard-notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setNotes(prev);
      alert("Fehler: Notiz konnte nicht gelöscht werden.");
    } finally {
      setBusyId(null);
      setMenu(null);
    }
  };

  const openMenu = (noteId, event) => {
    // IMPORTANT: render menu in a fixed portal so it never gets clipped.
    const btn = event.currentTarget;
    const r = btn.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 220, r.right - 180); // keep on screen
    const y = Math.min(window.innerHeight - 180, r.bottom + 8);
    setMenu({ id: noteId, x, y });
  };

  const canAdd = !!text.trim() && !creating;

  // Theme tokens (compact + professional)
  const panel = darkMode
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-white border-slate-200 text-slate-900";
  const soft = darkMode
    ? "bg-gray-900/20 border-gray-700"
    : "bg-slate-50 border-slate-200";
  const subtleText = darkMode ? "text-gray-400" : "text-slate-500";
  const iconBtn = darkMode
    ? "border-gray-700 text-gray-300 hover:bg-gray-700"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  return (
    <aside className={cx("w-full rounded-xl border shadow-sm", panel)}>
      {/* Header: compact, no extra subtitle */}
      <div
        className={cx(
          "px-3 py-2.5 border-b flex items-center justify-between",
          darkMode ? "border-gray-700" : "border-slate-200",
        )}
      >
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight">Notizen</h3>
        </div>

        <button
          onClick={() => setComposerOpen((v) => !v)}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold",
            composerOpen
              ? darkMode
                ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              : "bg-slate-500 text-white hover:bg-slate-700",
          )}
          title="Neue Notiz"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Hinzufügen
        </button>
      </div>

      {/* Composer (hidden until user clicks Hinzufügen) */}
      {composerOpen && (
        <div className="p-3">
          <div className={cx("rounded-lg border overflow-hidden", soft)}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Notiz schreiben…"
              className={cx(
                "w-full resize-none px-3 py-2 text-[13px] outline-none bg-transparent",
                darkMode
                  ? "text-gray-100 placeholder:text-gray-500"
                  : "text-slate-900 placeholder:text-slate-400",
              )}
              rows={2}
              autoFocus
            />

            <div
              className={cx(
                "flex items-center justify-between border-t px-2.5 py-1.5",
                darkMode ? "border-gray-700" : "border-slate-200",
              )}
            >
              <span
                className={cx(
                  "text-[11px]",
                  darkMode ? "text-gray-500" : "text-slate-400",
                )}
              >
                {text.trim().length}/200
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setComposerOpen(false);
                    setText("");
                  }}
                  className={cx(
                    "text-[11px] px-2.5 py-1.5 rounded-md border transition-colors",
                    iconBtn,
                  )}
                >
                  Abbrechen
                </button>

                <button
                  onClick={createNote}
                  disabled={!canAdd}
                  className={cx(
                    "text-[11px] px-2.5 py-1.5 rounded-md font-semibold",
                    !canAdd
                      ? "opacity-50 cursor-not-allowed bg-slate-300 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white",
                  )}
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className={cx("px-3", composerOpen ? "pb-3" : "py-3")}>
        <div
          className={cx(
            "max-h-[42vh] overflow-y-auto custom-scroll",
            "space-y-2",
          )}
        >
          {loading ? (
            <div className={cx("text-[13px] py-6 text-center", subtleText)}>
              Lade Notizen…
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className={cx("text-[13px] py-6 text-center", subtleText)}>
              Noch keine Notizen.
            </div>
          ) : (
            sortedNotes.map((n) => {
              const isEditing = editId === n._id;
              const isBusy = busyId === n._id;

              return (
                <div
                  key={n._id}
                  className={cx(
                    "rounded-lg border",
                    darkMode
                      ? "border-gray-700 bg-gray-900/20"
                      : "border-slate-200 bg-white",
                  )}
                >
                  <div className="p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className={cx(
                              "w-full resize-none rounded-md px-2 py-2 text-[13px] outline-none border",
                              darkMode
                                ? "bg-gray-800 border-gray-700 text-gray-100"
                                : "bg-white border-slate-200 text-slate-900",
                            )}
                            rows={2}
                            autoFocus
                          />
                        ) : (
                          <p
                            className={cx(
                              "text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                            )}
                          >
                            {n.text}
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div
                            className={cx(
                              "text-[11px] flex items-center gap-2",
                              subtleText,
                            )}
                          >
                            {n.pinned ? <span>📌 Angeheftet</span> : <span />}
                          </div>
                        </div>
                      </div>

                      {/* Right: 3-dots or edit buttons */}
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={cancelEdit}
                              disabled={savingEdit}
                              className={cx(
                                "p-1.5 rounded-md border transition-colors",
                                iconBtn,
                                savingEdit
                                  ? "opacity-60 cursor-not-allowed"
                                  : "",
                              )}
                              title="Abbrechen"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                            <button
                              onClick={saveEdit}
                              disabled={savingEdit}
                              className={cx(
                                "p-1.5 rounded-md text-white transition-colors",
                                savingEdit
                                  ? "bg-slate-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700",
                              )}
                              title="Speichern"
                            >
                              <FiSave className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => openMenu(n._id, e)}
                            className={cx(
                              "p-1.5 rounded-md border transition-colors",
                              iconBtn,
                            )}
                            title="Aktionen"
                            aria-label="Aktionen"
                          >
                            <FiMoreHorizontal className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* subtle separator */}
                  <div
                    className={cx(
                      "h-px",
                      darkMode ? "bg-gray-700" : "bg-slate-100",
                    )}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MENU PORTAL (fix clipping & visibility) */}
      {/* MENU PORTAL (click outside to close) */}
      {menu && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop (click to close) */}
          <button
            type="button"
            onClick={() => setMenu(null)}
            className="absolute inset-0 cursor-default"
            aria-label="Close menu"
          />

          {/* Menu box */}
          <div
            data-notes-menu="box"
            className={cx(
              "fixed rounded-lg border shadow-2xl overflow-hidden w-48",
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-slate-200",
            )}
            style={{ left: menu.x, top: menu.y }}
          >
            {(() => {
              const note = sortedNotes.find((x) => x._id === menu.id);
              if (!note) return null;

              const isBusy = busyId === note._id;

              return (
                <div className="py-1">
                  <button
                    onClick={() => togglePin(note)}
                    disabled={isBusy}
                    className={cx(
                      "w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 transition-colors",
                      darkMode
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-slate-800 hover:bg-slate-200",
                      isBusy ? "opacity-60 cursor-not-allowed" : "",
                    )}
                  >
                    <FiStar
                      className={cx(
                        "h-4 w-4",
                        note.pinned
                          ? darkMode
                            ? "text-yellow-300"
                            : "text-yellow-600"
                          : "",
                      )}
                    />
                    {note.pinned ? "Unpin" : "Anheften"}
                  </button>

                  <button
                    onClick={() => startEdit(note)}
                    className={cx(
                      "w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 transition-colors",
                      darkMode
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-slate-800 hover:bg-slate-200",
                    )}
                  >
                    <FiEdit2 className="h-4 w-4" />
                    Bearbeiten
                  </button>

                  <button
                    onClick={() => deleteNote(note._id)}
                    disabled={isBusy}
                    className={cx(
                      "w-full px-3 py-2 text-left text-[12px] flex items-center gap-2 transition-colors",
                      darkMode
                        ? "text-red-300 hover:bg-red-900/20"
                        : "text-red-600 hover:bg-red-100",
                      isBusy ? "opacity-60 cursor-not-allowed" : "",
                    )}
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Löschen
                  </button>
                  <div
                    className={cx(
                      "px-3 py-2 text-[11px] border-t",
                      darkMode
                        ? "border-gray-700 text-gray-400"
                        : "border-slate-200 text-slate-500",
                    )}
                  >
                    Erstellt: {fmtDate(note.createdAt)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </aside>
  );
}
