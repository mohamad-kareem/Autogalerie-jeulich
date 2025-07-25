"use client";

import React from "react";
import Link from "next/link";
import {
  FiBook,
  FiFileText,
  FiKey,
  FiCheckSquare,
  FiUserPlus,
  FiClock,
  FiMapPin,
  FiArchive,
  FiTruck,
} from "react-icons/fi";
import NavigationCard from "@/app/(components)/admin/NavigationCard";
import Image from "next/image";

const DashboardContent = ({ user, onProfileClick, unreadCount }) => {
  console.log("🧑‍💻 Client User Role:", user?.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 pb-8 md:pb-12">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-4 py-6 md:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col justify-between md:flex-row md:items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 sm:text-2xl">
                Willkommen zurück,{" "}
                <span className="text-red-900">{user.name.split(" ")[0]}</span>!
              </h1>
              <p className="hidden md:block mt-1 text-sm text-gray-600">
                Sie haben vollen administrativen Zugriff auf das System
              </p>

              <div className="mt-2 h-0.5 md:h-1 w-12 md:w-16 rounded-full bg-gradient-to-br from-red-600 to-black/80"></div>
            </div>
            <div className="mt-3 md:mt-4 flex items-center space-x-3 md:space-x-4">
              <div className="hidden text-right md:block">
                <p className="text-sm md:text-base font-medium text-gray-700">
                  {user.role}
                </p>
                <p className="text-xs md:text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={onProfileClick}
                  className="flex items-center focus:outline-none transition-transform hover:scale-105"
                >
                  <Image
                    src={user.image || "/default-avatar.png"}
                    alt={user.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover ring-1 md:ring-2 ring-white shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-500 ring-1 md:ring-2 ring-white"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6 md:mb-8">
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Systemmodule
            </h2>
            <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-4"></div>
            <span className="text-xs md:text-sm text-gray-500">
              {new Date().toLocaleDateString("de-DE", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* ✅ Show these first for all users */}
            <NavigationCard
              href="/schlussel"
              icon={<FiKey />}
              title="Schlüssel"
              description="Schlüsselverwaltung"
              accentColor="cyan"
            />

            <NavigationCard
              href="/kaufvertrag/auswahl"
              icon={<FiFileText />}
              title="Neuen Vertrag erstellen"
              description="Erstelle einen neuen Kaufvertrag"
              accentColor="purple"
            />
            <NavigationCard
              href="/Posteingang"
              icon={
                <div className="relative">
                  <FiCheckSquare />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  )}
                </div>
              }
              title={
                unreadCount > 0 ? (
                  <span className="font-semibold">Posteingang</span>
                ) : (
                  "Posteingang"
                )
              }
              description={
                typeof unreadCount === "number" && unreadCount > 0 ? (
                  <span className="text-red-600 font-bold text-xl">{`${unreadCount} neue Anfrage${
                    unreadCount === 1 ? "" : "n"
                  }`}</span>
                ) : (
                  "Eingegangene Fahrzeugangebote"
                )
              }
              accentColor="indigo"
              className="border-l-4 border-indigo-800"
            />
            <NavigationCard
              href="/kaufvertrag/liste"
              icon={<FiFileText />}
              title="Vorherige Verträge"
              description="Alle gespeicherten Kaufverträge anzeigen"
              accentColor="gray"
            />

            {/* ✅ Admin-only: Archiv now comes right after the above three */}
            {user.role === "admin" && (
              <>
                <NavigationCard
                  href="/kaufvertrag/archiv"
                  icon={<FiArchive />}
                  title="Archiv"
                  description="Archivierte Kaufverträge anzeigen"
                  accentColor="red"
                />

                <NavigationCard
                  href="/Zeiterfassungsverwaltung"
                  icon={<FiClock />}
                  title="Zeiterfassung verwalten"
                  description="Verwalte und analysiere Arbeitszeiten effizient"
                  accentColor="yellow"
                />
              </>
            )}

            {/* ✅ Other cards (order doesn't matter) */}

            <NavigationCard
              href="/punsh"
              icon={<FiClock />}
              title="Stempeluhr"
              description="Ein- und Ausstempeln für Admins"
              accentColor="teal"
            />
            <NavigationCard
              href="/Auto-scheins"
              icon={<FiFileText />}
              title="Fahrzeugscheine"
              description="Verwalte hochgeladene oder gespeicherte Fahrzeugscheine und Dokumente"
              accentColor="rose"
            />
            <NavigationCard
              href="/PersonalData"
              icon={<FiMapPin />}
              title="Kontakte"
              description="Telefonnummern und Adressen"
              accentColor="orange"
            />

            {user.role === "admin" && (
              <>
                <NavigationCard
                  href="/Vehicles"
                  icon={<FiTruck />} // or use another suitable icon
                  title="Fahrzeuge"
                  description="Fahrzeuge verwalten und anzeigen"
                  accentColor="pink"
                />
                <NavigationCard
                  href="/excel"
                  icon={<FiBook />}
                  title="Buchhaltung"
                  description="Finanzdaten und Aufzeichnungen"
                  accentColor="green"
                />
                <NavigationCard
                  href="/Reg"
                  icon={<FiUserPlus />}
                  title="Admin hinzufügen"
                  description="Neuen Administrator registrieren"
                  accentColor="lime"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
