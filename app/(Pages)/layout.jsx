"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/(components)/Sidebar";
import { SidebarContext } from "@/app/(components)/SidebarContext";
import ConfirmHost from "@/app/(components)/ConfirmHost";

export default function PagesLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [isMinimized, setIsMinimized] = useState(false);
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

  // The staff area is always light.
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <SidebarContext.Provider
      value={{
        openSidebar: () => setMobileOpen(true),
        closeSidebar: () => setMobileOpen(false),
        toggleSidebar: () => setMobileOpen((p) => !p),
      }}
    >
      <div
        className={`flex min-h-screen print:block print:min-h-0 ${
          shouldShowSidebar ? "dash-shell bg-canvas" : ""
        }`}
      >
        {shouldShowSidebar && (
          <Sidebar
            user={session?.user}
            unreadCount={0}
            isMinimized={isMinimized}
            mobileOpen={mobileOpen}
            onToggleMinimize={toggleMinimized}
            onToggleMobile={() => setMobileOpen((p) => !p)}
          />
        )}

        {/* below 1024 px the sidebar is a top bar (fixed, 56 px) – keep the page clear of it */}
        <main className={`min-w-0 flex-1 overflow-x-clip ${shouldShowSidebar ? "pt-14 lg:pt-0 print:pt-0" : ""}`}>{children}</main>
      </div>
      {shouldShowSidebar ? <ConfirmHost /> : null}
    </SidebarContext.Provider>
  );
}
