// components/NavBar.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, Settings, Home, LogOut, UserCog, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

import Logo from "../../(assets)/logo1111.png";
import DesktopMenu from "./DesktopMenu";
import MobMenu from "./MobMenu";
import { Menus } from "../../utils/NavData";
import ProfileEditModal from "@/app/(components)/admin/ProfileEditModal";

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

  // 🔹 Routes where the floating dropdown should be completely hidden
  const hideDropdownRoutes = ["/schlussel"];

  const hideDropdown = hideDropdownRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase()),
  );

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);
  const showDropdownOnHome = session?.user && isHomePage; // ✅ mobile + desktop
  const showDropdownOnOtherPagesMobileOnly =
    session?.user && !isHomePage && !isAdminRoute && !hideDropdown; // ✅ only mobile

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

  // Floating user dropdown (used both on admin and normal routes)
  const UserDropdown = (
    <div
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999] print:hidden"
      ref={dropdownRef}
    >
      <div className="relative">
        {/* Avatar button */}
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
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-[1.5px] border-white bg-green-500 shadow-sm" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white">
              <User className="h-4 w-4" />
            </div>
          )}
        </motion.button>

        {/* Dropdown panel */}
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
              {/* HEADER */}
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

              {/* NAV ITEMS */}
              <div className="py-2 bg-slate-900/90">
                <p className="px-4 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Navigation
                </p>

                {/* Admin Dashboard */}
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

              {/* LOGOUT */}
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
    </div>
  );

  return (
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
          <MobMenu Menus={Menus} />
        </div>

        {/* Floating user dropdown rules */}
        {showDropdownOnHome && UserDropdown}

        {showDropdownOnOtherPagesMobileOnly && UserDropdown}
      </nav>
    </header>
  );
}
