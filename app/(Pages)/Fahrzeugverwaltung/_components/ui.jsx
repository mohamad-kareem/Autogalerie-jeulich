"use client";

/**
 * Fahrzeugverwaltung — the small building blocks every dialog uses, so all of
 * them look and behave the same (light and dark, phone and desktop).
 */

import { useEffect, useState } from "react";
import { FiCheck, FiCopy, FiFileText, FiMoreHorizontal, FiX } from "react-icons/fi";

import { stageBadge, stageLabel } from "./constants";

/** Colour classes for light and dark mode. */
export function theme(dark) {
  return dark
    ? {
        page: "bg-slate-950 text-slate-100",
        card: "border-slate-800 bg-slate-900",
        soft: "border-slate-800 bg-slate-950/40",
        divider: "border-slate-800",
        rowHover: "hover:bg-slate-800/40",
        title: "text-slate-100",
        text: "text-slate-300",
        muted: "text-slate-400",
        faint: "text-slate-500",
        input:
          "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-500/20",
        secondary: "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800",
        primary: "bg-emerald-500 text-white hover:bg-emerald-400",
        ghost: "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
        chip: "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600",
        chipActive: "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
        skeleton: "bg-slate-800",
      }
    : {
        page: "bg-slate-50 text-slate-900",
        card: "border-slate-200 bg-white",
        soft: "border-slate-200 bg-slate-50",
        divider: "border-slate-200",
        rowHover: "hover:bg-slate-50",
        title: "text-slate-900",
        text: "text-slate-700",
        muted: "text-slate-500",
        faint: "text-slate-400",
        input:
          "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-500/15",
        secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        primary: "bg-emerald-600 text-white hover:bg-emerald-700",
        ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        chip: "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
        chipActive: "border-emerald-600 bg-emerald-50 text-emerald-800",
        skeleton: "bg-slate-200",
      };
}

