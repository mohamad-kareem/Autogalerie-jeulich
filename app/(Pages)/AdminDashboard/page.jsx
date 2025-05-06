// app/(Pages)/AdminDashboard/page.jsx
"use client";

import React from "react";
import Link from "next/link";
import {
  FiPlus,
  FiBook,
  FiFileText,
  FiKey,
  FiCheckSquare,
  FiUserPlus,
} from "react-icons/fi";
import toast from "react-hot-toast";

const NavigationCard = ({
  href,
  icon,
  title,
  description,
  bgColor,
  iconBgColor = "bg-white/20",
}) => (
  <Link href={href} passHref>
    <div
      className={`${bgColor} p-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer text-white h-full`}
    >
      <div className="flex items-start">
        <div className={`p-2 rounded-lg ${iconBgColor} shadow-sm mr-4`}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-white/90">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-15">
          <NavigationCard
            href="/addcar"
            icon={<FiPlus />}
            title="Neues Auto"
            description="Fügen Sie ein neues Fahrzeug hinzu"
            bgColor="bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            iconBgColor="bg-red-800"
          />
          <NavigationCard
            href="/excel"
            icon={<FiBook />}
            title="Kassenbuch"
            description="Buchhaltung und Finanzen"
            bgColor="bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
            iconBgColor="bg-green-700"
          />
          <NavigationCard
            href="/forms"
            icon={<FiFileText />}
            title="Kaufverträge"
            description="Dokumente und Verträge"
            bgColor="bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
            iconBgColor="bg-purple-700"
          />
          <NavigationCard
            href="/schlussel"
            icon={<FiKey />}
            title="Schlüssel"
            description="Schlüsselverwaltung"
            bgColor="bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800"
            iconBgColor="bg-orange-700"
          />
        </div>

        {/* Additional row for tasks and admin registration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NavigationCard
            href="/Aufgaben"
            icon={<FiCheckSquare />}
            title="Aufgaben"
            description="Aufgabenverwaltung und To-Dos"
            bgColor="bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800"
            iconBgColor="bg-indigo-700"
          />
          <NavigationCard
            href="/trello"
            icon={<FiCheckSquare />}
            title="Trello-Board"
            description="Projektübersicht & Status"
            bgColor="bg-gradient-to-br from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700"
            iconBgColor="bg-blue-500"
          />
          <NavigationCard
            href="/Reg"
            icon={<FiUserPlus />}
            title="Admin hinzufügen"
            description="Neuen Administrator registrieren"
            bgColor="bg-gradient-to-br from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800"
            iconBgColor="bg-yellow-700"
          />
        </div>

        {/* Welcome section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Willkommen im Admin-Bereich
          </h2>
          <p className="text-gray-600">
            Wählen Sie eine der oben genannten Optionen, um fortzufahren.
          </p>
        </div>
      </main>
    </div>
  );
}
