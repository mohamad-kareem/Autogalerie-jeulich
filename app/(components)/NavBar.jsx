"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

import Logo from "../(assets)/Logo.png";
import DesktopMenu from "./DesktopMenu";
import MobMenu from "./MobMenu";
import { Menus } from "../utils/NavData";

export default function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAdmin = session?.user?.isAdmin;
  const avatarUrl = session?.user?.image || "";

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const adminRoutes = [
    "/admin",
    "/Aufgaben",
    "/forms",
    "/addcar",
    "/excel",
    "/schlussel",
    "/trello",
    "/AdminDashboard",
    "/PersonalData",
  ];

  const isAdminRoute = adminRoutes.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    setHydrated(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleScroll();
    checkIfMobile();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // ✅ Admin Dropdown Only (Floating, no Navbar)
  if (isAdminRoute && isAdmin) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            aria-label="Admin menu"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Admin Avatar"
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
        hydrated && scrolled
          ? "h-14 shadow-md bg-white/95 backdrop-blur-sm"
          : "h-16 bg-white"
      }`}
    >
      <nav className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src={Logo}
            alt="Logo"
            width={40}
            height={40}
            priority
            className={`object-contain w-10 h-10 sm:w-[85px] sm:h-[110px] transition-transform duration-300 ${
              hydrated && scrolled ? "scale-90" : "scale-100"
            }`}
          />
          <span
            className={`hidden sm:inline-block ml-2 font-semibold whitespace-nowrap transition-all duration-300 ${
              hydrated && scrolled ? "text-base" : "text-lg"
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
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                aria-label="Admin menu"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Admin Avatar"
                    width={32}
                    height={32}
                    className="rounded-full object-cover transition-all duration-300 w-8 h-8"
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
              isAdmin={isAdmin}
              avatarUrl={avatarUrl}
              onSignOut={() => signOut({ callbackUrl: "/" })}
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
