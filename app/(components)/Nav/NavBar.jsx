"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  ChevronDown,
  Settings,
  Home,
  LogOut,
  Mail,
  UserCog,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

import Logo from "../../(assets)/sm1car.png";
import DesktopMenu from "./DesktopMenu";
import MobMenu from "./MobMenu";
import { Menus } from "../../utils/NavData";
import ProfileEditModal from "@/app/(components)/admin/ProfileEditModal";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(session?.user || null);

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

  // Sync user with session
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);

  useEffect(() => {
    setHydrated(true);

    const handleScroll = () => setScrolled(window.scrollY > 10);
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

  const avatarUrl = user?.image || "";

  // Enhanced floating dropdown menu
  const FloatingMenu = (
    <div
      className="fixed top-3 right-4 z-[9999] print:hidden"
      ref={dropdownRef}
    >
      <div className="relative">
        {/* Avatar Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 p-0.5 rounded-full bg-gradient-to-br from-red-950 to-gray-950 backdrop-blur-md border border-gray-700 hover:border-red-400/50 shadow-lg hover:shadow-red-500/10 transition-all duration-300"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full object-cover w-8 h-8 ring-2 ring-red-900"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-800 to-gray-900 flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-300 transition-transform duration-300 mr-1 ${
              open ? "rotate-180" : ""
            }`}
          />
        </motion.button>

        {/* Enhanced Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-0.5 w-42 sm:w-50 bg-gradient-to-br from-red-950 to-gray-950 backdrop-blur-xl shadow-xl rounded-xl py-2 z-50 border border-gray-700/50 overflow-hidden"
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
              </div>

              <div className="py-1.5">
                <Link
                  href="/AdminDashboard"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />
                  Dashboard
                </Link>
                <Link
                  href="/"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                  onClick={() => setOpen(false)}
                >
                  <Home className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />
                  Homepage
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                  <UserCog className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-400 transition-colors" />
                  Edit Profile
                </button>
              </div>

              <div className="px-4 py-2 border-t border-gray-800">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center w-full px-2  text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-all duration-200 group"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
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
  if (session?.user && isAdminRoute) {
    return <>{FloatingMenu}</>;
  }
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

          {/* ✅ Floating menu always if logged in */}
          {session?.user && <div className="ml-2">{FloatingMenu}</div>}
        </div>
      </nav>
    </header>
  );
}
