"use client";

// Our own confirmation panel instead of the browser's confirm()/alert().
// Usage:  if (!(await confirmDialog("Eintrag löschen?"))) return;
//         confirmDialog({ title, message, confirmLabel, danger })
//         alertDialog("Übergabe fehlgeschlagen.")

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle, Info, Trash2 } from "lucide-react";

let push = null;
const queue = [];

function open(options) {
  return new Promise((resolve) => {
    const item = { ...options, resolve };
    if (push) push(item);
    else queue.push(item);
  });
}

const DANGER_RE = /lösch|entfern|verwerf|storn/i;

const VERBS = [
  [/lösch/i, "Löschen"],
  [/entfern/i, "Entfernen"],
  [/verwerf/i, "Verwerfen"],
  [/storn/i, "Stornieren"],
];

export function confirmDialog(input) {
  const o = typeof input === "string" ? { message: input } : input || {};
  const verb = VERBS.find(([re]) => re.test(o.message || ""))?.[1];
  return open({
    kind: "confirm",
    title: o.title || (verb ? `${verb} bestätigen` : "Bitte bestätigen"),
    message: o.message || "",
    confirmLabel: o.confirmLabel || verb || "Bestätigen",
    cancelLabel: o.cancelLabel || "Abbrechen",
    danger: o.danger ?? DANGER_RE.test(o.message || ""),
  });
}

export function alertDialog(input) {
  const o = typeof input === "string" ? { message: input } : input || {};
  return open({ kind: "alert", title: o.title || "Hinweis", message: o.message || "", confirmLabel: "OK" });
}

export default function ConfirmHost() {
  const [item, setItem] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const okRef = useRef(null);

  useEffect(() => {
    push = (next) => setItem((cur) => cur || next);
    const t = setTimeout(() => {
      if (queue.length) setItem(queue.shift());
    }, 0);
    return () => {
      push = null;
      clearTimeout(t);
    };
  }, []);

  const close = useCallback(
    (result) => {
      if (!item) return;
      setLeaving(true);
      const resolve = item.resolve;
      setTimeout(() => {
        setLeaving(false);
        setItem(queue.length ? queue.shift() : null);
        resolve(result);
      }, 160);
    },
    [item],
  );

  useEffect(() => {
    if (!item) return;
    const t = setTimeout(() => okRef.current?.focus(), 30);
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [item, close]);

  if (!item) return null;
  const Icon =
    item.kind === "alert" ? Info : item.danger ? (/lösch|entfern|verwerf/i.test(item.message) ? Trash2 : AlertTriangle) : HelpCircle;

  return (
    <div className="fixed inset-0 z-[200]" role="presentation">
      <button
        type="button"
        aria-label="Abbrechen"
        tabIndex={-1}
        onClick={() => close(false)}
        className={`absolute inset-0 bg-navy-950/35 transition-opacity duration-150 ${leaving ? "opacity-0" : "opacity-100"}`}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className={`confirm-drop pointer-events-auto absolute inset-x-0 top-0 mx-auto w-[calc(100%-1.5rem)] max-w-[440px] ${leaving ? "confirm-drop-out" : ""}`}
      >
        <div className="overflow-hidden rounded-b-[5px] border border-t-0 border-[#a9b0b9] bg-white shadow-[0_18px_44px_-12px_rgba(6,15,29,0.45)]">
          <div className={`h-[3px] ${item.danger ? "bg-rose-600" : "bg-[#3e454e]"}`} />
          <div className="flex gap-3 px-5 pb-4 pt-4">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border ${
                item.danger ? "border-rose-200 bg-rose-50 text-rose-600" : "border-[#b9bfc7] bg-gradient-to-b from-[#f6f7f8] to-[#dde1e5] text-[#3e454e]"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 id="confirm-title" className="text-[14.5px] font-semibold text-ink">
                {item.title}
              </h2>
              {item.message ? <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-body">{item.message}</p> : null}
            </div>
          </div>
          <div className="ind-toolbar flex justify-end gap-2 border-t border-[#b9bfc7] px-5 py-2.5">
            {item.kind === "confirm" ? (
              <button type="button" onClick={() => close(false)} className="ind-btn">
                {item.cancelLabel}
              </button>
            ) : null}
            <button
              ref={okRef}
              type="button"
              onClick={() => close(true)}
              className={`ind-btn ${item.danger ? "ind-btn-danger" : "ind-btn-dark"}`}
            >
              {item.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
