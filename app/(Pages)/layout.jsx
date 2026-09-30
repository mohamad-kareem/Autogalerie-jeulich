"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/(components)/Sidebar";
import { SidebarContext } from "@/app/(components)/SidebarContext";

export default function PagesLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [darkMode, setDarkMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ ONLY auth/public pages (Reg is allowed)
  const HIDE_SIDEBAR_ROUTES = useMemo(
    () => [
      "/", // homepage
      "/login",
      "/forgotpassword",

      // ✅ public pages (no sidebar)
      "/finanzierung",
      "/Datenschutz",
      "/Autoverkaufen",
      "/garantie",
      "/gebrauchtwagen",
      "/impressum",
      "/kontakt",
      "/vergleich",
      "/TrackVisitors76546633",
    ],
    []
  );

  const shouldHideSidebar = useMemo(() => {
    return HIDE_SIDEBAR_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
  }, [pathname, HIDE_SIDEBAR_ROUTES]);

  // ✅ Sidebar only for logged-in users AND not auth pages
  const shouldShowSidebar = !!session?.user && !shouldHideSidebar;

  // The sidebar stays the way it was left (collapsed or open).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar.minimized");
      if (saved !== null) setIsMinimized(saved === "1");
    } catch {
      /* storage blocked: keep the default */
    }
  }, []);

  const toggleMinimized = () => {
    setIsMinimized((previous) => {
      const next = !previous;
      try {
        localStorage.setItem("sidebar.minimized", next ? "1" : "0");
      } catch {
        /* storage blocked */
      }
      return next;
    });
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <SidebarContext.Provider
      value={{
        openSidebar: () => setMobileOpen(true),
        closeSidebar: () => setMobileOpen(false),
        toggleSidebar: () => setMobileOpen((p) => !p),
      }}
    >
      <div className="flex min-h-screen print:block print:min-h-0">
        {shouldShowSidebar && (
          <Sidebar
            user={session?.user}
            unreadCount={0}
            darkMode={darkMode}
            isMinimized={isMinimized}
            mobileOpen={mobileOpen}
            onToggleDarkMode={handleToggleDarkMode}
            onToggleMinimize={toggleMinimized}
            onToggleMobile={() => setMobileOpen((p) => !p)}
          />
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}
