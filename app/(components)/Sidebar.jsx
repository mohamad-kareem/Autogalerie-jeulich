"use client";

/**
 * The staff sidebar: grouped navigation with coloured icons, a collapsed
 * icon rail with tooltips, and a slide-in drawer on phones.
 *
 * Layout state (collapsed, mobile drawer, dark mode) is owned by
 * app/(Pages)/layout.jsx and passed in as props.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  FiArchive,
  FiBarChart2,
  FiCamera,
  FiChevronsLeft,
  FiChevronsRight,
  FiClock,
  FiFilePlus,
  FiFileText,
  FiGrid,
  FiHome,
  FiInbox,
  FiKey,
  FiLayout,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiPrinter,
  FiSettings,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiWatch,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaCarSide, FaPaintRoller } from "react-icons/fa";

import ProfileEditModal from "@/app/(components)/admin/ProfileEditModal";

/* ------------------------------------------------------------ navigation */

const ADMIN_ONLY = new Set(["/kaufvertrag/archiv", "/Reg", "/Zeiterfassungsverwaltung", "/excel"]);

/** The menu, grouped the way the work is done. `badge` names a live counter. */
const SECTIONS = [
  {
    title: "Übersicht",
    items: [
      { href: "/AdminDashboard", icon: FiLayout, label: "Admin Dashboard", tone: "blue" },
      { href: "/", icon: FiHome, label: "Startseite", tone: "violet" },
      { href: "/Posteingang", icon: FiInbox, label: "Posteingang", tone: "rose", badge: "unread" },
      { href: "/ai-chats", icon: FiMessageCircle, label: "AI-Chats", tone: "emerald" },
    ],
  },
  {
    title: "Verkauf",
    items: [
      { href: "/kaufvertrag/auswahl", icon: FiFilePlus, label: "Neuer Vertrag", tone: "teal" },
      { href: "/kaufvertrag/liste", icon: FiFileText, label: "Verträge", tone: "green" },
      { href: "/kaufvertrag/archiv", icon: FiArchive, label: "Archiv", tone: "violet" },
      { href: "/Kundenkontakte", icon: FiUsers, label: "Kundenkontakte", tone: "emerald" },
    ],
  },
  {
    title: "Einkauf",
    items: [
      { href: "/marktanalyse", icon: FiBarChart2, label: "Marktanalyse", tone: "cyan" },
      { href: "/neue-angebote", icon: FiZap, label: "Neue Angebote", tone: "amber" },
    ],
  },
  {
    title: "Fahrzeuge",
    items: [
      { href: "/Fahrzeugverwaltung", icon: FaCarSide, label: "Fahrzeugverwaltung", tone: "indigo" },
      { href: "/Fotostudio", icon: FiCamera, label: "Fotostudio", tone: "sky" },
      { href: "/preisschild", icon: FiPrinter, label: "Preisschild", tone: "teal" },
      { href: "/Rotkennzeichen", icon: FiMapPin, label: "Rotkennzeichen", tone: "red" },
      { href: "/schlussel", icon: FiKey, label: "Schlüssel", tone: "slate" },
      { href: "/Toni-Werkstatt", icon: FaPaintRoller, label: "Lackieren", tone: "purple" },
      { href: "/Autoteil", icon: FiPackage, label: "Teile-Reklamation", tone: "orange" },
      { href: "/Lagerbestand", icon: FiArchive, label: "Lagerbestand", tone: "green" },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/aufgabenboard", icon: FiGrid, label: "Trello", tone: "yellow" },
      { href: "/punsh", icon: FiWatch, label: "Stempeluhr", tone: "orange" },
      { href: "/Zeiterfassungsverwaltung", icon: FiClock, label: "Zeiterfassung", tone: "amber" },
      { href: "/Reg", icon: FiUserPlus, label: "Admin hinzufügen", tone: "rose" },
    ],
  },
  {
    title: "Konto",
    items: [{ action: "settings", icon: FiSettings, label: "Einstellungen", tone: "slate" }],
  },
];

