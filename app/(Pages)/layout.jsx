"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/app/(components)/Sidebar";
import { SidebarContext } from "@/app/(components)/SidebarContext";

export default function PagesLayout({ children }) {
  const { data: session } = useSession();

  const [darkMode, setDarkMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const isDark = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        openSidebar: () => setMobileOpen(true),
        closeSidebar: () => setMobileOpen(false),
        toggleSidebar: () => setMobileOpen((p) => !p),
      }}
    >
      <div className="flex min-h-screen">
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

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </SidebarContext.Provider>
  );
}
