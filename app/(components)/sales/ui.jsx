"use client";

// Small building blocks for the selling pages (contracts, customers, vehicle files).

import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

export const cx = (...c) => c.filter(Boolean).join(" ");

/** fetch JSON helper: returns { ok, status, data } and never throws */
export async function api(url, { method = "GET", body, form } = {}) {
  try {
    const res = await fetch(url, {
      method,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: form || (body ? JSON.stringify(body) : undefined),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Keine Verbindung zum Server." } };
  }
}

export function Pill({ tone = "slate", children, className }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    amber: "bg-amber-50 text-amber-800 ring-amber-600/15",
    red: "bg-rose-50 text-rose-700 ring-rose-600/15",
    blue: "bg-brand-50 text-brand-700 ring-brand-600/15",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ring-black/[0.08]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Label({ children, htmlFor, required }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
      {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
    </label>
  );
}

export function Field({ label, id, required, className, hint, children }) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/** Two or three exclusive options as a compact segmented control */
export function Segmented({ value, onChange, options, className, size = "md" }) {
  return (
    <div className={cx("ind-seg inline-flex", className)}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cx("ind-seg-btn", size === "sm" && "ind-seg-sm", value === o.key && "ind-seg-on")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = "max-w-md", bodyClassName = "max-h-[70vh] overflow-y-auto px-4 py-4" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-navy-950/40" />
      <div className={cx("animate-pop-in relative w-full overflow-hidden rounded-t-[6px] border border-[#a9b0b9] bg-white shadow-float sm:rounded-[4px]", width)}>
        <div className="ind-toolbar flex items-center justify-between px-4 py-2.5">
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-canvas hover:text-ink" aria-label="Schließen">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
        {footer ? <div className="ind-toolbar flex justify-end gap-2 border-t border-[#b9bfc7] px-4 py-2.5">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Right-hand drawer (full screen on phones) */
export function Drawer({ open, onClose, title, subtitle, actions, children, width = "sm:max-w-xl" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75]">
      <button type="button" aria-label="Schließen" onClick={onClose} className="absolute inset-0 bg-navy-950/30" />
      <aside className={cx("absolute inset-y-0 right-0 flex w-full flex-col border-l border-[#a9b0b9] bg-white shadow-float", width)}>
        <div className="ind-toolbar flex items-start gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold text-ink">{title}</h2>
            {subtitle ? <div className="mt-0.5 text-[12px] text-muted">{subtitle}</div> : null}
          </div>
          {actions}
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-canvas hover:text-ink" aria-label="Schließen">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-slim flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}

export function Section({ title, action, children, className }) {
  return (
    <section className={cx("border-b border-line px-4 py-4 last:border-b-0", className)}>
      {title || action ? (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5d6671]">{title}</h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Tabs({ tabs, value, onChange, counts = {} }) {
  return (
    <div className="ind-seg no-scrollbar mb-2.5 inline-flex max-w-full overflow-x-auto">
      {tabs.map((t) => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)} className={cx("ind-seg-btn", value === t.key && "ind-seg-on")}>
          {t.label}
          {counts[t.key] != null ? <span className="ind-count tabular-nums">{counts[t.key]}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function ErrorNote({ children, onClose }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-[4px] border border-rose-300 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
      <span className="flex-1">{children}</span>
      {onClose ? (
        <button type="button" onClick={onClose} className="text-rose-500 hover:text-rose-800" aria-label="Schließen">
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Checkbox row used in task lists */
export function TaskCheck({ task, onToggle, busy, onDelete }) {
  const done = task.status === "done";
  return (
    <div className={cx("group/task flex items-start gap-1 rounded-md transition hover:bg-canvas", busy && "opacity-60")}>
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 px-1.5 py-1.5">
        <input
          type="checkbox"
          checked={done}
          disabled={busy}
          onChange={() => onToggle(task)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line-strong accent-emerald-600"
        />
        <span className={cx("text-[13px] leading-snug", done ? "text-muted line-through" : "text-ink")}>
          {task.title.includes(": ") ? task.title.split(": ").slice(1).join(": ") : task.title}
        </span>
      </label>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(task)}
          disabled={busy}
          title="Aufgabe löschen"
          aria-label="Aufgabe löschen"
          className="mr-1 mt-1 shrink-0 rounded p-1 text-muted opacity-60 transition hover:bg-rose-50 hover:text-rose-600 hover:opacity-100 group-hover/task:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** Tick a task – same document everywhere (Wochenplan, contract panel, vehicle files, dashboard) */
export async function toggleTask(task) {
  const status = task.status === "done" ? "open" : "done";
  const res = await api(`/api/tasks/${task._id}`, { method: "PATCH", body: { status } });
  return res.ok ? { ...task, status } : null;
}
