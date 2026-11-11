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
import { signOut, useSession } from "next-auth/react";

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
  FiLogOut,
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

import UserMenu from "@/app/(components)/UserMenu";

const ADMIN_ONLY = new Set(["/kaufvertrag/archiv", "/Zeiterfassungsverwaltung", "/excel"]);

/** The menu, grouped the way the work is done. `badge` names a live counter. */
const SECTIONS = [
  {
    items: [
      { href: "/AdminDashboard", icon: FiLayout, label: "Übersicht" },
    ],
  },
  {
    title: "Verkauf",
    items: [
      { href: "/kaufvertrag/liste", icon: FiFileText, label: "Kaufverträge" },
      { href: "/Kundenkontakte", icon: FiUsers, label: "Kunden" },
      { href: "/Fahrzeugverwaltung", icon: FaCarSide, label: "Fahrzeugverwaltung" },
      { href: "/schlussel", icon: FiKey, label: "Schlüssel" },
      { href: "/Rotkennzeichen", icon: FiMapPin, label: "Rote Kennzeichen" },
      { href: "/kaufvertrag/archiv", icon: FiArchive, label: "Archiv" },
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

  const [localUser, setLocalUser] = useState(user || session?.user || null);
  const [unread, setUnread] = useState(unreadCountProp || 0);
  const [pickups, setPickups] = useState(0);
  const [tradeins, setTradeins] = useState(0);

  useEffect(() => setUnread(unreadCountProp || 0), [unreadCountProp]);

  useEffect(() => {
    if (user) setLocalUser(user);
    else if (session?.user) setLocalUser(session.user);
  }, [user, session]);

  const userId = user?._id || user?.id || session?.user?.id || session?.user?._id || localUser?._id || localUser?.id || null;

  /* profile picture and full profile, once */
  useEffect(() => {
    if (!userId || localUser?.image) return undefined;
    let cancelled = false;
    fetch(`/api/admins?id=${userId}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data) setLocalUser((previous) => ({ ...(previous || {}), ...data }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  const isAdmin = localUser?.role === "admin";
  const displayName = localUser?.name || "Benutzer";

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
      // every contract page (new, single, Privat) belongs to "Kaufverträge" – only the Archiv has its own entry
      /^\/kaufvertrag(\/|$)/.test(pathname) && !/^\/kaufvertrag\/archiv/.test(pathname)
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

  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const panel = (mini, { mobile = false } = {}) => (
    <>
      {/* phone: close button on top (no brand plate – like Autocenter) */}
      {mobile ? (
        <div className="flex h-10 shrink-0 items-center justify-end border-b border-[#b9bfc7] px-2">
          <button type="button" onClick={onToggleMobile} aria-label="Menü schließen" className="flex h-8 w-8 items-center justify-center text-[#4f5863] hover:text-[#1f252c]">
            <FiX className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <nav aria-label="Hauptnavigation" className="sb-nav no-scrollbar flex-1 overflow-y-auto">
        {sections.map((section, gi) => (
          <div key={section.title || gi}>
            {section.title ? <p className={cx("sb-group", mini && "sb-group-mini")}>{mini ? null : section.title}</p> : null}
            {section.items.map(({ icon: Icon, ...item }) => {
              const active = item.href && item.href === activeHref;
              // the collapse button sits on the first entry (Übersicht), like in Autocenter
              const hasCollapse = !mobile && gi === 0 && item.href === "/AdminDashboard";
              const className = cx(
                "sb-link relative flex h-10 w-full items-center gap-3 text-left",
                mini ? "justify-center" : "sb-text pl-5 pr-3",
                hasCollapse && (mini ? "pr-8" : "pr-10"),
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
              return hasCollapse ? (
                <div key={item.label} className="relative">
                  <Link href={item.href} title={mini ? item.label : undefined} aria-current={active ? "page" : undefined} className={className}>
                    {inner}
                  </Link>
                  <button
                    type="button"
                    onClick={onToggleMinimize}
                    aria-expanded={!mini}
                    aria-label={mini ? "Menü ausklappen" : "Menü einklappen"}
                    title={mini ? "Menü ausklappen" : "Menü einklappen"}
                    className={cx("sb-collapse absolute right-2 top-1.5 flex h-7 w-6 items-center justify-center", active && "sb-collapse-on-dark")}
                  >
                    <FiChevronsLeft aria-hidden="true" className={cx("h-4 w-4 transition-transform", mini && "rotate-180")} />
                  </button>
                </div>
              ) : (
                <Link key={item.label} href={item.href} title={mini ? item.label : undefined} aria-current={active ? "page" : undefined} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* account plate */}
      <div className={cx("sb-foot flex shrink-0 items-center gap-2.5 py-2.5 pl-4 pr-2", mini && "flex-col gap-1.5 px-2")}>
        <Link href="/einstellungen" title="Einstellungen" className={cx("flex min-w-0 items-center gap-2.5 text-left", !mini && "flex-1")}>
          <span className="sb-avatar flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden text-[11px] font-bold text-white">
            {localUser?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={localUser.image} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          {!mini ? (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-[#1f252c]">{displayName}</span>
              <span className="block text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#66707c]">{isAdmin ? "Administrator" : "Mitarbeiter"}</span>
            </span>
          ) : null}
        </Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} title="Abmelden" aria-label="Abmelden" className="sb-logout flex h-8 w-8 items-center justify-center">
          <FiLogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* desktop */}
      <aside className={cx("sb fixed inset-y-0 left-0 z-40 hidden flex-col transition-[width] duration-200 lg:flex print:hidden", isMinimized ? "w-[68px]" : "w-60")}>
        {panel(isMinimized)}
      </aside>

      {/* phone / tablet: top bar with the menu button and the account (like Autocenter) */}
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
          <p className="text-[13px] font-semibold text-ink">Autogalerie Jülich</p>
          <div className="ml-auto">
            <UserMenu
              user={{ name: displayName, email: localUser?.email || "", role: localUser?.role || "" }}
            />
          </div>
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
