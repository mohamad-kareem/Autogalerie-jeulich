// components/NavBar.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

import Logo from "../../(assets)/logo1111.png";
import { Menus } from "../../utils/NavData";

import SimpleContactFormModal from "@/app/(components)/helpers/SimpleContactFormModal";

/* -----------------------------
  Small helpers
------------------------------ */
const cx = (...c) => c.filter(Boolean).join(" ");
const hasSub = (m) => Array.isArray(m?.subMenu) && m.subMenu.length > 0;

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.985,
    pointerEvents: "none",
    transition: { duration: 0.14, ease: "easeOut" },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: "auto",
    transition: { duration: 0.14, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

/* -----------------------------
  Desktop Menu
------------------------------ */
function DesktopMenu({ menu, scrolled }) {
  const [open, setOpen] = useState(false);
  const has = hasSub(menu);

  const isFahrzeuge = String(menu?.name || "")
    .trim()
    .toLowerCase()
    .includes("fahrzeug");

  const widthClass =
    menu.gridCols === 3
      ? "w-[360px]"
      : menu.gridCols === 2
        ? "w-[320px]"
        : "w-[260px]";

  return (
    <li
      className="relative"
      onMouseEnter={() => has && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={menu.href || "#"}
        className={cx(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
          scrolled
            ? "text-slate-200 hover:text-white hover:bg-white/10"
            : "text-slate-100 hover:text-white hover:bg-white/10",
        )}
      >
        <span className="relative">
          {menu.name}
          <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white/90 transition-all duration-300 group-hover:w-full" />
        </span>

        {has && (
          <ChevronDown
            className={cx(
              "h-4 w-4 transition-transform duration-300",
              open ? "rotate-180" : "",
              "text-slate-300",
            )}
          />
        )}
      </Link>

      {has && (
        <AnimatePresence>
          {open && (
            <motion.div
              className={cx("absolute left-0 top-full z-50 pt-3", widthClass)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={dropdownVariants}
            >
              {/* Fahrzeuge dropdown (compact + bold hover) */}
              {isFahrzeuge ? (
                <div className="inline-block rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="flex flex-col gap-1 p-2">
                    {menu.subMenu.map((sub, index) => (
                      <motion.div
                        key={sub.href || sub.name || index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.14, delay: index * 0.02 }}
                      >
                        <Link
                          href={sub.href || "#"}
                          className={cx(
                            "inline-flex w-fit items-center rounded-lg px-5 py-2 text-sm font-semibold transition",
                            "text-slate-900",
                            "hover:bg-slate-800 hover:text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                          )}
                        >
                          {sub.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="inline-block rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="flex flex-col gap-1 p-2">
                    {menu.subMenu.map((sub, index) => (
                      <motion.div
                        key={sub.href || sub.name || index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.14, delay: index * 0.02 }}
                      >
                        <Link
                          href={sub.href || "#"}
                          className={cx(
                            "inline-flex w-fit items-center rounded-lg px-3 py-2 text-sm font-semibold transition",
                            "text-slate-900",
                            "hover:bg-blue-50 hover:text-blue-700",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                          )}
                        >
                          {sub.name}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}

/* -----------------------------
  Mobile Drawer (Professional like your image)
  - Accordion blocks
  - Clean separators
  - Logo (not car icon)
------------------------------ */
function MobileDrawer({ menus, isOpen, setIsOpen, onOpenContact, isLoggedIn }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = () => {
    setIsOpen(false);
    setActiveIndex(null);
    document.body.style.overflow = "auto";
  };

  const toggle = () => {
    setIsOpen((v) => !v);
    setActiveIndex(null);
    document.body.style.overflow = !isOpen ? "hidden" : "auto";
  };

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const subMenuVariants = {
    enter: {
      height: "auto",
      opacity: 1,
      transition: { duration: 0.22, ease: "easeOut" },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.16, ease: "easeIn" },
    },
  };

  if (!mounted) return null;

  return (
    <div className="print:hidden lg:hidden">
      {/* Trigger */}
      <button
        onClick={toggle}
        className={cx(
          "fixed top-4 z-[9999] p-2.5 rounded-xl",
          "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300",
          isLoggedIn ? "right-20" : "right-4",
        )}
        aria-label="Menü"
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <Menu size={20} className="text-white" />
        )}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 z-[998] backdrop-blur-sm"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed left-0 top-0 w-[86vw] max-w-sm h-[100dvh] z-[999] overflow-y-auto
                   bg-gradient-to-b from-slate-950 to-slate-900 text-white shadow-2xl border-r border-slate-800/70"
      >
        <div className="h-full pt-5 pb-8">
          {/* Header (Logo + brand) */}
          <div className="px-5">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={close}
                className="flex items-center gap-3"
              >
                <div className="relative h-10 w-10">
                  <Image
                    src={Logo}
                    alt="Autogalerie Jülich"
                    priority
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">
                    Autogalerie <span className="text-blue-400">Jülich</span>
                  </div>
                  <div className="text-[11px] text-slate-300">Navigation</div>
                </div>
              </Link>

              <button
                onClick={close}
                className="p-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
                aria-label="Schließen"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="mt-4 h-px bg-white/10" />
          </div>

          {/* Menu list (like your screenshot) */}
          <ul className="mt-3 px-4">
            {menus.map(({ name, href, subMenu }, i) => {
              const hasSubMenu = Array.isArray(subMenu) && subMenu.length > 0;
              const isActive = activeIndex === i;

              return (
                <li key={name} className="py-1.5">
                  {hasSubMenu ? (
                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setActiveIndex(isActive ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3"
                      >
                        <span className="text-[15px] font-semibold text-slate-100">
                          {name}
                        </span>
                        <ChevronDown
                          className={cx(
                            "h-5 w-5 transition-transform duration-300",
                            isActive
                              ? "rotate-180 text-blue-300"
                              : "text-slate-300",
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial="exit"
                            animate="enter"
                            exit="exit"
                            variants={subMenuVariants}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3">
                              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                                {subMenu.map((sub) => (
                                  <Link
                                    key={sub.name}
                                    href={sub.href || "#"}
                                    onClick={close}
                                    className="block px-4 py-3 hover:bg-white/10 transition"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-[14px] font-semibold text-slate-100 truncate">
                                          {sub.name}
                                        </div>
                                        {sub.desc && (
                                          <div className="mt-0.5 text-[12px] text-slate-400">
                                            {sub.desc}
                                          </div>
                                        )}
                                      </div>
                                      <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                      <Link
                        href={href || "#"}
                        onClick={close}
                        className="block px-4 py-3 text-[15px] font-semibold text-slate-100 hover:bg-white/10 transition"
                      >
                        {name}
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* CTA (opens modal, not /kontakt) */}
          <div className="px-5 mt-4">
            <button
              type="button"
              onClick={() => {
                close();
                onOpenContact();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl
                         bg-blue-600 px-4 py-3 text-sm font-semibold text-white
                         hover:bg-blue-700 transition shadow-lg shadow-black/20"
            >
              <Calendar className="h-4 w-4" />
              Termin vereinbaren
            </button>

            <div className="mt-3 text-center text-[11px] text-slate-500">
              Autogalerie Jülich System
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

/* -----------------------------
  User Dropdown (same logic)
------------------------------ */
function UserDropdown({ user, avatarUrl, open, setOpen, dropdownRef }) {
  return (
    <div
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999] print:hidden"
      ref={dropdownRef}
    >
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((v) => !v)}
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] shadow-lg backdrop-blur-md transition-all",
            open
              ? "border-blue-500 bg-white/95 ring-2 ring-blue-200"
              : "border-white/40 bg-white/10 hover:border-blue-400 hover:bg-white/15",
          )}
          aria-label="Benutzermenü öffnen"
        >
          {avatarUrl ? (
            <div className="relative">
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-[1.5px] border-slate-900 bg-green-500 shadow-sm" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-950 text-white">
              <User className="h-4 w-4" />
            </div>
          )}
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-[290px] sm:w-[320px] rounded-2xl border border-slate-800/70 bg-slate-950/92 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 text-white border-b border-slate-800/70 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full border border-white/15 bg-white/10 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="User Avatar"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {user?.name}
                    </h3>
                    <p className="text-xs text-slate-300 truncate mt-1 flex items-center">
                      <Mail className="w-3 h-3 mr-1" /> {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <p className="px-4 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Navigation
                </p>

                <Link
                  href="/AdminDashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-blue-300 transition-colors group"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-900/30 group-hover:bg-blue-900/45">
                    <Settings className="w-4 h-4 text-blue-300" />
                  </div>
                  <span className="ml-3">Admin Dashboard</span>
                </Link>
              </div>

              <div className="border-t border-slate-800/70 px-3 py-3 bg-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl border border-blue-500/35 bg-blue-900/25 text-blue-200 hover:bg-blue-900/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>

                <p className="mt-2 text-[11px] text-center text-slate-500">
                  Autogalerie Jülich System
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -----------------------------
  Main NavBar
------------------------------ */
export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const [open, setOpen] = useState(false); // user dropdown open
  const [scrolled, setScrolled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [user, setUser] = useState(session?.user || null);

  // ✅ Contact modal
  const [contactOpen, setContactOpen] = useState(false);

  // ✅ Mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  const dropdownRef = useRef(null);

  const adminRoutes = useMemo(
    () => [
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
    ],
    [],
  );

  const isAdminRoute = adminRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase()),
  );

  const hideDropdownRoutes = useMemo(() => ["/schlussel"], []);
  const hideDropdown = hideDropdownRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase()),
  );

  useEffect(() => {
    if (session?.user) setUser(session.user);
  }, [session]);

  const showDropdownOnHome = session?.user && isHomePage;
  const showDropdownOnOtherPagesMobileOnly =
    session?.user && !isHomePage && !isAdminRoute && !hideDropdown;

  useEffect(() => {
    setHydrated(true);

    const handleScroll = () => setScrolled(window.scrollY > 20);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
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
    const fetchAdmin = async () => {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`/api/admins?id=${session.user.id}`);
        if (!res.ok) throw new Error("Admin data could not be loaded");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAdmin();
  }, [session?.user?.id]);

  if (!hydrated) return null;
  if (isAdminRoute) return null;

  const avatarUrl = user?.image || "";
  const isLoggedIn = !!session;

  const openContact = () => {
    // close mobile drawer if open, then open modal
    setMobileOpen(false);
    setContactOpen(true);
  };

  return (
    <>
      {/* ✅ Contact Modal */}
      <SimpleContactFormModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
      />

      {/* Top bar */}
      <div className="print:hidden bg-slate-950/75 backdrop-blur-md border-b border-slate-800/70 text-slate-100">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-2 py-2 text-sm md:flex-row md:items-center md:justify-start">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Alte Dürenerstraße 4 Jülich</span>
              </span>
              <span className="hidden md:inline text-white/25">•</span>
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <a
                  className="font-semibold hover:underline"
                  href="tel:+49 (0)2461 9163780"
                >
                  02461 9163780
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={cx(
          "print:hidden sticky top-0 z-50 transition-all duration-300",
          "bg-gradient-to-b from-slate-950/95 to-slate-900/90  backdrop-blur-xl shadow-2xl border-b border-slate-800/70",
        )}
      >
        <nav className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo + Title */}
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src={Logo}
                    alt="Autogalerie Jülich"
                    priority
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-base sm:text-lg font-playfair font-bold tracking-[0.1em] uppercase text-white">
                    Autogalerie <span className="text-blue-400">Jülich</span>
                  </div>
                  <div className="text-xs text-slate-300">Premium Autohaus</div>
                </div>
              </Link>
            </div>

            {/* Desktop nav + CTA */}
            <div className="hidden lg:flex items-center gap-4 mr-12">
              <div className="hidden lg:flex items-center gap-2">
                <ul className="flex items-center">
                  {Menus.map((menu) => (
                    <DesktopMenu
                      key={menu.name}
                      menu={menu}
                      scrolled={scrolled}
                    />
                  ))}
                </ul>
              </div>

              {/* ✅ OPEN MODAL (not /kontakt) */}
              <button
                type="button"
                onClick={openContact}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Termin vereinbaren
              </button>
            </div>

            {/* Mobile drawer (professional) */}
            <div className="lg:hidden">
              <MobileDrawer
                menus={Menus}
                isOpen={mobileOpen}
                setIsOpen={setMobileOpen}
                onOpenContact={openContact}
                isLoggedIn={isLoggedIn}
              />
            </div>

            {/* User dropdown rules */}
            {showDropdownOnHome && (
              <UserDropdown
                user={user}
                avatarUrl={avatarUrl}
                open={open}
                setOpen={setOpen}
                dropdownRef={dropdownRef}
              />
            )}

            {showDropdownOnOtherPagesMobileOnly && (
              <div className="lg:hidden">
                <UserDropdown
                  user={user}
                  avatarUrl={avatarUrl}
                  open={open}
                  setOpen={setOpen}
                  dropdownRef={dropdownRef}
                />
              </div>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
