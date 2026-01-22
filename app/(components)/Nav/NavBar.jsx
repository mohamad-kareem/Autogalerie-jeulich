// components/NavBar.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Settings,
  Home,
  LogOut,
  UserCog,
  Mail,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

import Logo from "../../(assets)/logo1111.png";
import { Menus } from "../../utils/NavData";
import ProfileEditModal from "@/app/(components)/admin/ProfileEditModal";

// Animation variants
const submenuVariants = {
  hidden: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    pointerEvents: "none",
    transition: { duration: 0.15, ease: "easeOut" },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: "auto",
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

// Desktop Menu Component (formerly DesktopMenu.jsx)
const DesktopMenu = ({ menu, scrolled }) => {
  const [open, setOpen] = useState(false);
  const hasSubMenu = Array.isArray(menu?.subMenu) && menu.subMenu.length > 0;

  const widthClass =
    menu.gridCols === 3
      ? "w-[320px]"
      : menu.gridCols === 2
        ? "w-[280px]"
        : "w-[220px]";

  return (
    <motion.li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Top-level item */}
      <Link
        href={menu.href || "#"}
        className={`flex items-center gap-1 px-4 transition-all duration-250 font-medium group ${
          scrolled
            ? "py-3 text-sm text-slate-700 hover:text-slate-900"
            : "py-4 text-base text-white hover:text-slate-200"
        }`}
      >
        <span className="font-semibold tracking-wide relative">
          {menu.name}
          <span
            className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full ${
              scrolled ? "bg-slate-900" : "bg-white"
            }`}
          />
        </span>
        {hasSubMenu && (
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            } ${scrolled ? "text-slate-500" : "text-slate-300"}`}
            aria-hidden="true"
          />
        )}
      </Link>

      {/* Submenu */}
      {hasSubMenu && (
        <AnimatePresence>
          {open && (
            <motion.div
              className={`absolute left-0 top-full z-40 pt-2 ${widthClass}`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={submenuVariants}
            >
              <div className="rounded-lg border border-slate-200 bg-white/98 backdrop-blur-xl shadow-xl ring-1 ring-black/10 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/60"></div>

                <div className="p-2">
                  {menu.subMenu.map((sub, index) => (
                    <motion.div
                      key={sub.href || sub.name || index}
                      variants={itemVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                      <Link
                        href={sub.href || "#"}
                        className="flex items-center gap-3 p-2 rounded-md transition-all duration-200 hover:bg-blue-50 group relative"
                      >
                        {sub.icon && (
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                            {sub.icon}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h6 className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors duration-200 truncate">
                              {sub.name}
                            </h6>
                            <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                          </div>
                          {sub.desc && (
                            <p className="mt-0.5 text-xs text-slate-500 leading-tight line-clamp-2">
                              {sub.desc}
                            </p>
                          )}
                        </div>

                        <div className="absolute left-0 top-1/2 w-1 h-6 bg-blue-500 rounded-r -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {menu.footer && (
                  <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-200/60">
                    <Link
                      href={menu.footer.href || "#"}
                      className="flex items-center justify-between p-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 group"
                    >
                      <span>{menu.footer.text}</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.li>
  );
};

// Mobile Menu Component (formerly MobMenu.jsx)
const MobileMenu = ({ Menus }) => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
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
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  if (!isMounted) return null;

  return (
    <div className="print:hidden lg:hidden">
      {/* Menu Button */}
      <button
        onClick={toggleDrawer}
        className={`fixed top-4 ${
          isLoggedIn ? "right-20" : "right-4"
        } z-[9999] p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300`}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <Menu size={20} className="text-white" />
        )}
      </button>

      {/* Background overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[998] backdrop-blur-sm"
            onClick={toggleDrawer}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 w-4/5 max-w-sm h-[100dvh] bg-gradient-to-b from-slate-900 to-slate-800 text-white z-[999] shadow-2xl overflow-y-auto"
      >
        <div className="h-full pt-24 pb-10 px-6">
          <div className="mb-8 px-2">
            <h3 className="text-lg font-semibold text-slate-300">Navigation</h3>
            <div className="w-12 h-0.5 bg-blue-500 mt-2 rounded-full"></div>
          </div>

          <ul className="space-y-1">
            {Menus.map(({ name, href, subMenu }, i) => {
              const hasSubMenu = Array.isArray(subMenu) && subMenu.length > 0;
              const isActive = activeIndex === i;

              return (
                <li
                  key={name}
                  className="border-b border-slate-700/50 last:border-b-0"
                >
                  {hasSubMenu ? (
                    <div>
                      <button
                        className="flex justify-between items-center w-full p-4 text-base rounded-lg cursor-pointer transition-all duration-300 hover:bg-slate-700/50 hover:pl-6 group"
                        onClick={() => setActiveIndex(isActive ? null : i)}
                      >
                        <span className="font-medium text-slate-100 group-hover:text-white">
                          {name}
                        </span>
                        <ChevronDown
                          className={`ml-2 transition-transform duration-300 ${
                            isActive
                              ? "rotate-180 text-blue-400"
                              : "text-slate-400"
                          } group-hover:text-blue-300`}
                        />
                      </button>

                      <AnimatePresence>
                        {isActive && (
                          <motion.ul
                            initial="exit"
                            animate="enter"
                            exit="exit"
                            variants={subMenuVariants}
                            className="ml-4 border-l-2 border-slate-600/30 overflow-hidden"
                          >
                            {subMenu.map((sub) => (
                              <li
                                key={sub.name}
                                className="border-b border-slate-700/30 last:border-b-0"
                              >
                                <Link
                                  href={sub.href || "#"}
                                  onClick={toggleDrawer}
                                  className="block p-3 pl-6 rounded-lg transition-all duration-300 hover:bg-slate-700/30 hover:pl-8 group"
                                >
                                  <span className="text-slate-300 group-hover:text-white text-sm font-medium">
                                    {sub.name}
                                  </span>
                                  {sub.desc && (
                                    <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300">
                                      {sub.desc}
                                    </p>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={href || "#"}
                      onClick={toggleDrawer}
                      className="block p-4 text-base rounded-lg transition-all duration-300 hover:bg-slate-700/50 hover:pl-6 group"
                    >
                      <span className="font-medium text-slate-100 group-hover:text-white">
                        {name}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

// User Dropdown Component
const UserDropdown = ({
  user,
  avatarUrl,
  open,
  setOpen,
  setShowProfileModal,
  dropdownRef,
}) => {
  return (
    <div
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999] print:hidden"
      ref={dropdownRef}
    >
      <div className="relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((v) => !v)}
          className={`
            flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] shadow-lg 
            backdrop-blur-md transition-all
            ${
              open
                ? "border-blue-500 bg-white/95 ring-2 ring-blue-200"
                : "border-white/70 bg-slate-100/90 hover:border-blue-400 hover:bg-white"
            }
          `}
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
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-[1.5px] border-white bg-green-500 shadow-sm" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white">
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
              className="
                absolute right-0 mt-3 w-[290px] sm:w-[320px]
                rounded-2xl 
                border border-slate-700/70
                bg-slate-900/95 
                shadow-2xl shadow-black/50
                backdrop-blur-xl
                overflow-hidden
              "
            >
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-4 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full border border-white/20 bg-white/10 overflow-hidden flex items-center justify-center">
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

              <div className="py-2 bg-slate-900/90">
                <p className="px-4 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Navigation
                </p>

                <Link
                  href="/AdminDashboard"
                  onClick={() => setOpen(false)}
                  className="
                    flex items-center px-4 py-2.5 text-sm text-slate-200
                    hover:bg-slate-800 hover:text-blue-400
                    transition-colors group
                  "
                >
                  <div
                    className="
                      w-8 h-8 flex items-center justify-center rounded-lg
                      bg-blue-900/40 group-hover:bg-blue-900/60
                    "
                  >
                    <Settings className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="ml-3">Admin Dashboard</span>
                </Link>
              </div>

              <div className="border-t border-slate-800 bg-slate-900/90 px-3 py-3">
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="
                    flex w-full items-center justify-center gap-2
                    px-1 py-1 rounded-md
                    border border-blue-500/40 
                    bg-blue-900/40 text-blue-300
                    hover:bg-blue-900/60 hover:text-blue-200
                    transition-all
                    shadow-sm shadow-black/40
                  "
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
};

// Main NavBar Component
export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(session?.user || null);

  const dropdownRef = useRef(null);

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
  ];

  const isAdminRoute = adminRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase()),
  );

  const hideDropdownRoutes = ["/schlussel"];
  const hideDropdown = hideDropdownRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase()),
  );

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
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

    window.addEventListener("scroll", handleScroll);
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
  if (isAdminRoute) {
    return null;
  }

  const avatarUrl = user?.image || "";

  return (
    <>
      <header
        className={`print:hidden fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "h-16 shadow-2xl bg-gradient-to-b from-slate-950/95 to-slate-900/90 backdrop-blur-xl border-b border-slate-800/70"
            : "h-20 bg-gradient-to-b from-slate-950/95 to-slate-900/85 backdrop-blur-md"
        }`}
      >
        <nav className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + Title */}
          <Link
            href="/"
            className="flex items-center flex-shrink-0 gap-2 sm:gap-3 print:hidden"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <Image
                src={Logo}
                alt="Autogalerie Jülich"
                priority
                className={`object-contain transition-all duration-500 ${
                  scrolled
                    ? "w-10 h-10 sm:w-11 sm:h-11"
                    : "w-12 h-12 sm:w-14 sm:h-14"
                }`}
              />
            </motion.div>
            <span
              className={`hidden sm:inline font-playfair tracking-[0.3em] uppercase transition-all duration-500 ${
                scrolled
                  ? "text-[10px] sm:text-xs text-slate-100"
                  : "text-[11px] sm:text-sm text-slate-50"
              }`}
            >
              Autogalerie Jülich
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 mr-5">
            <ul className="flex items-center space-x-1">
              {Menus.map((menu) => (
                <DesktopMenu key={menu.name} menu={menu} scrolled={scrolled} />
              ))}
            </ul>
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <MobileMenu Menus={Menus} />
          </div>

          {/* Floating user dropdown rules */}
          {showDropdownOnHome && (
            <UserDropdown
              user={user}
              avatarUrl={avatarUrl}
              open={open}
              setOpen={setOpen}
              setShowProfileModal={setShowProfileModal}
              dropdownRef={dropdownRef}
            />
          )}

          {showDropdownOnOtherPagesMobileOnly && (
            <UserDropdown
              user={user}
              avatarUrl={avatarUrl}
              open={open}
              setOpen={setOpen}
              setShowProfileModal={setShowProfileModal}
              dropdownRef={dropdownRef}
            />
          )}
        </nav>
      </header>

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileEditModal
          user={{
            _id: user._id || session?.user?.id || "",
            name: user.name || "",
            email: user.email || "",
            image: user.image || "",
          }}
          onClose={() => setShowProfileModal(false)}
          onSave={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </>
  );
}
