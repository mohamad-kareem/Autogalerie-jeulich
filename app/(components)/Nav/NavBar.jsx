"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, ChevronDown } from "lucide-react";
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

  const adminRoutes = [
    "/admin",

    "/forms",
    "/excel",
    "/schlussel",
    "/Auto-scheins",
    "/AdminDashboard",
    "/PersonalData",
    "/Plate",
    "/Reg",
    "/punsh",
    "/Posteingang",
    "/Zeiterfassungsverwaltung",
    "/kaufvertrag",
    "/kaufvertrag/liste",
    "/kaufvertrag/auswahl",
    "/kaufvertrag/form",
    "/kaufvertrag/[id]",
    "/TrackVisitors76546633",
  ];

  const isAdminRoute = adminRoutes.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    setHydrated(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);

    handleScroll();
    handleResize();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!hydrated) return null;

  // ✅ Floating Menu (on admin routes for any logged-in user)
  if (isAdminRoute && session?.user) {
    return (
      <div className="absolute top-4 right-4 z-50 print:hidden">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full object-cover w-8 h-8"
              />
            ) : (
              <User className="text-gray-600 w-6 h-6" />
            )}
            <ChevronDown
              className={`ml-1 w-4 h-4 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-50 border border-gray-100"
                onMouseLeave={() => !isMobile && setOpen(false)}
              >
                <li>
                  <Link
                    href="/AdminDashboard"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Home Page
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-rose-600"
                  >
                    Log Out
                  </button>
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ✅ Normal Full Navbar for other routes
  return (
    <header
      className={`print:hidden fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "h-14 shadow-md bg-gradient-to-br from-black/20 to-red-800 backdrop-blur-sm"
          : "h-16 bg-gradient-to-br from-black/60 to-red-800"
      }`}
    >
      <nav className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto h-full flex items-center justify-between px-2 sm:px-6">
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

          {/* Admin Dropdown */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full object-cover w-8 h-8"
                  />
                ) : (
                  <User className="text-gray-600 w-6 h-6" />
                )}
                <ChevronDown
                  className={`ml-1 w-4 h-4 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-1 z-50 border border-gray-100"
                    onMouseLeave={() => !isMobile && setOpen(false)}
                  >
                    <li>
                      <Link
                        href="/AdminDashboard"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        Home Page
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-rose-600"
                      >
                        Log Out
                      </button>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

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
