"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

const MobMenu = ({ Menus }) => {
  const { data: session } = useSession();
  const isLoggedIn = !!session; // true if logged in, false if not

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Toggle drawer
  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
    setActiveIndex(null);
    document.body.style.overflow = !isOpen ? "hidden" : "auto";
  };

  // Reset on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Submenu animation
  const subMenuDrawer = {
    enter: { height: "auto", overflow: "hidden" },
    exit: { height: 0, overflow: "hidden" },
  };

  if (!isMounted) return null; // prevent hydration mismatch

  return (
    <div className="print:hidden">
      {/* Menu Button */}
      <button
        onClick={toggleDrawer}
        className={`fixed top-3 ${
          isLoggedIn ? "right-18" : "right-2"
        } z-[9999] p-2 rounded-md backdrop-blur-sm shadow-md`}
      >
        {isOpen ? (
          <X size={21} className="text-white" />
        ) : (
          <Menu size={21} className="text-white" />
        )}
      </button>

      {/* Background overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[998]"
          onClick={toggleDrawer}
        />
      )}

      {/* Drawer */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 w-4/5 max-w-sm h-[100dvh] bg-white/95 backdrop-blur-lg text-black z-[999] shadow-xl overflow-y-auto"
      >
        <div className="h-full pt-20 pb-10 px-6">
          <ul className="space-y-2">
            {Menus.map(({ name, href, subMenu }, i) => {
              const hasSubMenu = Array.isArray(subMenu) && subMenu.length > 0;
              const isActive = activeIndex === i;

              return (
                <li key={name}>
                  {hasSubMenu ? (
                    <div>
                      {/* Parent item */}
                      <span
                        className="flex justify-between items-center p-4 text-lg rounded-md cursor-pointer transition-colors hover:bg-red-500 hover:text-white"
                        onClick={() => setActiveIndex(isActive ? null : i)}
                      >
                        {name}
                        <ChevronDown
                          className={`ml-2 transition-transform duration-300 ${
                            isActive ? "rotate-180" : ""
                          }`}
                        />
                      </span>

                      {/* Submenu */}
                      <motion.ul
                        initial="exit"
                        animate={isActive ? "enter" : "exit"}
                        variants={subMenuDrawer}
                        transition={{ duration: 0.3 }}
                        className="ml-4 border-l-2 border-gray-200 overflow-hidden"
                      >
                        {subMenu.map((sub) => (
                          <li key={sub.name}>
                            <Link
                              href={sub.href || "#"}
                              onClick={toggleDrawer}
                              className="block p-3 rounded-md transition-colors hover:bg-red-100"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    </div>
                  ) : (
                    <Link
                      href={href || "#"}
                      onClick={toggleDrawer}
                      className="block p-4 text-lg rounded-md transition-colors hover:bg-red-500 hover:text-white"
                    >
                      {name}
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

export default MobMenu;
