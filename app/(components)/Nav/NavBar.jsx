"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, ChevronDown, Settings, Home, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

import Logo from "../../(assets)/sm1car.png";
import DesktopMenu from "./DesktopMenu";
import MobMenu from "./MobMenu";
import { Menus } from "../../utils/NavData";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const avatarUrl = session?.user?.image || "";

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const dropdownRef = useRef(null);

  const adminRoutes = [
    "/admin",
    "/AdminDashboard",
    "/forms",
    "/excel",
    "/schlussel",
    "/Auto-scheins",
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
  ];

  const isAdminRoute = adminRoutes.some((route) =>
    pathname?.toLowerCase().startsWith(route.toLowerCase())
  );

  useEffect(() => {
    setHydrated(true);

    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    handleScroll();
    handleResize();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!hydrated) return null;

  // ✅ Floating Admin Menu (super compact & modern)
  if (session?.user) {
    return (
      <div
        className="fixed top-4 right-4 z-[9999] print:hidden"
        ref={dropdownRef}
      >
        <div className="relative">
          {/* Avatar Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 pr-1  rounded-full bg-gradient-to-br from-red-100 to-gray-400  backdrop-blur-md border border-blue-200 hover:bg-blue-800 transition-all"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={28}
                height={28}
                className="rounded-full object-cover w-7 h-7"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-200 to-gray-700 flex items-center justify-center">
                <User className="text-white w-4 h-4" />
              </div>
            )}
            <ChevronDown
              className={`w-4 h-4 text-purple-800 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg py-1 z-50 border border-gray-100"
              >
                <Link
                  href="/AdminDashboard"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-400" />
                  Dashboard
                </Link>
                <Link
                  href="/"
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Home className="w-4 h-4 mr-2 text-gray-400" />
                  Home
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ✅ Full Navbar for normal routes
  return (
    <header
      className={`print:hidden fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "h-14 shadow-md bg-gradient-to-br from-black to-red-950 backdrop-blur-sm"
          : "h-16 bg-gradient-to-br from-black/60 to-red-950"
      }`}
    >
      <nav className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto h-full flex items-center justify-between px-2 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 print:hidden">
          <Image
            src={Logo}
            alt="Logo"
            priority
            className={`object-contain w-10 h-10 sm:w-[85px] sm:h-[110px] transition-transform duration-300 ${
              scrolled ? "scale-70" : "scale-100"
            }`}
          />
          <span
            className={`ml-2 font-semibold whitespace-nowrap transition-all duration-300 text-white text-[10px] sm:text-base ${
              scrolled ? "sm:text-sm" : "sm:text-base"
            }`}
          >
            Autogalerie Jülich
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop Menu */}
          <ul className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            {Menus.map((menu) => (
              <DesktopMenu menu={menu} key={menu.name} scrolled={scrolled} />
            ))}
          </ul>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <MobMenu
              Menus={Menus}
              isAdmin={false}
              avatarUrl={avatarUrl}
              onSignOut={() => signOut({ callbackUrl: "/" })}
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
