// components/MobMenu.jsx
"use client";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion } from "framer-motion";

const MobMenu = ({ Menus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clicked, setClicked] = useState(false);

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
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? "0%" : "-100%" }}
        className="fixed left-0 right-0 top-16 overflow-y-auto h-full bg-white/70 backdrop-blur text-black p-6"
      >
        <ul>
          {Menus.map(({ name, subMenu }, i) => {
            const hasSubMenu = subMenu?.length > 0;
            const isClicked = clicked === i;
            return (
              <li key={name}>
                <span
                  className="text-sm sm:text-xl md:text-xl flex-center-between p-4 hover:bg-red-500 rounded-md cursor-pointer relative"
                  onClick={() => setClicked(isClicked ? false : i)}
                >
                  {name}
                  {hasSubMenu && (
                    <ChevronDown
                      className={`ml-auto ${isClicked ? "rotate-180" : ""}`}
                    />
                  )}
                </span>
                {hasSubMenu && (
                  <motion.ul
                    initial="exit"
                    animate={isClicked ? "enter" : "exit"}
                    variants={subMenuDrawer}
                    className="ml-5"
                  >
                    {subMenu.map((sub) => (
                      <li
                        key={sub.name}
                        className="p-2 flex-center hover:bg-red-300 rounded-md cursor-pointer gap-x-2"
                      >
                        <span>{sub.name}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
};

export default MobMenu;