/**
 * Each page keeps its own icon colour — to find things at a glance — on a
 * calm, uncoloured row. [light, dark]; written out in full so Tailwind sees them.
 */
const TONES = {
  blue: ["text-blue-600", "text-blue-400"],
  violet: ["text-violet-600", "text-violet-400"],
  rose: ["text-rose-600", "text-rose-400"],
  emerald: ["text-emerald-600", "text-emerald-400"],
  cyan: ["text-cyan-600", "text-cyan-400"],
  amber: ["text-amber-600", "text-amber-400"],
  indigo: ["text-indigo-600", "text-indigo-400"],
  sky: ["text-sky-600", "text-sky-400"],
  teal: ["text-teal-600", "text-teal-400"],
  red: ["text-red-600", "text-red-400"],
  slate: ["text-slate-500", "text-slate-400"],
  purple: ["text-purple-600", "text-purple-400"],
  orange: ["text-orange-600", "text-orange-400"],
  green: ["text-green-600", "text-green-400"],
  yellow: ["text-yellow-600", "text-yellow-400"],
};

const isActiveRoute = (pathname, href) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const countLabel = (count) => (count > 99 ? "99+" : String(count));

/* ------------------------------------------------------------------ theme */

function palette(dark) {
  return dark
    ? {
        shell: "bg-slate-950 border-slate-800",
        divider: "border-slate-800",
        title: "text-slate-100",
        subtle: "text-slate-400",
        section: "text-slate-500",
        item: "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100",
        itemActive: "bg-slate-800 text-white",
        bar: "bg-sky-400",
        control: "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
        tooltip: "bg-slate-100 text-slate-900",
        badgeActive: "bg-slate-700 text-white",
        dotRing: "ring-slate-950",
      }
    : {
        shell: "bg-white border-slate-200",
        divider: "border-slate-200",
        title: "text-slate-900",
        subtle: "text-slate-500",
        section: "text-slate-400",
        item: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        itemActive: "bg-slate-100 text-slate-900",
        bar: "bg-[#0F4C81]",
        control: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        tooltip: "bg-slate-900 text-white",
        badgeActive: "bg-[#0F4C81] text-white",
        dotRing: "ring-white",
      };
}

/* ------------------------------------------------------------- component */