/** A dialog: closes on Esc and on a click outside; the page behind stays put. */
export function Modal({ open, onClose, title, subtitle, dark, size = "md", footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const t = theme(dark);
  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl", "2xl": "max-w-6xl" }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl ${width} ${t.card}`}
      >
        <header className={`flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5 ${t.divider}`}>
          <div className="min-w-0">
            <h2 className={`truncate text-[15px] font-semibold ${t.title}`}>{title}</h2>
            {subtitle ? <p className={`mt-0.5 truncate text-[12px] ${t.muted}`}>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Schließen" className={`-mr-1 rounded-lg p-1.5 ${t.ghost}`}>
            <FiX className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <footer className={`flex flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-5 ${t.divider}`}>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export function Field({ label, dark, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className={`mb-1 block text-[12px] font-medium ${theme(dark).muted}`}>{label}</span>
      {children}
    </label>
  );
}

export function inputClass(dark, extra = "") {
  return `h-10 w-full rounded-lg border px-3 text-[14px] outline-none transition focus:ring-2 ${theme(dark).input} ${extra}`;
}

export function Button({ variant = "secondary", dark, className = "", children, ...rest }) {
  const t = theme(dark);
  const look = variant === "primary" ? `${t.primary} font-semibold` : variant === "danger" ? "bg-red-600 font-semibold text-white hover:bg-red-700" : `border ${t.secondary}`;
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-[13px] transition disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** A small icon-only button. `tone` replaces the default grey (e.g. red for delete). */
export function IconButton({ dark, title, tone, className = "", children, ...rest }) {
  const hover = dark ? "hover:bg-slate-800" : "hover:bg-slate-100";
  const color = tone || (dark ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-900");
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`inline-flex size-8 items-center justify-center rounded-lg transition ${hover} ${color} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Checkbox({ checked, onChange, label, dark }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 text-[13px] ${theme(dark).text}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded accent-emerald-600"
      />
      {label}
    </label>
  );
}

/** A numbered list of short texts (tasks, TÜV defects) with an optional remove button. */
export function NumberedList({ items, dark, onRemove, empty }) {
  const t = theme(dark);
  if (!items.length) return <p className={`text-[13px] ${t.faint}`}>{empty}</p>;
  return (
    <ol className="space-y-1.5">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${t.soft}`}>
          <span className={`mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${dark ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"}`}>
            {index + 1}
          </span>
          <span className={`min-w-0 flex-1 text-[13px] leading-snug ${t.text}`}>{item}</span>
          {onRemove ? (
            <button type="button" onClick={() => onRemove(index)} aria-label="Entfernen" className={`-mr-1 rounded p-0.5 ${t.ghost}`}>
              <FiX className="size-3.5" />
            </button>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** A text input plus "Hinzufügen" that adds to a list (Enter works too). */
export function AddToList({ value, onChange, onAdd, placeholder, dark }) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
        className={inputClass(dark, "flex-1")}
      />
      <Button dark={dark} variant="primary" onClick={onAdd} disabled={!value.trim()}>
        Hinzufügen
      </Button>
    </div>
  );
}

/**
 * "⋯" menu for a row. The list sits in a clipped card, so the menu is placed
 * on the page itself (fixed), right under its button.
 */
export function ActionMenu({ dark, items, label = "Aktionen" }) {
  const [anchor, setAnchor] = useState(null);
  const t = theme(dark);

  useEffect(() => {
    if (!anchor) return undefined;
    const close = () => setAnchor(null);
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [anchor]);

  const open = (event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const height = items.length * 38 + 12;
    const below = rect.bottom + 4 + height < window.innerHeight;
    setAnchor({ right: Math.max(8, window.innerWidth - rect.right), top: below ? rect.bottom + 4 : rect.top - height - 4 });
  };

  return (
    <>
      <button
        type="button"
        onClick={anchor ? () => setAnchor(null) : open}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        className={`inline-flex size-8 items-center justify-center rounded-lg transition ${dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
      >
        <FiMoreHorizontal className="size-[18px]" />
      </button>
      {anchor ? (
        <>
          <div className="fixed inset-0 z-40" onClick={(event) => { event.stopPropagation(); setAnchor(null); }} />
          <div
            role="menu"
            style={{ top: anchor.top, right: anchor.right }}
            className={`fixed z-50 w-56 overflow-hidden rounded-xl border py-1.5 shadow-xl ${t.card}`}
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) =>
              item.divider ? (
                <div key={item.key} className={`my-1.5 border-t ${t.divider}`} />
              ) : (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setAnchor(null);
                    item.onClick();
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 px-3 text-left text-[13px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    item.danger
                      ? dark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
                      : dark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className={`size-4 shrink-0 ${item.danger ? "" : t.faint}`} />
                  {item.label}
                </button>
              ),
            )}
          </div>
        </>
      ) : null}
    </>
  );
}

/** The phase as a small status badge (optionally a button). */
export function StageBadge({ stage, stageMeta, dark, onClick, className = "" }) {
  const { badge } = stageBadge(stage, stageMeta, dark);
  const look = `inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${badge} ${className}`;
  const content = stageLabel(stage, stageMeta);
  if (!onClick) return <span className={look}>{content}</span>;
  return (
    <button
      type="button"
      title="Bearbeiten"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`${look} transition hover:brightness-95`}
    >
      {content}
    </button>
  );
}

/**
 * A square preview of the registration document. The photos are taken
 * sideways, so the preview is turned upright.
 */
export function ScheinThumb({ url, dark, size = "size-10", onClick, label = "Fahrzeugschein ansehen" }) {
  const box = `relative shrink-0 overflow-hidden rounded-lg border ${size} ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-100"}`;
  if (!url) {
    return (
      <span className={`${box} flex items-center justify-center`} title="Kein Fahrzeugschein">
        <FiFileText className={`size-[40%] ${dark ? "text-slate-500" : "text-slate-400"}`} />
      </span>
    );
  }
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={`${box} group transition hover:ring-2 hover:ring-emerald-500/40`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" loading="lazy" className="absolute inset-0 size-full -rotate-90 object-cover transition group-hover:scale-105" />
    </button>
  );
}

/** A labelled group of facts (label left, value right) as used in the details. */
export function InfoSection({ title, dark, action, children }) {
  const t = theme(dark);
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${t.faint}`}>{title}</h3>
        {action}
      </div>
      <dl className={`divide-y rounded-xl border ${dark ? "divide-slate-800 border-slate-800" : "divide-slate-100 border-slate-200"}`}>{children}</dl>
    </section>
  );
}

export function InfoRow({ label, dark, children, mono }) {
  const t = theme(dark);
  return (
    <div className="flex items-start justify-between gap-4 px-3.5 py-2.5">
      <dt className={`shrink-0 text-[13px] ${t.muted}`}>{label}</dt>
      <dd className={`min-w-0 text-right text-[13px] font-medium ${t.title} ${mono ? "font-mono text-[12.5px]" : ""}`}>{children}</dd>
    </div>
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers / no permission: copy through a hidden text field.
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  }
}

/** The FIN in a small mono chip; one click copies it. */
export function FinCopy({ fin, dark, className = "" }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!fin) return <span className={`text-[12px] ${theme(dark).faint}`}>Keine FIN</span>;

  const copy = async (event) => {
    event.stopPropagation();
    if (await copyText(fin)) setCopied(true);
  };

  const look = copied
    ? dark
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-emerald-300 bg-emerald-50 text-emerald-800"
    : dark
      ? "border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500"
      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white";

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Kopiert" : "FIN kopieren"}
      aria-label={copied ? "FIN kopiert" : `FIN ${fin} kopieren`}
      className={`group inline-flex max-w-full items-center gap-2 rounded-md border px-2 py-1 font-mono text-[12px] tracking-wide transition ${look} ${className}`}
    >
      <span className="truncate">{fin}</span>
      {copied ? (
        <FiCheck className="size-3.5 shrink-0" strokeWidth={2.5} />
      ) : (
        <FiCopy className={`size-3.5 shrink-0 transition ${dark ? "text-slate-500 group-hover:text-slate-200" : "text-slate-400 group-hover:text-slate-700"}`} />
      )}
    </button>
  );
}
