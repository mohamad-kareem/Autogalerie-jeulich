"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  FiHome,
  FiLayout,
  FiSettings,
  FiUser,
} from "react-icons/fi";

import ProfileEditModal from "@/app/(components)/admin/ProfileEditModal";

export default function Sidebar({
  user, // optional
  unreadCount = 0,
  darkMode = false,
  isMinimized = false,
  mobileOpen = false,
  onToggleMinimize = () => {},
  onToggleMobile = () => {},
  onToggleDarkMode = () => {},
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [localUser, setLocalUser] = useState(user || session?.user || null);
  const [showSettings, setShowSettings] = useState(false);

  // ✅ sync local user when user prop/session changes
  useEffect(() => {
    if (user) setLocalUser(user);
    else if (session?.user) setLocalUser(session.user);
  }, [user, session]);

  // ✅ fetch full admin profile like navbar does (to always get image)
  useEffect(() => {
    const fetchAdmin = async () => {
      const id =
        user?._id ||
        user?.id ||
        session?.user?.id ||
        session?.user?._id ||
        localUser?._id ||
        localUser?.id;

      if (!id) return;

      // already has image? skip fetch
      if (localUser?.image) return;

      try {
        const res = await fetch(`/api/admins?id=${id}`, { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

        setLocalUser((prev) => ({
          ...(prev || {}),
          ...(data || {}),
        }));
      } catch (err) {
        console.error("Sidebar fetchAdmin error:", err);
      }
    };

    fetchAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.user?._id, user?._id, user?.id]);

  const adminOnlyRoutes = useMemo(
    () => [
      "/kaufvertrag/archiv",
      "/Reg",
      "/Zeiterfassungsverwaltung",
      "/excel",
    ],
    []
  );

  const isAdmin = localUser?.role === "admin";
  const firstName = localUser?.name?.split(" ")[0] || "Admin";

  const navItems = useMemo(
    () => [
      {
        href: "/AdminDashboard",
        icon: <FiLayout />,
        label: "Admin Dashboard",
        badge: null,
        color: "text-blue-400",
      },

      // ✅ Startseite added
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
    ],
    [unreadCount]
  );

  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (adminOnlyRoutes.includes(item.href) && !isAdmin) return false;
      return true;
    });
  }, [navItems, adminOnlyRoutes, isAdmin]);

  const isActiveRoute = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  const baseBg = darkMode
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-200";

  const itemHover = darkMode
    ? "text-gray-300 hover:bg-gray-700/30 hover:text-white"
    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900";

  const itemActive = darkMode
    ? "bg-gray-700/30 text-white"
    : "bg-gray-50 text-gray-900";

  function NavItem({ href, icon, label, badge, color }) {
    const active = isActiveRoute(href);

    return (
      <Link href={href} className="block">
        <div
          className={`flex items-center py-2.5 rounded-lg transition-all duration-200 group ${
            isMinimized && !mobileOpen
              ? "justify-center px-3 mx-1"
              : "px-3 mx-2"
          } ${active ? itemActive : itemHover}`}
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
    );
  }

  function ActionItem({ onClick, icon, label, badge, color }) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        <div
          className={`flex items-center py-2.5 rounded-lg transition-all duration-200 group ${
            isMinimized && !mobileOpen
              ? "justify-center px-3 mx-1"
              : "px-3 mx-2"
          } ${itemHover}`}
        >
          <div className={`text-lg ${color}`}>{icon}</div>

          {(!isMinimized || mobileOpen) && (
            <span className="ml-3 text-sm font-medium truncate flex-1">
              {label}
            </span>
          )}

          {badge && (!isMinimized || mobileOpen) && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full min-w-[1.25rem] text-center bg-red-500 text-white">
              {badge}
            </span>
          )}
        </div>
      </button>
    );
  }

  // ✅ reused content for desktop & mobile (clean)
  function SidebarInner({ isMobile = false }) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div
          className={`flex-shrink-0 px-4 border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          } ${isMinimized && !isMobile ? "py-[1.1rem]" : "py-3"}`}
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

        {/* Nav */}
        <div
          className={`overflow-y-auto custom-scroll overscroll-contain ${
            isMobile ? "flex-none" : "flex-1 min-h-0"
          }`}
        >
          <nav className="py-4">
            <div className="space-y-1">
              {filteredNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}

              <ActionItem
                onClick={() => setShowSettings(true)}
                icon={<FiSettings />}
                label="Einstellungen"
                color="text-slate-400"
              />
            </div>
          </nav>
        </div>

        {/* Profile bottom */}
        <div
          className={`border-t p-2 ${
            darkMode ? "border-gray-700" : "border-gray-200"
          } ${isMobile ? "" : "flex-shrink-0"}`}
        >
          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center w-full p-2 rounded-lg transition-colors ${
              darkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {localUser?.image ? (
                  <img
                    src={localUser.image}
                    alt={localUser?.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FiUser className="h-4 w-4 text-white" />
                )}
              </div>

              {(!isMinimized || isMobile) && (
                <div className="text-left min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {localUser?.name || "Benutzer"}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Einstellungen
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen border-r transition-all duration-300 ${baseBg} ${
          isMinimized ? "w-16" : "w-64"
        }`}
        style={{ zIndex: 40 }}
      >
        <SidebarInner />
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onToggleMobile}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 border-r shadow-xl md:hidden transition-transform duration-300 ${baseBg}`}
          >
            <SidebarInner isMobile />
          </aside>
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <ProfileEditModal
          user={{
            ...(localUser || {}),
            _id:
              localUser?._id ||
              localUser?.id ||
              session?.user?.id ||
              session?.user?._id ||
              "",
          }}
          darkMode={darkMode}
          onClose={() => setShowSettings(false)}
          onToggleDarkMode={onToggleDarkMode}
          onSave={(updatedUser) =>
            setLocalUser((prev) => ({
              ...(prev || {}),
              ...(updatedUser || {}),
            }))
          }
        />
      )}

      {/* Spacer */}
      <div className={`hidden md:block ${isMinimized ? "w-16" : "w-64"}`} />
    </>
  );
}
