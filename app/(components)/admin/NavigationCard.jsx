"use client";

import React from "react";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

const NavigationCard = ({
  href,
  icon,
  title,
  description,
  accentColor,
  badge,
}) => {
  const colorMap = {
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    indigo: "bg-indigo-100 text-indigo-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
    teal: "bg-teal-100 text-teal-700",
    cyan: "bg-cyan-100 text-cyan-700",
    lime: "bg-lime-100 text-lime-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
    gray: "bg-gray-100 text-gray-700",
    zinc: "bg-zinc-100 text-zinc-700",
    neutral: "bg-neutral-100 text-neutral-700",
    stone: "bg-stone-100 text-stone-700",
    emerald: "bg-emerald-100 text-emerald-700",
    fuchsia: "bg-fuchsia-100 text-fuchsia-700",
    violet: "bg-violet-100 text-violet-700",
    lightBlue: "bg-sky-200 text-sky-800",
    warmGray: "bg-stone-200 text-stone-700",
    coolGray: "bg-gray-200 text-gray-700",
  };

  const gradientMap = {
    red: "from-red-400 to-red-300",
    green: "from-green-400 to-green-300",
    blue: "from-blue-400 to-blue-300",
    yellow: "from-yellow-400 to-yellow-300",
    orange: "from-orange-400 to-orange-300",
    indigo: "from-indigo-400 to-indigo-300",
    purple: "from-purple-400 to-purple-300",
    pink: "from-pink-400 to-pink-300",
    teal: "from-teal-400 to-teal-300",
    cyan: "from-cyan-400 to-cyan-300",
    lime: "from-lime-400 to-lime-300",
    amber: "from-amber-400 to-amber-300",
    rose: "from-rose-400 to-rose-300",
    sky: "from-sky-400 to-sky-300",
    slate: "from-slate-400 to-slate-300",
    gray: "from-gray-400 to-gray-300",
    zinc: "from-zinc-400 to-zinc-300",
    neutral: "from-neutral-400 to-neutral-300",
    stone: "from-stone-400 to-stone-300",
    emerald: "from-emerald-400 to-emerald-300",
    fuchsia: "from-fuchsia-400 to-fuchsia-300",
    violet: "from-violet-400 to-violet-300",
    lightBlue: "from-sky-300 to-sky-200",
    warmGray: "from-stone-300 to-stone-200",
    coolGray: "from-gray-300 to-gray-200",
  };

  return (
    <Link href={href} passHref>
      <div
        className={`group relative h-full overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${gradientMap[accentColor]} p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 md:hover:-translate-y-1`}
      >
        <div className="relative z-10 flex items-start">
          <div
            className={`mr-3 md:mr-4 rounded-lg md:rounded-xl p-2 md:p-3 ${colorMap[accentColor]} transition-all group-hover:scale-105 md:group-hover:scale-110`}
          >
            {React.cloneElement(icon, { className: "text-sm md:text-base" })}
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800">
              {title}
            </h3>
            <p className="mt-1 text-[10px] md:text-xs  text-gray-600 line-clamp-2">
              {description}
            </p>
            <div className="mt-2 md:mt-3 flex items-center text-xs md:text-sm font-medium text-gray-500 transition-colors group-hover:text-gray-700">
              <span>Modul öffnen</span>
              <FiChevronRight className="ml-0.5 md:ml-1 transition-transform group-hover:translate-x-0.5 md:group-hover:translate-x-1" />
            </div>
          </div>
        </div>
        {badge && (
          <div className="absolute top-3 right-3 z-30">
            <div className="relative group">
              {/* Premium badge container */}
              <div className="relative flex items-center justify-center px-3.5 py-1.5 rounded-sm backdrop-blur-lg bg-white/90 border border-gray-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white">
                {/* Subtle inner shadow */}
                <div className="absolute inset-0 rounded-sm shadow-inner opacity-30"></div>

                {/* Content */}
                <span className="text-xs font-medium text-gray-900 tracking-tight">
                  {badge}
                </span>

                {/* Sophisticated notification indicator */}
                <div className="absolute -top-0.5 -right-0.5">
                  {/* Outer ring */}
                  <div className="absolute h-3.5 w-3.5 rounded-full border border-gray-400/20"></div>

                  {/* Inner core */}
                  <div className="relative h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_0_1px_rgba(255,255,255,0.8)]">
                    {/* Micro highlight */}
                    <div className="absolute top-0.5 left-0.5 h-0.5 w-0.5 rounded-full bg-white/60"></div>
                  </div>
                </div>
              </div>

              {/* Precision shadow */}
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-5/6 h-0.5 bg-gray-400/10 rounded-full blur-[0.5px]"></div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default NavigationCard;
