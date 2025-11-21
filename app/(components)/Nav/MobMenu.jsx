// components/MobMenu.jsx
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

const MobMenu = ({ Menus }) => {
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
          {/* Navigation Header */}
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
                      {/* Parent item */}
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

                      {/* Submenu */}
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

export default MobMenu;
