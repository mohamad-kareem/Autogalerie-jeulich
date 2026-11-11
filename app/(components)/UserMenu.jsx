"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, UserCog } from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

export function initialsOf(name = "") {
  return String(name)
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Compact account menu: avatar button + dropdown.
 * @param {{ user: {name?:string, email?:string, role?:string}, variant?: "dark"|"light", showWebsiteLink?: boolean }} props
 */
export default function UserMenu({ user, variant = "light", showWebsiteLink = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const dark = variant === "dark";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cx(
          "flex h-9 items-center gap-2 rounded-full pl-1 pr-2 transition",
          dark ? "text-white hover:bg-white/10" : "text-ink hover:bg-canvas",
          open && (dark ? "bg-white/10" : "bg-canvas"),
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-[11px] font-bold text-white">
          {initialsOf(user.name) || "?"}
        </span>
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium sm:block">
          {String(user.name || "").split(" ")[0]}
        </span>
        <ChevronDown className={cx("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-pop-in absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-float"
        >
          <div className="flex items-center gap-2.5 border-b border-line px-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold text-white">
              {initialsOf(user.name) || "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
              <span className="block truncate text-[11px] text-muted">{user.email}</span>
              <span className="mt-0.5 inline-block rounded bg-canvas px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {isAdmin ? "Administrator" : "Mitarbeiter"}
              </span>
            </span>
          </div>

          <nav className="p-1.5 text-[13px]">
            <MenuLink href="/AdminDashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>
              Dashboard
            </MenuLink>
            <MenuLink href="/einstellungen" icon={UserCog} onClick={() => setOpen(false)}>
              Mein Profil
            </MenuLink>
            {showWebsiteLink ? (
              <MenuLink href="/" icon={ExternalLink} onClick={() => setOpen(false)}>
                Zur Website
              </MenuLink>
            ) : null}
          </nav>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ href, icon: Icon, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-body transition hover:bg-canvas hover:text-ink"
    >
      <Icon className="h-4 w-4 text-muted" />
      {children}
    </Link>
  );
}
