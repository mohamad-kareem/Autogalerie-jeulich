"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { signOut } from "next-auth/react";
import {
  FiBook,
  FiFileText,
  FiKey,
  FiCheckSquare,
  FiUserPlus,
  FiClock,
  FiUsers,
  FiArchive,
  FiInbox,
  FiSettings,
  FiLogOut,
  FiChevronRight,
  FiTruck,
  FiHome,
  FiPieChart,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiGrid,
  FiX,
  FiMenu,
  FiSearch,
  FiBell,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const DashboardContent = ({ user, unreadCount }) => {
  const adminOnlyRoutes = [
    "/kaufvertrag/archiv",
    "/Reg",
    "/Zeiterfassungsverwaltung",
    "/excel",
    "/Vehicles",
  ];
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const firstName = user?.name?.split(" ")[0] || "Admin";
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Navigation items organized by category
  const navCategories = [
    {
      id: "core",
      name: "Daily Tasks",
      items: [
        {
          href: "/schlussel",
          icon: <FiKey />,
          label: "Schlüssel",
          badge: null,
          color: "cyan",
        },
        {
          href: "/kaufvertrag/auswahl",
          icon: <FiFileText />,
          label: "Neuer Vertrag",
          badge: null,
          color: "purple",
        },
        {
          href: "/Autoteil",
          icon: <FiPackage />,
          label: "Teile-Reklamation",
          description: "Teile reklamieren & verfolgen",
          color: "orange",
        },
        {
          href: "/kaufvertrag/liste",
          icon: <FiArchive />,
          label: "Verträge",
          badge: null,
          color: "gray",
        },
        {
          href: "/Posteingang",
          icon: <FiInbox />,
          label: "Posteingang",
          badge: unreadCount > 0 ? unreadCount : null,
          color: "green",
        },
        {
          href: "/Auto-scheins",
          icon: <FiFileText />,
          label: "Fahrzeugscheine",
          description: "Dokumente verwalten",
          color: "pink",
        },
        ,
        {
          href: "/punsh",
          icon: <FiClock />,
          label: "Stempeluhr",
          description: "Arbeitszeiten erfassen",
          color: "lime",
        },

        {
          href: "/PersonalData",
          icon: <FiUsers />,
          label: "Kontakte",
          description: "Kundendaten verwalten",
          color: "rose",
        },
      ],
    },

    {
      id: "admin",
      name: "Administration",
      items: [
        {
          href: "/kaufvertrag/archiv",
          icon: <FiArchive />,
          label: "Archiv",
          badge: null,
          color: "red",
        },
        {
          href: "/Zeiterfassungsverwaltung",
          icon: <FiClock />,
          label: "Zeiterfassung",
          badge: null,
          color: "yellow",
        },
        {
          href: "/excel",
          icon: <FiPieChart />,
          label: "Buchhaltung",
          badge: null,
          color: "green",
        },
        {
          href: "/Vehicles",
          icon: <FiTruck />,
          label: "Fahrzeuginventar",
          badge: null,
          color: "orange",
        },
        {
          href: "/Reg",
          icon: <FiUserPlus />,
          label: "Admin hinzufügen",
          badge: null,
          color: "pink",
        },
      ],
    },
  ];

  // Flatten all items for search
  const allItems = navCategories.flatMap((category) => category.items);

  // Filter items based on search and category
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      activeCategory === "all" ||
      navCategories.find((cat) => cat.items.includes(item))?.id ===
        activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Holographic card component - made more compact
  const HolographicCard = ({
    href,
    icon,
    title,
    description,
    accentColor,
    badge,
  }) => {
    const colorMap = {
      cyan: "from-cyan-500 to-teal-500",
      purple: "from-purple-500 to-indigo-500",
      orange: "from-orange-500 to-amber-500",
      gray: "from-gray-500 to-slate-500",
      sky: "from-sky-500 to-blue-500",
      lime: "from-lime-500 to-green-500",
      pink: "from-pink-500 to-rose-500",
      rose: "from-rose-500 to-red-500",
      red: "from-red-500 to-orange-500",
      yellow: "from-yellow-500 to-amber-500",
      green: "from-green-500 to-emerald-500",
    };

    return (
      <motion.div
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group"
      >
        <Link href={href}>
          <div className="relative h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 overflow-hidden border border-gray-700 shadow-lg">
            {/* Holographic effect */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${colorMap[accentColor]} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
            />

            {/* Glow effect */}
            <div
              className={`absolute -inset-1 bg-gradient-to-r ${colorMap[accentColor]} opacity-0 group-hover:opacity-20 blur transition-opacity duration-500`}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Title + Icon Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[accentColor]} text-white shadow-md`}
                  >
                    {React.cloneElement(icon, {
                      className: "h-4 w-4 sm:h-5 sm:w-5",
                    })}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    {title}
                  </h3>
                </div>

                {badge && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-500 text-white">
                    {badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-400 text-xs sm:text-sm mb-2 flex-grow">
                {description}
              </p>

              {/* Footer link */}
              <div className="mt-auto flex items-center text-xs text-gray-400 group-hover:text-gray-400 transition-colors">
                Zugriff starten
                <FiChevronRight className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-red-950 text-white overflow-hidden">
      {/* Floating navbar - made more compact */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-gradient-to-r from-red-950 to-gray-950 backdrop-blur-md border-b border-gray-800"
      >
        <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Left side */}
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-red-800 to-gray-600 p-1.5 rounded-lg">
                <FiGrid className="h-3 w-3 sm:h-5 sm:w-5 text-gray-300" />
              </div>
              <motion.header
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="ml-2"
              >
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold ">
                  Willkommen ,{" "}
                  <span className="bg-gradient-to-r from-red-600 to-gray-500 bg-clip-text text-transparent">
                    {firstName}
                  </span>
                </h1>
              </motion.header>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main content */}
      <main className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}

        {/* Category filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-1.5 mb-7 sm:mb-6"
        >
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-red-950 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Alle Module
          </button>

          {navCategories
            .filter((category) => {
              // hide "Administration" for non-admins
              if (category.id === "admin" && user?.role !== "admin") {
                return false;
              }
              // hide "Daily Tasks" for non-admins (they already see them under Alle)
              if (category.id === "core" && user?.role !== "admin") {
                return false;
              }
              return true;
            })
            .map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-red-950 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {category.name}
              </button>
            ))}
        </motion.div>

        {/* Dashboard modules grid */}
        {filteredItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {filteredItems
              .filter((item) => {
                if (
                  adminOnlyRoutes.includes(item.href) &&
                  user?.role !== "admin"
                ) {
                  return false;
                }
                return true;
              })
              .sort((a, b) => {
                const order = [
                  "/schlussel",
                  "/kaufvertrag/auswahl",
                  "/kaufvertrag/liste",
                  "/kaufvertrag/archiv",
                  "/Zeiterfassungsverwaltung",
                  "/punsh",
                ];
                const indexA = order.indexOf(a.href);
                const indexB = order.indexOf(b.href);
                // If not found in custom order → keep them after
                return (
                  (indexA === -1 ? 999 : indexA) -
                  (indexB === -1 ? 999 : indexB)
                );
              })
              .map((item) => (
                <HolographicCard
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.label}
                  description={getDefaultDescription(item.label)}
                  accentColor={item.color}
                  badge={item.badge}
                />
              ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-800 mb-3">
              <FiSearch className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">
              Keine Ergebnisse gefunden
            </h3>
            <p className="text-gray-400 text-sm">
              Versuchen Sie, andere Suchbegriffe zu verwenden oder eine andere
              Kategorie auszuwählen.
            </p>
          </motion.div>
        )}
      </main>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-60 h-60 bg-cyan-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-purple-500/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

// Helper function for default descriptions
const getDefaultDescription = (label) => {
  const descriptions = {
    Schlüssel: "Schlüssel nachverfolgen",
    "Neuer Vertrag": "Neuen Kaufvertrag erstellen",
    Posteingang: "Neue Anfragen und Nachrichten",
    Verträge: "Alle aktiven Verträge einsehen",
    Archiv: "Abgeschlossene Verträge archivieren",
    Zeiterfassung: "Teamzeiten analysieren",
    Buchhaltung: "Finanzberichte und Übersichten",
    "Admin hinzufügen": "Neue Benutzerkonten erstellen",
    Stempeluhr: "Arbeitszeiten erfassen",
    Fahrzeugscheine: "Fahrzeugdokumente verwalten",
    Kontakte: "Kunden- und Lieferantendaten",
    Fahrzeuginventar: "Fahrzeugbestand verwalten",
    "Teile-Reklamation": "Teile reklamieren & verfolgen",
  };
  return descriptions[label] || "Zum Modul navigieren";
};

export default DashboardContent;
