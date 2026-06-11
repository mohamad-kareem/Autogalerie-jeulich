// components/NavBar.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Settings,
  LogOut,
  Mail,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

import { Menus } from "../../utils/NavData";
import SimpleContactFormModal from "@/app/(components)/helpers/SimpleContactFormModal";

const GREEN = "#146c2e";

const cx = (...classes) => classes.filter(Boolean).join(" ");

const WRAPPER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8";

const adminRoutes = [
  "/admin",
  "/AdminDashboard",
  "/forms",
  "/excel",
  "/schlussel",
  "/Fahrzeugverwaltung",
  "/PersonalData",
  "/Plate",
  "/Reg",
  "/punsh",
  "/Posteingang",
  "/Zeiterfassungsverwaltung",
  "/kaufvertrag",
  "/TrackVisitors76546633",
  "/Vehicles",
  "/medicine",
  "/Autoteil",
  "/aufgabenboard",
  "/translator",
  "/Rotkennzeichen",
  "/Kundenkontakte",
  "/lackieren",
  "/Preisschild",
];

const hasSubMenu = (menu) =>
  Array.isArray(menu?.subMenu) && menu.subMenu.length > 0;

function DesktopMenu({ menu }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hasSub = hasSubMenu(menu);

  const active =
    menu.href &&
    (pathname === menu.href ||
      pathname?.toLowerCase().startsWith(String(menu.href).toLowerCase()));

  return (
    <li
      className="relative"
      onMouseEnter={() => hasSub && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={menu.href || "#"}
        className={cx(
          "group inline-flex h-10 items-center gap-1.5 rounded-xl px-4",
          "text-[14px] font-semibold tracking-[-0.01em]",
          "transition-all duration-200",
          active
            ? "bg-[#e6f1e9] text-[#146c2e]"
            : "text-[#121812] hover:bg-[#f1f6f2] hover:text-[#146c2e]",
        )}
      >
        <span>{menu.name}</span>

        {hasSub && (
          <ChevronDown
            className={cx(
              "h-3.5 w-3.5 transition-transform duration-200",
              open ? "rotate-180 text-[#146c2e]" : "text-[#6b746b]",
            )}
          />
        )}
      </Link>

      {hasSub && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute left-0 top-full z-50 pt-3"
            >
              <div className="w-[300px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.14)]">
                <div className="border-b border-black/5 bg-[#f7f9f5] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#146c2e]">
                    {menu.name}
                  </p>
                </div>

                <div className="p-2">
                  {menu.subMenu.map((sub) => {
                    const subActive =
                      sub.href &&
                      (pathname === sub.href ||
                        pathname
                          ?.toLowerCase()
                          .startsWith(String(sub.href).toLowerCase()));

                    return (
                      <Link
                        key={sub.href || sub.name}
                        href={sub.href || "#"}
                        className={cx(
                          "group flex items-center justify-between gap-3 rounded-xl px-3 py-3",
                          "transition-all duration-200",
                          subActive
                            ? "bg-[#e6f1e9] text-[#146c2e]"
                            : "text-[#121812] hover:bg-[#f1f6f2] hover:text-[#146c2e]",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold">
                            {sub.name}
                          </p>

                          {sub.desc && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-[#6b746b]">
                              {sub.desc}
                            </p>
                          )}
                        </div>

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef5ef] text-[#146c2e] transition group-hover:bg-[#146c2e] group-hover:text-white">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}

function MobileDrawer({ menus, isOpen, setIsOpen, onOpenContact }) {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(null);

  const close = () => {
    setIsOpen(false);
    setActiveIndex(null);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <div className="print:hidden lg:hidden">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-[#f1f6f2]"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5 text-[#121812]" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[998] bg-black/35 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed left-0 top-0 z-[999] h-[100dvh] w-[88vw] max-w-sm overflow-y-auto border-r border-black/10 bg-white shadow-2xl"
          >
            <div className="px-5 pb-8 pt-5">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  onClick={close}
                  className="relative h-10 w-[205px]"
                >
                  <Image
                    src="/logo11.png"
                    alt="Autogalerie Jülich"
                    fill
                    priority
                    sizes="235px"
                    className="object-cover object-left"
                  />
                </Link>

                <button
                  onClick={close}
                  className="rounded-xl border border-black/10 bg-[#f7f9f5] p-2 transition hover:bg-[#e6f1e9]"
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5 text-[#121812]" />
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-black/10 bg-[#f7f9f5] p-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#146c2e]">
                  Autogalerie Jülich
                </p>
                <p className="mt-1 text-sm font-medium text-[#5f695f]">
                  Geprüfte Fahrzeuge und faire Beratung.
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-white">
                {menus.map(({ name, href, subMenu }, index) => {
                  const hasSub = Array.isArray(subMenu) && subMenu.length > 0;
                  const openSub = activeIndex === index;

                  const current =
                    href &&
                    (pathname === href ||
                      pathname
                        ?.toLowerCase()
                        .startsWith(String(href).toLowerCase()));

                  return (
                    <div
                      key={name}
                      className="border-b border-black/5 last:border-b-0"
                    >
                      {hasSub ? (
                        <>
                          <button
                            onClick={() =>
                              setActiveIndex(openSub ? null : index)
                            }
                            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-[#f7f9f5]"
                          >
                            <span className="text-sm font-semibold text-[#121812]">
                              {name}
                            </span>

                            <ChevronDown
                              className={cx(
                                "h-5 w-5 transition-transform",
                                openSub
                                  ? "rotate-180 text-[#146c2e]"
                                  : "text-[#6b746b]",
                              )}
                            />
                          </button>

                          <AnimatePresence>
                            {openSub && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pb-2">
                                  {subMenu.map((sub) => (
                                    <Link
                                      key={sub.href || sub.name}
                                      href={sub.href || "#"}
                                      onClick={close}
                                      className="mx-3 my-1 flex items-center justify-between gap-3 rounded-xl bg-[#f7f9f5] px-3 py-3 text-sm font-semibold text-[#121812] transition hover:bg-[#e6f1e9] hover:text-[#146c2e]"
                                    >
                                      <span>{sub.name}</span>
                                      <ArrowRight className="h-4 w-4 text-[#146c2e]" />
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <Link
                          href={href || "#"}
                          onClick={close}
                          className="flex items-center justify-between px-4 py-3.5 transition hover:bg-[#f7f9f5]"
                        >
                          <span
                            className={cx(
                              "text-sm font-semibold",
                              current ? "text-[#146c2e]" : "text-[#121812]",
                            )}
                          >
                            {name}
                          </span>

                          <ArrowRight className="h-4 w-4 text-[#146c2e]" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  close();
                  onOpenContact();
                }}
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#146c2e] px-4 text-[13px] font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724]"
              >
                <Calendar className="h-4 w-4" />
                Termin vereinbaren
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserDropdown({ user, avatarUrl, open, setOpen, dropdownRef }) {
  return (
    <div ref={dropdownRef} className="relative print:hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cx(
          "flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition",
          open ? "border-[#146c2e]" : "border-black/10 hover:border-[#146c2e]",
        )}
        aria-label="Benutzermenü öffnen"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="User Avatar"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#121812] text-white">
            <User className="h-4 w-4" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-[300px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl shadow-black/10"
          >
            <div className="bg-[#f7f9f5] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="User Avatar"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-[#6b746b]" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#121812]">
                    {user?.name || "Admin"}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-[#6b746b]">
                    <Mail className="h-3 w-3" />
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <Link
                href="/AdminDashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#121812] transition hover:bg-[#e6f1e9] hover:text-[#146c2e]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1e9]">
                  <Settings className="h-4 w-4 text-[#146c2e]" />
                </span>
                Admin Dashboard
              </Link>
            </div>

            <div className="border-t border-black/5 bg-[#f7f9f5] p-3">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#146c2e]/25 bg-[#e6f1e9] px-3 py-2 text-sm font-semibold text-[#146c2e] transition hover:bg-[#dceee0]"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [hydrated, setHydrated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(session?.user || null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const dropdownRef = useRef(null);

  const isAdminRoute = adminRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase()),
  );

  useEffect(() => {
    setHydrated(true);

    const handleScroll = () => setScrolled(window.scrollY > 16);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (session?.user) setUser(session.user);
  }, [session]);

  useEffect(() => {
    async function fetchAdmin() {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/admins?id=${session.user.id}`);
        if (!res.ok) return;

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error("Admin data could not be loaded:", error);
      }
    }

    fetchAdmin();
  }, [session?.user?.id]);

  if (!hydrated) return null;
  if (isAdminRoute) return null;

  const avatarUrl = user?.image || "";
  const showUserMenu = Boolean(session?.user);

  const openContact = () => {
    setMobileOpen(false);
    setContactOpen(true);
  };

  return (
    <>
      <SimpleContactFormModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      <div className="hidden border-b border-black/5 bg-white text-[#121812] print:hidden md:block">
        <div className={WRAPPER}>
          <div className="flex h-8 items-center justify-between text-[12px] font-medium">
            <div className="flex items-center gap-5 -ml-1">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#146c2e]" />
                Alte Dürenerstraße 4, Jülich
              </span>

              <a
                href="tel:+492461916006613"
                className="inline-flex items-center gap-1.5 transition hover:text-[#146c2e]"
              >
                <Phone className="h-3.5 w-3.5 text-[#146c2e]" />
                02461 916006613
              </a>
            </div>
          </div>
        </div>
      </div>

      <header
        className={cx(
          "sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl transition-all duration-300 print:hidden",
          scrolled && "shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
        )}
      >
        <nav className={WRAPPER}>
          <div className="flex h-[70px] items-center gap-8">
            <Link
              href="/"
              className="relative -ml-3 h-10 w-[205px] shrink-0 lg:-ml-6"
            >
              <Image
                src="/logo11.png"
                alt="Autogalerie Jülich"
                fill
                priority
                sizes="235px"
                className="object-cover object-left"
              />
            </Link>

            <div className="hidden flex-1 items-center justify-end gap-5 lg:flex">
              <ul className="flex items-center gap-3">
                {Menus.map((menu) => (
                  <DesktopMenu key={menu.name} menu={menu} />
                ))}
              </ul>

              <button
                type="button"
                onClick={openContact}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#146c2e] px-4 text-[13px] font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724]"
              >
                <Calendar className="h-3.5 w-3.5" />
                Termin
              </button>

              {showUserMenu && (
                <UserDropdown
                  user={user}
                  avatarUrl={avatarUrl}
                  open={userMenuOpen}
                  setOpen={setUserMenuOpen}
                  dropdownRef={dropdownRef}
                />
              )}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:hidden">
              {showUserMenu && (
                <UserDropdown
                  user={user}
                  avatarUrl={avatarUrl}
                  open={userMenuOpen}
                  setOpen={setUserMenuOpen}
                  dropdownRef={dropdownRef}
                />
              )}

              <MobileDrawer
                menus={Menus}
                isOpen={mobileOpen}
                setIsOpen={setMobileOpen}
                onOpenContact={openContact}
              />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
