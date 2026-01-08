// app/(components)/Sidebar.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiKey,
  FiFileText,
  FiClock,
  FiUsers,
  FiArchive,
  FiInbox,
  FiUserPlus,
  FiPackage,
  FiGrid,
  FiChevronRight,
  FiMenu,
  FiX,
  FiCamera,
  FiMapPin,
  FiSun,
  FiMoon,
  FiHome,
  FiLayout,
} from "react-icons/fi";

const Sidebar = ({
  user,
  unreadCount = 0,
  darkMode = false,
  isMinimized = false,
  mobileOpen = false,
  onToggleMinimize = () => {},
  onToggleMobile = () => {},
  onToggleDarkMode = () => {},
}) => {
  const pathname = usePathname();
  const [tooltipData, setTooltipData] = useState({
    show: false,
    label: "",
    badge: null,
    top: 0,
    left: 0,
  });

  const navItemRefs = useRef({});
  const sidebarRef = useRef(null);

  const adminOnlyRoutes = [
    "/kaufvertrag/archiv",
    "/Reg",
    "/Zeiterfassungsverwaltung",
    "/excel",
  ];

  const firstName = user?.name?.split(" ")[0] || "Admin";
  const isAdmin = user?.role === "admin";

  const navItems = [
    {
      href: "/AdminDashboard",
      icon: <FiLayout />,
      label: "Admin Dashboard",
      badge: null,
      color: "text-blue-400",
    },
    {
      href: "/",
      icon: <FiHome />,
      label: "Startseite",
      badge: null,
      color: "text-slate-300",
    },
    {
      href: "/aufgabenboard",
      icon: <FiGrid />,
      label: "Trello",
      badge: null,
      color: "text-yellow-500",
    },
    {
      href: "/schlussel",
      icon: <FiKey />,
      label: "Schlüssel",
      badge: null,
      color: "text-slate-400",
    },
    {
      href: "/kaufvertrag/liste",
      icon: <FiFileText />,
      label: "Verträge",
      badge: null,
      color: "text-green-400",
    },
    {
      href: "/kaufvertrag/archiv",
      icon: <FiArchive />,
      label: "Archiv",
      badge: null,
      color: "text-purple-400",
    },
    {
      href: "/Auto-scheins",
      icon: <FiCamera />,
      label: "Fahrzeugscheine",
      badge: null,
      color: "text-orange-400",
    },
    {
      href: "/Rotkennzeichen",
      icon: <FiMapPin />,
      label: "Rotkennzeichen",
      badge: null,
      color: "text-red-400",
    },
    {
      href: "/punsh",
      icon: <FiClock />,
      label: "Stempeluhr",
      badge: null,
      color: "text-sky-400",
    },
    {
      href: "/kaufvertrag/auswahl",
      icon: <FiFileText />,
      label: "Neuer Vertrag",
      badge: null,
      color: "text-teal-400",
    },
    {
      href: "/Zeiterfassungsverwaltung",
      icon: <FiClock />,
      label: "Zeiterfassung",
      badge: null,
      color: "text-yellow-400",
    },
    {
      href: "/Kundenkontakte",
      icon: <FiUsers />,
      label: "Kundenkontakte",
      badge: unreadCount > 0 ? unreadCount : null,
      color: "text-green-400",
    },
    {
      href: "/Posteingang",
      icon: <FiInbox />,
      label: "Posteingang",
      badge: unreadCount > 0 ? unreadCount : null,
      color: "text-pink-400",
    },
    {
      href: "/Autoteil",
      icon: <FiPackage />,
      label: "Teile-Reklamation",
      badge: null,
      color: "text-indigo-400",
    },
    {
      href: "/Reg",
      icon: <FiUserPlus />,
      label: "Admin hinzufügen",
      badge: null,
      color: "text-rose-400",
    },
  ];

  const isActiveRoute = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleMouseEnter = (href, label, badge, event) => {
    if (!isMinimized || mobileOpen) return;

    const element = navItemRefs.current[href];
    if (element) {
      const rect = element.getBoundingClientRect();
      const sidebarRect = sidebarRef.current?.getBoundingClientRect();

      // Position tooltip to the right of the sidebar
      const tooltipLeft = sidebarRect ? sidebarRect.right + 8 : rect.right + 8;

      // Center tooltip vertically relative to the nav item
      const tooltipTop = rect.top + rect.height / 2;

      setTooltipData({
        show: true,
        label,
        badge,
        top: tooltipTop,
        left: tooltipLeft,
      });
    }
  };

  const handleMouseLeave = () => {
    if (tooltipData.show) {
      setTooltipData((prev) => ({ ...prev, show: false }));
    }
  };

  // Close tooltip when sidebar is toggled
  useEffect(() => {
    if (!isMinimized) {
      setTooltipData((prev) => ({ ...prev, show: false }));
    }
  }, [isMinimized]);

  const SidebarLink = ({ href, icon, label, badge, color }) => {
    const active = isActiveRoute(href);

    return (
      <div
        ref={(el) => (navItemRefs.current[href] = el)}
        onMouseEnter={(e) => handleMouseEnter(href, label, badge, e)}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <Link href={href} className="block">
          <div
            className={`flex items-center py-2.5 rounded-lg transition-all duration-200 group ${
              isMinimized && !mobileOpen
                ? "justify-center px-3 mx-1"
                : "px-3 mx-2"
            } ${
              active
                ? darkMode
                  ? "bg-gray-700/30 text-white"
                  : "bg-gray-50 text-gray-900"
                : darkMode
                ? "text-gray-300 hover:bg-gray-700/30 hover:text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className={`text-lg ${color}`}>{icon}</div>

            {/* Label - only shown when not minimized on desktop */}
            {(!isMinimized || mobileOpen) && (
              <span className="ml-3 text-sm font-medium truncate flex-1">
                {label}
              </span>
            )}

            {/* Badge */}
            {badge && (!isMinimized || mobileOpen) && (
              <span
                className={`ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[1.25rem] text-center ${
                  active
                    ? darkMode
                      ? "bg-gray-600 text-white"
                      : "bg-gray-200 text-gray-700"
                    : "bg-red-500 text-white"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  };

  const Tooltip = () => {
    if (!tooltipData.show || mobileOpen) return null;

    return (
      <div
        className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
        style={{
          top: `${tooltipData.top}px`,
          left: `${tooltipData.left}px`,
          transform: "translateY(-50%)",
        }}
      >
        <div
          className={`px-3 py-2 rounded-lg shadow-lg ${
            darkMode
              ? "bg-gray-900 text-white border border-gray-700"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm font-medium">{tooltipData.label}</span>
            {tooltipData.badge && (
              <span
                className={`px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[1.25rem] text-center ${
                  darkMode ? "bg-red-600 text-white" : "bg-red-500 text-white"
                }`}
              >
                {tooltipData.badge}
              </span>
            )}
          </div>
          {/* Tooltip arrow */}
          <div
            className={`absolute top-1/2 -left-1.5 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] -translate-y-1/2 ${
              darkMode ? "border-r-gray-900" : "border-r-white"
            }`}
          />
        </div>
      </div>
    );
  };

  const MobileSidebarOverlay = () => (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
      onClick={onToggleMobile}
    />
  );

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-[0.83rem] border-b ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={isMobile ? onToggleMobile : onToggleMinimize}
            className={`flex items-center justify-center rounded-lg h-7 w-7 flex-shrink-0 transition-colors ${
              darkMode
                ? "bg-gray-600 hover:bg-gray-600"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {isMobile ? (
              <FiX className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : isMinimized ? (
              <FiMenu className="h-5 w-5 text-red-600 dark:text-black" />
            ) : (
              <FiChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {(!isMinimized || isMobile) && (
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold truncate ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Autogalerie Jülich
              </p>
              <p
                className={`text-xs truncate ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {firstName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-1">
          {navItems
            .filter((item) => {
              if (adminOnlyRoutes.includes(item.href) && !isAdmin) {
                return false;
              }
              return true;
            })
            .map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                color={item.color}
              />
            ))}
        </div>
      </nav>

      {/* Dark Mode Toggle */}
      <div
        className={`border-t ${
          darkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {!isMinimized || isMobile ? (
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center justify-between w-full p-3 transition-colors ${
              darkMode
                ? "hover:bg-gray-700/30 text-gray-300 hover:text-white"
                : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {darkMode ? (
                <>
                  <FiSun className="text-lg text-yellow-400" />
                  <span className="text-sm font-medium">Hellmodus</span>
                </>
              ) : (
                <>
                  <FiMoon className="text-lg text-gray-500" />
                  <span className="text-sm font-medium">Dunkelmodus</span>
                </>
              )}
            </div>
            <div
              className={`w-10 h-5 rounded-full transition-colors relative ${
                darkMode ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  darkMode
                    ? "transform translate-x-5"
                    : "transform translate-x-0.5"
                }`}
              />
            </div>
          </button>
        ) : (
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center justify-center w-full p-3 transition-colors ${
              darkMode
                ? "hover:bg-gray-700/30 text-gray-300 hover:text-white"
                : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
            }`}
            title={darkMode ? "Hellmodus" : "Dunkelmodus"}
          >
            {darkMode ? (
              <FiSun className="text-lg text-yellow-400" />
            ) : (
              <FiMoon className="text-lg text-gray-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={`hidden md:flex flex-col border-r transition-all duration-300 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } ${isMinimized ? "w-16" : "w-64"}`}
        onMouseLeave={handleMouseLeave}
      >
        <SidebarContent />
      </aside>

      {/* Tooltip for minimized state */}
      <Tooltip />

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <MobileSidebarOverlay />
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 border-r shadow-xl md:hidden transition-transform duration-300 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <SidebarContent isMobile={true} />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
