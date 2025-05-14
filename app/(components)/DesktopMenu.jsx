// components/DesktopMenu.jsx
"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const DesktopMenu = ({ menu, scrolled }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  const subMenuAnimation = {
    hidden: {
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 },
  };

  const hasSubMenu = menu?.subMenu?.length > 0;

  return (
    <motion.li
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        setActiveSubMenu(menu.name);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveSubMenu(null);
      }}
      whileHover={{ scale: 1.02 }}
    >
      <Link
        href={menu.href || "#"}
        className={`flex items-center gap-1 px-4 py-3 transition-all duration-300 font-medium ${
          scrolled ? "text-sm py-2" : "text-base py-3"
        } text-white hover:text-red-600`}
      >
        {menu.name}
        {hasSubMenu && (
          <ChevronDown
            className={`w-4 h-4 ml-1 transition-transform duration-200 ${
              isHovered ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        )}
      </Link>

      {hasSubMenu && (
        <AnimatePresence>
          {isHovered && activeSubMenu === menu.name && (
            <motion.div
              className={`absolute left-0 top-full pt-2 z-50 ${
                menu.gridCols === 3
                  ? "w-[720px]"
                  : menu.gridCols === 2
                  ? "w-[480px]"
                  : "w-[200px]"
              }`}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={subMenuAnimation}
            >
              {/* 🔴 Red separator line */}
              <div className="h-1 bg-red-600 w-full rounded-t-md" />

              <div className="bg-white rounded-b-lg shadow-xl border border-gray-100 overflow-hidden">
                <div
                  className={`grid p-4 gap-6 ${
                    menu.gridCols === 3
                      ? "grid-cols-3"
                      : menu.gridCols === 2
                      ? "grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {menu.subMenu.map((sub, i) => (
                    <motion.div
                      key={i}
                      variants={itemAnimation}
                      whileHover={{ x: 2 }}
                    >
                      <Link
                        href={sub.href || "#"}
                        className="block p-3 rounded-lg hover:bg-red-50 transition-colors duration-200"
                      >
                        <div className="flex items-start gap-3">
                          {sub.icon && (
                            <div className="flex-shrink-0 mt-1 text-red-600">
                              {sub.icon}
                            </div>
                          )}
                          <div>
                            <h6 className="font-semibold text-gray-900">
                              {sub.name}
                            </h6>
                            {sub.desc && (
                              <p className="text-sm text-gray-500 mt-1">
                                {sub.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {menu.footer && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                    <Link
                      href={menu.footer.href || "#"}
                      className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      {menu.footer.text}
                      <ChevronDown className="w-4 h-4 rotate-90" />
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
