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

  // Same look as the rest of the portal (steel panel, toolbar, buttons). darkMode is kept
  // in the props for the pages that pass it, the staff area is always light.
  return (
    <aside className="ind-panel w-full">
      <div className="ind-toolbar flex items-center justify-between gap-2 px-3 py-2">
        <h3 className="text-[13px] font-semibold text-ink">Notizen</h3>
        {composerOpen ? null : (
          <button type="button" onClick={() => setComposerOpen(true)} className="btn btn-secondary btn-sm" title="Neue Notiz">
            <FiPlus /> Hinzufügen
          </button>
        )}
      </div>

      {/* Composer (hidden until user clicks Hinzufügen) */}
      {composerOpen && (
        <div className="border-b border-line p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Notiz schreiben…"
            className="field resize-none"
            rows={3}
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] tabular-nums text-muted">{text.trim().length}/200</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setComposerOpen(false);
                  setText("");
                }}
                className="btn btn-secondary btn-sm"
              >
                Abbrechen
              </button>
              <button type="button" onClick={createNote} disabled={!canAdd} className="btn btn-primary btn-sm">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="scroll-slim max-h-[42vh] overflow-y-auto">
        {loading ? (
          <p className="px-3 py-6 text-center text-[13px] text-muted">Lade Notizen…</p>
        ) : sortedNotes.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-muted">Noch keine Notizen.</p>
        ) : (
          <ul className="divide-y divide-line">
            {sortedNotes.map((n) => {
              const isEditing = editId === n._id;
              return (
                <li key={n._id} className={cx("flex items-start gap-2 px-3 py-2.5", n.pinned && "bg-[#fbf6e6]")}>
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="field resize-none"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-snug text-ink">{n.text}</p>
                    )}
                    {n.pinned && !isEditing ? (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#8a5a00]">
                        <FiStar className="h-3 w-3 fill-current" /> Angeheftet
                      </span>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <span className="ind-actions shrink-0">
                      <button type="button" onClick={cancelEdit} disabled={savingEdit} className="ind-act" title="Abbrechen" aria-label="Abbrechen">
                        <FiX className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={saveEdit} disabled={savingEdit} className="ind-act" title="Speichern" aria-label="Speichern">
                        <FiSave className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => openMenu(n._id, e)}
                      className="ind-icon-btn shrink-0"
                      style={{ width: 26, height: 24 }}
                      title="Aktionen"
                      aria-label="Aktionen"
                    >
                      <FiMoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* MENU PORTAL (click outside to close) */}
      {menu && (
        <div className="fixed inset-0 z-[9999]">
          <button type="button" onClick={() => setMenu(null)} className="absolute inset-0 cursor-default" aria-label="Menü schließen" />
          <div
            data-notes-menu="box"
            className="fixed w-48 overflow-hidden rounded-[4px] border border-[#a9b0b9] bg-white shadow-float"
            style={{ left: menu.x, top: menu.y }}
          >
            {(() => {
              const note = sortedNotes.find((x) => x._id === menu.id);
              if (!note) return null;
              const isBusy = busyId === note._id;
              const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors disabled:opacity-60";
              return (
                <div className="py-1">
                  <button type="button" onClick={() => togglePin(note)} disabled={isBusy} className={cx(item, "text-ink hover:bg-canvas")}>
                    <FiStar className={cx("h-3.5 w-3.5", note.pinned && "fill-current text-[#c99a2e]")} />
                    {note.pinned ? "Lösen" : "Anheften"}
                  </button>
                  <button type="button" onClick={() => startEdit(note)} className={cx(item, "text-ink hover:bg-canvas")}>
                    <FiEdit2 className="h-3.5 w-3.5" />
                    Bearbeiten
                  </button>
                  <button type="button" onClick={() => deleteNote(note._id)} disabled={isBusy} className={cx(item, "text-rose-700 hover:bg-rose-50")}>
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                  <div className="border-t border-line px-3 py-1.5 text-[11px] text-muted">Erstellt: {fmtDate(note.createdAt)}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </aside>
  );
}
