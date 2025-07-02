// components/PageLogger.js
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageLogger() {
  const path = usePathname();

  useEffect(() => {
    fetch("/api/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch((err) => console.error("Logging failed", err));
  }, [path]);

  return null;
}
