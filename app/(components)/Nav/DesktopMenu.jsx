// components/DesktopMenu.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const DesktopMenu = ({ menu, scrolled }) => {
  const [open, setOpen] = useState(false);
  const hasSubMenu = Array.isArray(menu?.subMenu) && menu.subMenu.length > 0;

  // Compact width classes
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
          {/* Animated underline */}
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
              {/* Compact Panel */}
              <div className="rounded-lg border border-slate-200 bg-white/98 backdrop-blur-xl shadow-xl ring-1 ring-black/10 overflow-hidden">
                {/* Header with menu name */}
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/60"></div>

                {/* Compact items grid */}
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
                        {/* Icon container */}
                        {sub.icon && (
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                            {sub.icon}
                          </div>
                        )}

                        {/* Content */}
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

                        {/* Hover accent line */}
                        <div className="absolute left-0 top-1/2 w-1 h-6 bg-blue-500 rounded-r -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Compact Footer */}
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

export default DesktopMenu;
