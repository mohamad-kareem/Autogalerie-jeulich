"use client";

/**
 * The staff sidebar – industrial steel design (same as the Autocenter portal):
 * engraved group bars, full-width silver buttons, names only when open,
 * icons in the narrow rail, slide-in drawer on phones.
 *
 * Layout state (collapsed, mobile drawer) is owned by app/(Pages)/layout.jsx.
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
  FiClock,
  FiFileText,
  FiGrid,
  FiInbox,
  FiKey,
  FiLayout,
  FiMenu,
  FiMapPin,
  FiPrinter,
  FiSend,
  FiTruck,
  FiSettings,
  FiUsers,
  FiWatch,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaCar, FaCarSide, FaPaintRoller } from "react-icons/fa";


const ADMIN_ONLY = new Set(["/Zeiterfassungsverwaltung", "/excel"]);

/** The menu, grouped the way the work is done. `badge` names a live counter. */
const SECTIONS = [
  {
    items: [
      { href: "/AdminDashboard", icon: FiLayout, label: "Übersicht" },
      { href: "/Rotkennzeichen", icon: FiMapPin, label: "Rote Kennzeichen" },
      { href: "/schlussel", icon: FiKey, label: "Schlüssel" },
    ],
  },
  {
    title: "Verkauf",
    items: [
      { href: "/kaufvertrag/liste", icon: FiFileText, label: "Kaufverträge" },
      { href: "/Kundenkontakte", icon: FiUsers, label: "Kunden" },
      { href: "/Fahrzeugverwaltung", icon: FaCarSide, label: "Fahrzeugverwaltung" },
    ],
  },
  {
    title: "Anfragen & Planung",
    items: [
      { href: "/Posteingang/ankauf/bestaetigung", icon: FiSend, label: "Ankauf bestätigen" },
      { href: "/Posteingang/abholungen", icon: FiTruck, label: "Abholungen", badge: "pickups" },
      // Autogalerie only
      { href: "/marktanalyse", icon: FiBarChart2, label: "Marktanalyse" },
      { href: "/neue-angebote", icon: FiZap, label: "Fahrzeug-Radar" },
    ],
  },
  {
    title: "Werkstatt & Lager",
    items: [
      { href: "/Toni-Werkstatt", icon: FaPaintRoller, label: "Lackieren", hidden: true },
      { href: "/Lagerbestand", icon: FiArchive, label: "Lagerbestand", hidden: true },
      { href: "/Fotostudio", icon: FiCamera, label: "Fotostudio", hidden: true },
      { href: "/preisschild", icon: FiPrinter, label: "Preisschild", hidden: true },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/Posteingang", icon: FiInbox, label: "Anfragen", badge: "unread" },
      { href: "/Posteingang/ankauf", icon: FaCar, label: "Ankauf", badge: "tradeins" },
      // hidden for now – the pages still work under their address
      { href: "/punsh", icon: FiWatch, label: "Stempeluhr", hidden: true },
      { href: "/Zeiterfassungsverwaltung", icon: FiClock, label: "Zeiterfassung", hidden: true },
      { href: "/aufgabenboard", icon: FiGrid, label: "Trello" },
      { href: "/einstellungen", icon: FiSettings, label: "Einstellungen" },
    ],
  },
];

const cx = (...c) => c.filter(Boolean).join(" ");
const countLabel = (count) => (count > 99 ? "99+" : String(count));

