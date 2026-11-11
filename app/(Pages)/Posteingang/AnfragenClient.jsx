"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Car,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { confirmDialog } from "@/app/(components)/ConfirmHost";

const cx = (...c) => c.filter(Boolean).join(" ");

const TABS = [
  { key: "new", label: "Neu", countKey: "new" },
  { key: "in_progress", label: "In Bearbeitung", countKey: "in_progress" },
  { key: "done", label: "Erledigt", countKey: "done" },
  { key: "archived", label: "Archiv", countKey: "archived" },
  { key: "", label: "Alle", countKey: "all" },
];

const STATUS_STYLE = {
  new: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  in_progress: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  done: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  archived: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const STATUS_LABEL = {
  new: "Neu",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
  archived: "Archiviert",
};

/** the car the message is about – name plus the link to its page on the website */
function vehicleInfo(message) {
  const name = String(message?.vehicle || "").trim();
  if (!name) return null;
  return { name, href: String(message?.vehicleHref || "").trim() };
}

function formatDateTime(value) {
  if (!value) return "–";
  return new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

function relativeTime(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  if (d === 1) return "gestern";
  if (d < 30) return `vor ${d} Tagen`;
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AnfragenClient({ canDelete = false }) {
  const [tab, setTab] = useState("new");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ all: 0, unread: 0, new: 0, in_progress: 0, done: 0, archived: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const noteTimer = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tab) params.set("status", tab);
        if (debouncedQuery) params.set("q", debouncedQuery);
        const res = await fetch(`/api/messages?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Anfragen konnten nicht geladen werden.");
          return;
        }
        setError("");
        setMessages(data.messages || []);
        setCounts(data.counts || {});
        setTotal(data.total || 0);
      } catch {
        setError("Keine Verbindung zum Server.");
      } finally {
        setLoading(false);
      }
    },
    [tab, debouncedQuery],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Light polling so new requests show up without a reload
  useEffect(() => {
    const t = setInterval(() => load({ silent: true }), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const selected = useMemo(() => messages.find((m) => m._id === selectedId) || null, [messages, selectedId]);

  useEffect(() => {
    setNote(selected?.note || "");
    setNoteSaved(false);
  }, [selectedId, selected?.note]);

  async function patch(id, payload, { silentReload = false } = {}) {
    setBusy(true);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Änderung fehlgeschlagen.");
        return null;
      }
      setMessages((list) => list.map((m) => (m._id === id ? data.message : m)));
      load({ silent: true });
      return data.message;
    } catch {
      setError("Keine Verbindung zum Server.");
      return null;
    } finally {
      setBusy(false);
      if (!silentReload) setNoteSaved(false);
    }
  }

  function open(message) {
    setSelectedId(message._id);
    if (!message.read) patch(message._id, { read: true }, { silentReload: true });
  }

  async function saveNote() {
    if (!selected) return;
    const saved = await patch(selected._id, { note });
    if (saved) {
      setNoteSaved(true);
      clearTimeout(noteTimer.current);
      noteTimer.current = setTimeout(() => setNoteSaved(false), 2500);
    }
  }

  async function remove(id) {
    if (!(await confirmDialog("Diese Anfrage endgültig löschen?"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Löschen fehlgeschlagen.");
        return;
      }
      setSelectedId(null);
      load({ silent: true });
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setBusy(false);
    }
  }

  const selectedVehicle = useMemo(() => vehicleInfo(selected), [selected]);

  const mailtoHref = selected
    ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}${selectedVehicle ? ` – ${selectedVehicle.name}` : ""}`)}&body=${encodeURIComponent(
        `Guten Tag ${selected.name},\n\nvielen Dank für Ihre Anfrage.\n\n`,
      )}`
    : "#";

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="ind-plate flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ind-title">Anfragen</h1>
          <p className="text-sm text-muted">
            Alle Nachrichten aus dem Kontaktformular – zusätzlich zur E-Mail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, E-Mail, Text …"
              aria-label="Anfragen durchsuchen"
              className="field w-full pl-8 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="btn btn-secondary px-2.5"
            title="Aktualisieren"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={cx("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ind-seg no-scrollbar mt-4 inline-flex max-w-full overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = counts?.[t.countKey] ?? 0;
          return (
            <button
              key={t.key || "all"}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSelectedId(null);
              }}
              className={cx("ind-seg-btn", active && "ind-seg-on")}
            >
              {t.label}
              <span className="ind-count">{count}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {/* Master / detail */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* List */}
        <div className={cx("card overflow-hidden", selected && "max-lg:hidden")}>
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-muted">
            <span>
              {total} {total === 1 ? "Anfrage" : "Anfragen"}
            </span>
            {counts.unread > 0 ? <span className="font-semibold text-brand-600">{counts.unread} ungelesen</span> : null}
          </div>

          {loading && !messages.length ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Anfragen werden geladen …
            </div>
          ) : !messages.length ? (
            <div className="p-10 text-center">
              <Inbox className="mx-auto h-8 w-8 text-line-strong" />
              <p className="mt-3 text-sm font-medium text-ink">Keine Anfragen</p>
              <p className="mt-1 text-xs text-muted">
                {debouncedQuery ? "Keine Treffer für Ihre Suche." : "Hier erscheinen neue Nachrichten aus dem Kontaktformular."}
              </p>
            </div>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto">
              {messages.map((m) => (
                <li key={m._id}>
                  <button
                    type="button"
                    onClick={() => open(m)}
                    className={cx(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-canvas",
                      selectedId === m._id && "bg-brand-50/60",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!m.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="ungelesen" /> : null}
                      <span className={cx("truncate text-sm", m.read ? "font-medium text-ink" : "font-semibold text-ink")}>
                        {m.name}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted">{relativeTime(m.createdAt)}</span>
                    </span>
                    <span className="truncate text-[13px] text-body">{m.subject}</span>
                    <span className="line-clamp-1 text-xs text-muted">{m.message}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className={cx("chip", STATUS_STYLE[m.status])}>{STATUS_LABEL[m.status]}</span>
                      {vehicleInfo(m) ? (
                        <span className="chip max-w-[180px] bg-canvas text-muted">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="truncate">{vehicleInfo(m).name}</span>
                        </span>
                      ) : null}
                      {!m.emailSent ? (
                        <span className="chip bg-amber-50 text-amber-700" title={m.emailError}>
                          <AlertTriangle className="h-3 w-3" />
                          E-Mail nicht zugestellt
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className={cx("card min-h-[320px]", !selected && "max-lg:hidden")}>
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center">
              <Mail className="h-8 w-8 text-line-strong" />
              <p className="mt-3 text-sm text-muted">Wählen Sie links eine Anfrage aus.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-line p-4">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="mb-2 text-xs font-medium text-muted hover:text-ink lg:hidden"
                  >
                    Zur Liste
                  </button>
                  <h2 className="truncate text-lg font-semibold">{selected.subject}</h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(selected.createdAt)}
                    </span>
                    <span className={cx("chip", STATUS_STYLE[selected.status])}>{STATUS_LABEL[selected.status]}</span>
                    {selected.handledBy ? <span>zuletzt bearbeitet von {selected.handledBy}</span> : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Schließen"
                  className="hidden rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink lg:block"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-2 text-[13px]">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0 text-muted" />
                    <span className="font-medium text-ink">{selected.name}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0 text-muted" />
                    <a href={`mailto:${selected.email}`} className="link break-all">
                      {selected.email}
                    </a>
                  </p>
                  {selected.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted" />
                      <a href={`tel:${selected.phone.replace(/\s+/g, "")}`} className="link">
                        {selected.phone}
                      </a>
                    </p>
                  ) : null}
                  {selected.appointment ? (
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-muted" />
                      <span>
                        Terminwunsch: <span className="font-medium text-ink">{formatDateTime(selected.appointment)}</span>
                      </span>
                    </p>
                  ) : null}
                  {selectedVehicle ? (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Car className="h-4 w-4 shrink-0 text-muted" />
                      <span className="font-medium text-ink">{selectedVehicle.name}</span>
                      {selectedVehicle.href ? (
                        <a
                          href={selectedVehicle.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link inline-flex items-center gap-1 text-xs"
                        >
                          Fahrzeug ansehen
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                  <a href={mailtoHref} className="btn btn-primary btn-sm">
                    <Mail className="h-3.5 w-3.5" />
                    Antworten
                  </a>
                  {selected.phone ? (
                    <a href={`tel:${selected.phone.replace(/\s+/g, "")}`} className="btn btn-secondary btn-sm">
                      <Phone className="h-3.5 w-3.5" />
                      Anrufen
                    </a>
                  ) : null}
                </div>
              </div>

              {!selected.emailSent ? (
                <div className="mx-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Die Benachrichtigungs-E-Mail konnte nicht zugestellt werden
                    {selected.emailError ? ` (${selected.emailError})` : ""}. Die Anfrage ist hier trotzdem gespeichert.
                  </span>
                </div>
              ) : null}

              <div className="flex-1 px-4 py-3">
                <p className="whitespace-pre-wrap rounded-lg bg-canvas p-4 text-sm leading-6 text-body">
                  {selected.message}
                </p>

                <div className="mt-4">
                  <label htmlFor="note" className="label">
                    Interne Notiz
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="z. B. Kunde am 12.03. zurückgerufen"
                    className="field resize-y text-[13px]"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={saveNote} disabled={busy} className="btn btn-secondary btn-sm">
                      Notiz speichern
                    </button>
                    {noteSaved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                        <Check className="h-3.5 w-3.5" /> gespeichert
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-line p-4">
                {selected.status !== "in_progress" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch(selected._id, { status: "in_progress" })}
                    className="btn btn-secondary btn-sm"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    In Bearbeitung
                  </button>
                ) : null}
                {selected.status !== "done" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch(selected._id, { status: "done" })}
                    className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Erledigt
                  </button>
                ) : null}
                {selected.status !== "archived" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch(selected._id, { status: "archived" })}
                    className="btn btn-secondary btn-sm"
                  >
                    Archivieren
                  </button>
                ) : null}
                {selected.status !== "new" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => patch(selected._id, { status: "new", read: false })}
                    className="btn btn-secondary btn-sm"
                  >
                    Als neu markieren
                  </button>
                ) : null}

                {canDelete ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(selected._id)}
                    className="btn btn-sm ml-auto border border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
