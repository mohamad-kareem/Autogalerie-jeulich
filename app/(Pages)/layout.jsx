"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "@/app/(components)/Sidebar";
import { SidebarContext } from "@/app/(components)/SidebarContext";

export default function PagesLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const HIDE_SIDEBAR_ROUTES = useMemo(() => ["/login", "/forgotpassword"], []);

  const hideSidebar =
    !mounted ||
    !session?.user ||
    HIDE_SIDEBAR_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );

  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, [mounted]);

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
      <div className="flex min-h-screen">
        {/* ✅ ALWAYS rendered */}
        <aside className={hideSidebar ? "hidden" : ""}>
          <Sidebar
            user={session?.user}
            unreadCount={0}
            darkMode={darkMode}
            isMinimized={isMinimized}
            mobileOpen={mobileOpen}
            onToggleDarkMode={() =>
              setDarkMode((prev) => {
                const next = !prev;
                localStorage.setItem("theme", next ? "dark" : "light");
                document.documentElement.classList.toggle("dark", next);
                return next;
              })
            }
            onToggleMinimize={() => setIsMinimized((p) => !p)}
            onToggleMobile={() => setMobileOpen((p) => !p)}
          />
        </aside>

        {/* ✅ ALWAYS rendered */}
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}
