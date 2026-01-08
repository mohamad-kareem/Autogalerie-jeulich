// app/(components)/Sidebar.jsx
"use client";

import React, { useState } from "react";
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
      color: "text-violet-500",
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

  const SidebarLink = ({ href, icon, label, badge, color }) => {
    const active = isActiveRoute(href);

    return (
      <div className="relative">
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

            {(!isMinimized || mobileOpen) && (
              <span className="ml-3 text-sm font-medium truncate flex-1">
                {label}
              </span>
            )}

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

  const MobileSidebarOverlay = () => (
    <div
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
      onClick={onToggleMobile}
    />
  );

  const SidebarContent = ({ isMobile = false }) => {
    const filteredNavItems = navItems.filter((item) => {
      if (adminOnlyRoutes.includes(item.href) && !isAdmin) {
        return false;
      }
      return true;
    });

    return (
      <div className="flex h-full flex-col">
        {/* Header - Fixed at top */}
        <div
          className={`flex-shrink-0 px-4 border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          } ${isMinimized ? "py-[1.1rem]" : "py-[0.83rem]"}`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={isMobile ? onToggleMobile : onToggleMinimize}
              className={`flex items-center justify-center rounded-lg h-7 w-7 flex-shrink-0 transition-colors ${
                darkMode
                  ? "bg-gray-600 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {isMobile ? (
                <FiX
                  className={`h-5 w-5 ${
                    darkMode ? "text-gray-100" : "text-black"
                  }`}
                />
              ) : isMinimized ? (
                <FiMenu
                  className={`h-5 w-5 ${
                    darkMode ? "text-gray-100" : "text-black"
                  }`}
                />
              ) : (
                <FiChevronRight
                  className={`h-5 w-5 ${
                    darkMode ? "text-gray-300" : "text-black"
                  }`}
                />
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

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scroll min-h-0 overscroll-contain">
          <nav className="py-4">
            <div className="space-y-1">
              {filteredNavItems.map((item) => (
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
        </div>

        {/* Dark Mode Toggle - Fixed at bottom, no gap */}
        <div
          className={`flex-shrink-0 border-t ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {!isMinimized || isMobile ? (
            <button
              onClick={() => {
                onToggleDarkMode();
                window.location.reload();
              }}
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
              onClick={() => {
                onToggleDarkMode();
                window.location.reload();
              }}
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
  };

  return (
    <>
      {/* Desktop Sidebar - Fixed position */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen border-r transition-all duration-300 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } ${isMinimized ? "w-16" : "w-64"}`}
        style={{
          zIndex: 40,
        }}
      >
        <SidebarContent />
      </aside>

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

      {/* Spacer for desktop content to account for fixed sidebar */}
      <div className={`hidden md:block ${isMinimized ? "w-16" : "w-64"}`} />
    </>
  );
};

export default Sidebar;