export default function Sidebar({
  user,
  unreadCount: unreadCountProp = 0,
  darkMode = false,
  isMinimized = false,
  mobileOpen = false,
  onToggleMinimize = () => {},
  onToggleMobile = () => {},
  onToggleDarkMode = () => {},
}) {
  const pathname = usePathname() || "/";
  const { data: session } = useSession();

  const [localUser, setLocalUser] = useState(user || session?.user || null);
  const [showSettings, setShowSettings] = useState(false);
  const [unread, setUnread] = useState(unreadCountProp || 0);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => setUnread(unreadCountProp || 0), [unreadCountProp]);

  useEffect(() => {
    if (user) setLocalUser(user);
    else if (session?.user) setLocalUser(session.user);
  }, [user, session]);

  const userId =
    user?._id || user?.id || session?.user?.id || session?.user?._id || localUser?._id || localUser?.id || null;

  /* profile picture and full profile, once */
  useEffect(() => {
    if (!userId || localUser?.image) return;
    let cancelled = false;
    fetch(`/api/admins?id=${userId}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setLocalUser((previous) => ({ ...(previous || {}), ...data }));
      })
      .catch((error) => console.error("Sidebar fetchAdmin error:", error));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* unread messages: every 15 s while the tab is visible, at once when it comes back */
  const fetchUnread = useCallback(async () => {
    if (!userId || document.visibilityState !== "visible") return;
    try {
      const response = await fetch(`/api/submissions?userId=${userId}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.success) setUnread(data.unreadCount || 0);
    } catch (error) {
      console.error("Sidebar unread count error:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUnread();
    const timer = setInterval(fetchUnread, 15_000);
    document.addEventListener("visibilitychange", fetchUnread);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", fetchUnread);
    };
  }, [fetchUnread]);

  const isAdmin = localUser?.role === "admin";
  const displayName = localUser?.name || "Benutzer";
  const roleLabel = isAdmin ? "Administrator" : "Mitarbeiter";

  const sections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        items: section.items
          .filter((item) => isAdmin || !ADMIN_ONLY.has(item.href))
          .map((item) => ({ ...item, count: item.badge === "unread" ? unread : 0 })),
      })).filter((section) => section.items.length),
    [isAdmin, unread],
  );

  /* Esc closes the phone drawer */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onToggleMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onToggleMobile]);

  /* no scrolling the page behind the open drawer */
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => setTooltip(null), [pathname]);

  const c = palette(darkMode);

  const showTip = (label, element, count) => {
    const rect = element.getBoundingClientRect();
    setTooltip({ label, count, top: rect.top + rect.height / 2 });
  };

  /* ----------------------------------------------------------- pieces */

  const renderItem = (item, collapsed) => {
    const active = item.href ? isActiveRoute(pathname, item.href) : false;
    const Icon = item.icon;
    const tone = (TONES[item.tone] || TONES.slate)[darkMode ? 1 : 0];
    const hoverHandlers = collapsed
      ? {
          onMouseEnter: (event) => showTip(item.label, event.currentTarget, item.count),
          onMouseLeave: () => setTooltip(null),
          onFocus: (event) => showTip(item.label, event.currentTarget, item.count),
          onBlur: () => setTooltip(null),
        }
      : {};
    const className = `group relative flex items-center rounded-lg text-left text-[13.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-500/60 ${
      collapsed ? "mx-auto size-10 justify-center" : "h-9 w-full gap-3 px-2.5"
    } ${active ? `${c.itemActive} font-semibold` : c.item}`;
    const content = (
      <>
        {active && !collapsed ? (
          <span aria-hidden className={`absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full ${c.bar}`} />
        ) : null}
        <span className={`relative flex size-5 shrink-0 items-center justify-center ${tone}`}>
          <Icon className="size-[18px]" />
          {collapsed && item.count > 0 ? (
            <span className={`absolute -right-1.5 -top-1 size-2.5 rounded-full bg-red-500 ring-2 ${c.dotRing}`} />
          ) : null}
        </span>
        {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
        {!collapsed && item.count > 0 ? (
          <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-px text-center text-[11px] font-semibold tabular-nums text-white">
            {countLabel(item.count)}
          </span>
        ) : null}
      </>
    );
    return (
      <li key={item.href || item.action}>
        {item.action === "settings" ? (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label={collapsed ? item.label : undefined}
            className={className}
            {...hoverHandlers}
          >
            {content}
          </button>
        ) : (
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={className}
            {...hoverHandlers}
          >
            {content}
          </Link>
        )}
      </li>
    );
  };

  const renderNav = (collapsed) => (
    <nav aria-label="Hauptnavigation" className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
      {sections.map((section, index) => (
        <div key={section.title} className={index ? (collapsed ? `mt-2 border-t pt-2 ${c.divider}` : "mt-5") : "pt-1"}>
          {!collapsed ? (
            <p className={`mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${c.section}`}>{section.title}</p>
          ) : null}
          <ul className="space-y-0.5">{section.items.map((item) => renderItem(item, collapsed))}</ul>
        </div>
      ))}
    </nav>
  );

  const initials =
    displayName !== "Benutzer"
      ? displayName
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : null;

  const renderFooter = (collapsed) => (
    <div className={`shrink-0 border-t p-3 ${c.divider}`}>
      <div
        className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5 px-1"}`}
        title={collapsed ? `${displayName} · ${roleLabel}` : undefined}
      >
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#0F4C81] to-sky-500 text-[12px] font-semibold text-white">
          {localUser?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={localUser.image} alt="" className="size-full object-cover" />
          ) : initials ? (
            initials
          ) : (
            <FiUser className="size-4" />
          )}
        </span>
        {!collapsed ? (
          <span className="min-w-0">
            <span className={`block truncate text-[13px] font-medium ${c.title}`}>{displayName}</span>
            <span className={`block truncate text-[11.5px] ${c.subtle}`}>{roleLabel}</span>
          </span>
        ) : null}
      </div>
    </div>
  );

  const renderBrand = (collapsed, { mobile = false } = {}) => (
    <div className={`flex h-14 shrink-0 items-center border-b ${c.divider} ${collapsed ? "justify-center px-2" : "gap-2 pl-5 pr-3"}`}>
      {collapsed ? (
        <button
          type="button"
          onClick={onToggleMinimize}
          title="Seitenleiste ausklappen"
          aria-label="Seitenleiste ausklappen"
          className={`flex size-9 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-500/60 ${c.control}`}
        >
          <FiChevronsRight className="size-[18px]" />
        </button>
      ) : (
        <>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[15px] font-semibold leading-tight tracking-tight ${c.title}`}>Autogalerie Jülich</span>
            <span className={`block truncate text-[11.5px] ${c.subtle}`}>Händlerportal</span>
          </span>
          <button
            type="button"
            onClick={mobile ? onToggleMobile : onToggleMinimize}
            title={mobile ? "Menü schließen" : "Seitenleiste einklappen"}
            aria-label={mobile ? "Menü schließen" : "Seitenleiste einklappen"}
            className={`flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${c.control}`}
          >
            {mobile ? <FiX className="size-[18px]" /> : <FiChevronsLeft className="size-[18px]" />}
          </button>
        </>
      )}
    </div>
  );

  const collapsed = isMinimized;

  return (
    <>
      {/* desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 ease-out md:flex print:hidden ${c.shell} ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {renderBrand(collapsed)}
        <div className="h-3 shrink-0" />
        {renderNav(collapsed)}
        {renderFooter(collapsed)}
      </aside>

      {/* the icon rail's labels: outside the scrolling list, so they are never cut off */}
      {collapsed && tooltip ? (
        <div
          role="tooltip"
          style={{ top: tooltip.top }}
          className={`pointer-events-none fixed left-[4.5rem] z-50 hidden -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium shadow-lg md:flex print:hidden ${c.tooltip}`}
        >
          {tooltip.label}
          {tooltip.count > 0 ? (
            <span className="rounded-full bg-red-500 px-1.5 text-[10.5px] font-semibold text-white">{countLabel(tooltip.count)}</span>
          ) : null}
        </div>
      ) : null}

      {/* phone: slide-in drawer */}
      <div
        aria-hidden
        onClick={onToggleMobile}
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden print:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Menü"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[18rem] max-w-[85vw] flex-col border-r shadow-2xl transition-transform duration-200 ease-out md:hidden print:hidden ${c.shell} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderBrand(false, { mobile: true })}
        <div className="h-3 shrink-0" />
        {renderNav(false)}
        {renderFooter(false)}
      </aside>

      {showSettings ? (
        <ProfileEditModal
          user={{ ...(localUser || {}), _id: localUser?._id || localUser?.id || session?.user?.id || session?.user?._id || "" }}
          darkMode={darkMode}
          onClose={() => setShowSettings(false)}
          onToggleDarkMode={onToggleDarkMode}
          onSave={(updatedUser) => setLocalUser((previous) => ({ ...(previous || {}), ...(updatedUser || {}) }))}
        />
      ) : null}

      {/* keeps the page content clear of the fixed sidebar (not on paper) */}
      <div aria-hidden className={`hidden shrink-0 transition-[width] duration-200 ease-out md:block print:hidden ${collapsed ? "w-16" : "w-64"}`} />
    </>
  );
}
