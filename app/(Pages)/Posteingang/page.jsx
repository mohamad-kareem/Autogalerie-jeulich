"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FiXCircle, FiUser, FiMessageSquare } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import CarsTable from "./CarsTable";
import SubmissionsTable from "./SubmissionsTable";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState("cars"); // 'cars' or 'submissions'

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px]  mx-4 text-center">
          <FiXCircle className="mx-auto text-red-500 text-5xl mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Zugriff verweigert
          </h2>
          <p className="text-gray-600">
            Sie sind nicht berechtigt, diese Seite zu sehen. Bitte wenden Sie
            sich an Ihren Administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaCar className="text-red-600" />
              Posteingang / Ankaufsangebote
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Hier sehen Sie alle eingegangenen Fahrzeugangebote und Nachrichten
              von Kunden
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex mb-6 bg-white rounded-lg shadow-sm p-1 max-w-md">
          <button
            onClick={() => setViewMode("cars")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              viewMode === "cars"
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaCar className="inline mr-2" />
            Fahrzeuge
          </button>
          <button
            onClick={() => setViewMode("submissions")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              viewMode === "submissions"
                ? "bg-red-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiMessageSquare className="inline mr-2" />
            Kontaktanfragen
          </button>
        </div>

        {/* Main Content */}
        {viewMode === "cars" ? <CarsTable /> : <SubmissionsTable />}
      </div>
    </div>
  );
}
