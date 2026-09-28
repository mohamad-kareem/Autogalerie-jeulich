"use client";

/**
 * A thin bar at the very top while the next page opens — the same on every
 * page, immediately on click, so a navigation never feels unanswered.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Light green.
const BRAND = "#4ADE80";

function isInternalNavigation(event) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!anchor) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  // Same page (or just an #anchor on it): nothing to load.
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return url;
}

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickleRef = useRef(null);
  const safetyRef = useRef(null);
  const hideRef = useRef(null);
  const activeRef = useRef(false);

  const stopTimers = () => {
    clearInterval(trickleRef.current);
    clearTimeout(safetyRef.current);
    clearTimeout(hideRef.current);
  };

  const finish = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    stopTimers();
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  const start = () => {
    stopTimers();
    activeRef.current = true;
    setVisible(true);
    setProgress(20);
    // Creeps towards 90 % — it never claims to be done before the page is.
    trickleRef.current = setInterval(() => {
      setProgress((value) => (value < 90 ? value + (90 - value) * 0.15 : value));
    }, 180);
    // A navigation that never lands (cancelled, error) does not leave the bar hanging.
    safetyRef.current = setTimeout(finish, 12_000);
  };

  useEffect(() => {
    const onClick = (event) => {
      if (isInternalNavigation(event)) start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      stopTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The new page is there.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full rounded-r-full"
        style={{
          width: `${progress}%`,
          background: BRAND,
          boxShadow: `0 0 8px ${BRAND}66`,
          transition: progress === 0 ? "none" : "width 200ms ease-out",
        }}
      />
    </div>
  );
}
