"use client";

/**
 * The one loading state for every staff page: a calm spinner on the page's
 * own background, the same everywhere. It appears only after a short moment,
 * so quick loads show nothing at all instead of a flash.
 *
 *   <PageLoader />                      full page
 *   <PageLoader inline label="…" />     inside a card or table
 */

import { useEffect, useState } from "react";

function prefersDark() {
  try {
    if (document.documentElement.classList.contains("dark")) return true;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export default function PageLoader({ label = "Wird geladen …", inline = false, dark, delay = 150 }) {
  const [isDark, setIsDark] = useState(Boolean(dark));
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    // Pages read their own theme a moment after they start; the site-wide
    // setting is known right away.
    setIsDark(dark === true || prefersDark());
  }, [dark]);

  useEffect(() => {
    if (delay === 0) return undefined;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const ring = isDark ? "border-slate-700 border-t-green-400" : "border-slate-200 border-t-green-400";
  const text = isDark ? "text-slate-400" : "text-slate-500";
  const surface = inline ? "" : isDark ? "bg-slate-950" : "bg-slate-50";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex w-full flex-col items-center justify-center gap-3 ${
        inline ? "py-10" : "min-h-screen"
      } ${surface}`}
    >
      <div
        className={`flex flex-col items-center gap-3 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <span className={`size-7 animate-spin rounded-full border-2 ${ring}`} />
        {label ? <span className={`text-[13px] ${text}`}>{label}</span> : null}
      </div>
    </div>
  );
}
