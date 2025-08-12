"use client";

import React from "react";
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
} from "react-icons/fi";
import { motion } from "framer-motion";
import NavigationCard from "../../(components)/admin/NavigationCard";

const DashboardContent = ({ user, onProfileClick, unreadCount }) => {
  const pathname = usePathname();
  const firstName = user?.name?.split(" ")[0] || "Admin";
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Navigation items
  const navItems = [
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
      color: "sky",
    },

    ...(user.role === "admin"
      ? [
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
            href: "/Vehicles",
            icon: <FiTruck />,
            label: "Fahrzeuginventar",
            badge: null,
            color: "orange",
          },
          {
            href: "/excel",
            icon: <FiPieChart />,
            label: "Buchhaltung",
            badge: null,
            color: "green",
          },
          {
            href: "/Reg",
            icon: <FiUserPlus />,
            label: "Admin hinzufügen",
            badge: null,
            color: "pink",
          },
        ]
      : []),
  ];

  const widgetItems = [
    ...navItems,
    {
      href: "/punsh",
      icon: <FiClock />,
      label: "Stempeluhr",
      description: "Arbeitszeiten erfassen",
      color: "lime",
    },
    {
      href: "/Auto-scheins",
      icon: <FiFileText />,
      label: "Fahrzeugscheine",
      description: "Dokumente verwalten",
      color: "pink",
    },

    {
      href: "/PersonalData",
      icon: <FiUsers />,
      label: "Kontakte",
      description: "Kundendaten verwalten",
      color: "rose",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-58 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={onProfileClick}
            className="relative group transition-all"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative h-11 w-11"
            >
              <Image
                src={user.image || "/default-avatar.png"}
                alt={user.name}
                width={40}
                height={40}
                unoptimized
                className="h-12 w-8 md:h-10 md:w-10 rounded-full object-cover ring-1 md:ring-2 ring-white shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 ring-2 ring-white rounded-full" />
            </motion.div>
          </button>
          <div className="overflow-hidden">
            <p className="  font-semibold truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                pathname === item.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-${item.color}-600`}
                  style={{ color: `var(--${item.color}-600)` }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200 space-y-1">
          <button
            onClick={onProfileClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-all"
          >
            <FiSettings className="w-5 h-5 text-gray-500" />
            <span>Einstellungen</span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-all"
          >
            <FiLogOut className="w-5 h-5 text-gray-500" />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">
              Willkommen ,{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="text-xs text-gray-500">{today}</p>
            <div className="mt-2 h-0.5 md:h-1 w-12 md:w-16 rounded-full bg-gradient-to-br from-red-600 to-black/80"></div>
          </div>
        </header>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {widgetItems.map((item) => (
            <NavigationCard
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.label}
              description={
                item.description || getDefaultDescription(item.label)
              }
              accentColor={item.color}
              badge={item.badge} // ✅ Add this line
            />
          ))}
        </div>
      </main>
    </div>
  );
};

// Helper function for default descriptions
const getDefaultDescription = (label) => {
  const descriptions = {
    Schlüssel: "Fahrzeugschlüssel verwalten und nachverfolgen",
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
  };
  return descriptions[label] || "Zum Modul navigieren";
};

export default DashboardContent;