export default function Sidebar({
  user,
  unreadCount: unreadCountProp = 0,
  isMinimized = false,
  mobileOpen = false,
  onToggleMinimize = () => {},
  onToggleMobile = () => {},
}) {
  const pathname = usePathname() || "/";
  const { data: session } = useSession();

  const localUser = user || session?.user;
  const [unread, setUnread] = useState(unreadCountProp || 0);
  const [pickups, setPickups] = useState(0);
  const [tradeins, setTradeins] = useState(0);

  useEffect(() => setUnread(unreadCountProp || 0), [unreadCountProp]);

  const userId = user?._id || user?.id || session?.user?.id || session?.user?._id || null;

  /* unread messages: every 15 s while the tab is visible */
  const fetchUnread = useCallback(async () => {
    if (!userId || document.visibilityState !== "visible") return;
    try {
      const response = await fetch(`/api/submissions?userId=${userId}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.success) setUnread(data.unreadCount || 0);
      const open = await fetch("/api/abholungen?count=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      if (open) setPickups(open.open || 0);
      const offers = await fetch("/api/ankauf?count=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
      if (offers) setTradeins(offers.unread || 0);
    } catch {
      /* offline – keep the last count */
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

  const isAdmin = (localUser?.role ?? session?.user?.role) === "admin";

  const sections = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        items: section.items
          .filter((item) => !item.hidden && (isAdmin || !ADMIN_ONLY.has(item.href)))
          .map((item) => ({ ...item, count: item.badge === "unread" ? unread : item.badge === "pickups" ? pickups : item.badge === "tradeins" ? tradeins : 0 })),
      })).filter((section) => section.items.length),
    [isAdmin, unread, pickups, tradeins],
  );

  // the most specific entry wins ("Ankauf bestätigen" vs. "Ankauf")
  const activeHref = useMemo(
    () =>
      /^\/kaufvertrag(\/|$)/.test(pathname)
        ? "/kaufvertrag/liste"
        : SECTIONS.flatMap((s) => s.items)
        .filter((i) => i.href && (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(`${i.href}/`)))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href,
    [pathname],
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

  const panel = (mini, { mobile = false } = {}) => (
    <>
      <div className={cx("sb-brand flex h-9 shrink-0 items-center", mini ? "justify-center" : "justify-between gap-2 pl-5 pr-2.5")}>
        <p className={mini ? "sr-only" : "sb-brand-title min-w-0 truncate"}>Händlerportal</p>
        <button
          type="button"
          onClick={mobile ? onToggleMobile : onToggleMinimize}
          aria-expanded={mobile ? undefined : !mini}
          aria-label={mobile ? "Menü schließen" : mini ? "Menü ausklappen" : "Menü einklappen"}
          className="sb-collapse flex h-7 w-7 shrink-0 items-center justify-center"
        >
          {mobile ? <FiX aria-hidden="true" className="h-4 w-4" /> : <FiChevronsLeft aria-hidden="true" className={cx("h-4 w-4 transition-transform", mini && "rotate-180")} />}
        </button>
      </div>

      <nav aria-label="Hauptnavigation" className="sb-nav no-scrollbar flex-1 overflow-y-auto">
        {sections.map((section, gi) => (
          <div key={section.title || gi}>
            {section.title ? <p className={cx("sb-group", mini && "sb-group-mini")}>{mini ? null : section.title}</p> : null}
            {section.items.map(({ icon: Icon, ...item }) => {
              const active = item.href && item.href === activeHref;
              const className = cx(
                "sb-link relative flex h-10 w-full items-center gap-3 text-left",
                mini ? "justify-center" : "sb-text pl-5 pr-3",
                active && "sb-active",
              );
              const inner = (
                <>
                  {/* icons only in the narrow sidebar – open, the names speak for themselves */}
                  {mini ? <Icon className="sb-icon h-[18px] w-[18px] shrink-0" /> : <span className="flex-1 truncate">{item.label}</span>}
                  {item.count && !mini ? <span className="sb-badge">{countLabel(item.count)}</span> : null}
                  {item.count && mini ? <span className="sb-dot absolute right-3 top-2 h-1.5 w-1.5" /> : null}
                </>
              );
              return (
                <Link key={item.label} href={item.href} title={mini ? item.label : undefined} aria-current={active ? "page" : undefined} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

    </>
  );

  return (
    <>
      {/* desktop */}
      <aside className={cx("sb fixed inset-y-0 left-0 z-40 hidden flex-col transition-[width] duration-200 lg:flex print:hidden", isMinimized ? "w-[68px]" : "w-60")}>
        {panel(isMinimized)}
      </aside>

      {/* phone / tablet: top bar with the menu button */}
      <header className="fixed inset-x-0 top-0 z-30 border-b border-line bg-white lg:hidden print:hidden">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={onToggleMobile}
            aria-label="Menü öffnen"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-body transition hover:bg-canvas"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <p className="text-[13px] font-semibold text-ink">Händlerportal</p>
        </div>
      </header>

      {/* phone: slide-in drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden print:hidden">
          <button type="button" aria-label="Menü schließen" onClick={onToggleMobile} className="absolute inset-0 bg-[#0b0f14]/40 backdrop-blur-sm" />
          <aside aria-label="Menü" className="sb absolute inset-y-0 left-0 flex w-64 max-w-[85vw] flex-col">
            {panel(false, { mobile: true })}
          </aside>
        </div>
      ) : null}

      {/* keeps the page content clear of the fixed sidebar (not on paper) */}
      <div aria-hidden className={cx("hidden shrink-0 transition-[width] duration-200 lg:block print:hidden", isMinimized ? "w-[68px]" : "w-60")} />
    </>
  );
}
