"use client";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const MobMenu = ({ Menus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    setClicked(false);
    // Prevent body scroll when menu is open
    document.body.style.overflow = isOpen ? "auto" : "hidden";
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const subMenuDrawer = {
    enter: {
      height: "auto",
      overflow: "hidden",
    },
    exit: {
      height: 0,
      overflow: "hidden",
    },
  };

  return (
    <div className="print:hidden">
      {/* Menu Button - fixed position */}
      <button className="z-[9999] relative" onClick={toggleDrawer}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMounted && (
        <>
          {/* Background overlay */}
          {isOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-[998]"
              onClick={toggleDrawer}
            />
          )}

          {/* Menu drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: isOpen ? "0%" : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 w-4/5 max-w-sm h-[100dvh] bg-white/95 backdrop-blur-lg text-black z-[999] shadow-xl overflow-y-auto"
          >
            <div className="h-full overflow-y-auto pt-20 pb-10 px-6">
              <ul className="space-y-2">
                {Menus.map(({ name, href, subMenu }, i) => {
                  const hasSubMenu = subMenu?.length > 0;
                  const isClicked = clicked === i;

                  return (
                    <li key={name}>
                      {hasSubMenu ? (
                        <div>
                          <span
                            className="text-lg flex justify-between items-center p-4 hover:bg-red-500 hover:text-white rounded-md cursor-pointer transition-colors"
                            onClick={() => setClicked(isClicked ? false : i)}
                          >
                            {name}
                            <ChevronDown
                              className={`ml-2 transition-transform duration-300 ${
                                isClicked ? "rotate-180" : ""
                              }`}
                            />
                          </span>

                          <motion.ul
                            initial="exit"
                            animate={isClicked ? "enter" : "exit"}
                            variants={subMenuDrawer}
                            transition={{ duration: 0.3 }}
                            className="ml-4 overflow-hidden border-l-2 border-gray-200"
                          >
                            {subMenu.map((sub) => (
                              <li key={sub.name}>
                                <Link
                                  href={sub.href || "#"}
                                  className="p-3  items-center hover:bg-red-100 rounded-md cursor-pointer transition-colors block"
                                  onClick={toggleDrawer}
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
                          className="text-lg flex justify-between items-center p-4 hover:bg-red-500 hover:text-white rounded-md cursor-pointer transition-colors block"
                          onClick={toggleDrawer}
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
        </>
      )}
    </div>
  );
};

export default MobMenu;
