// components/NavBar.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Logo from "../(assets)/Logo.png";
import DesktopMenu from "./DesktopMenu";
import MobMenu from "./MobMenu";
import { Menus } from "../utils/NavData";

export default function NavBar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin;
  const [open, setOpen] = useState(false);

  // Admin avatar URL (fall back to blank or generic)
  const avatarUrl = session?.user?.image || "";

  return (
    <header className="print:hidden fixed inset-x-0 top-0 h-16 bg-white shadow z-50">
      <nav className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src={Logo}
            alt="Logo"
            width={40}
            height={40}
            className="object-contain sm:w-[85px] sm:h-[110px]"
          />
          <span className="hidden sm:inline-block ml-2 text-lg font-semibold whitespace-nowrap">
            Autogalerie Jülich
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Desktop menu */}
          <ul className="hidden lg:flex items-center space-x-4">
            {Menus.map((menu) => (
              <DesktopMenu menu={menu} key={menu.name} />
            ))}
          </ul>

          {/* Admin dropdown */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Admin menu"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Admin Avatar"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-600" />
                )}
                <ChevronDown
                  className={`w-4 h-4 ml-1 transition-transform ${
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
                    className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md py-1 z-50"
                    onMouseLeave={() => setOpen(false)}
                  >
                    <li>
                      <Link
                        href="/AdminDashboard"
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Admin Dashboard
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Log Out
                      </button>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile hamburger */}
          <div className="lg:hidden">
            <MobMenu Menus={Menus} />
          </div>
        </div>
      </nav>
    </header>
  );
}
