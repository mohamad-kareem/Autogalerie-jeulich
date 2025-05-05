// components/MobMenu.jsx
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
  };

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
    <div>
      <button className="print:hidden z-[999] relative" onClick={toggleDrawer}>
        {isOpen ? <X /> : <Menu />}
      </button>

      {isMounted && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: isOpen ? "0%" : "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 right-0 top-16 overflow-y-auto h-full bg-white/70 backdrop-blur text-black p-6"
        >
          <ul>
            {Menus.map(({ name, href, subMenu }, i) => {
              const hasSubMenu = subMenu?.length > 0;
              const isClicked = clicked === i;

              return (
                <li key={name}>
                  {hasSubMenu ? (
                    <span
                      className="text-sm sm:text-xl md:text-xl flex justify-between items-center p-4 hover:bg-red-500 rounded-md cursor-pointer relative"
                      onClick={() => setClicked(isClicked ? false : i)}
                    >
                      {name}
                      <ChevronDown
                        className={`ml-auto transition-transform duration-300 ${
                          isClicked ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  ) : (
                    <Link
                      href={href || "#"}
                      className="text-sm sm:text-xl md:text-xl flex justify-between items-center p-4 hover:bg-red-500 rounded-md cursor-pointer relative block"
                      onClick={toggleDrawer}
                    >
                      {name}
                    </Link>
                  )}

                  {hasSubMenu && (
                    <motion.ul
                      initial="exit"
                      animate={isClicked ? "enter" : "exit"}
                      variants={subMenuDrawer}
                      transition={{ duration: 0.3 }}
                      className="ml-5 overflow-hidden"
                    >
                      {subMenu.map((sub) => (
                        <li key={sub.name}>
                          <Link
                            href={sub.href || "#"}
                            className="p-2 flex items-center hover:bg-red-300 rounded-md cursor-pointer gap-x-2 block"
                            onClick={toggleDrawer}
                          >
                            <span>{sub.name}</span>
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default MobMenu;
