// components/DesktopMenu.jsx
"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const DesktopMenu = ({ menu }) => {
  const [isHover, setIsHover] = useState(false);

  const subMenuAnimate = {
    enter: {
      opacity: 1,
      rotateX: 0,
      transition: { duration: 0.3 },
      display: "block",
    },
    exit: {
      opacity: 0,
      rotateX: -15,
      transition: { duration: 0.3 },
      transitionEnd: { display: "none" },
    },
  };

  const hasSubMenu = menu?.subMenu?.length > 0;

  return (
    <motion.li
      className="group/link"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Link href={menu.href || "#"}>
        <span className="flex-center gap-1 cursor-pointer px-4 py-1 rounded-xl hover:bg-red-500">
          {menu.name}
          {hasSubMenu && (
            <ChevronDown className="mt-[0.6px] group-hover/link:rotate-180 duration-200" />
          )}
        </span>
      </Link>

      {hasSubMenu && (
        <motion.div
          className="sub-menu"
          initial="exit"
          animate={isHover ? "enter" : "exit"}
          variants={subMenuAnimate}
        >
          <div
            className={`grid gap-7 ${
              menu.gridCols === 3
                ? "grid-cols-3"
                : menu.gridCols === 2
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {menu.subMenu.map((sub, i) => (
              <Link key={i} href={sub.href || "#"}>
                <div className="relative cursor-pointer">
                  <div className="flex-center gap-x-4 group/menubox">
                    <div>
                      <h6 className="font-semibold">{sub.name}</h6>
                      <p className="text-sm text-gray-500">{sub.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.li>
  );
};

export default DesktopMenu;
