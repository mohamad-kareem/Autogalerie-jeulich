"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FiXCircle, FiMessageSquare } from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import CarsTable from "./CarsTable";
import SubmissionsTable from "./SubmissionsTable";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [viewMode, setViewMode] = useState("submissions"); // 'cars' or 'submissions'
  const [unreadCount, setUnreadCount] = useState(0);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-950 to-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-950 to-slate-950 text-white">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/70 backdrop-blur-md p-8 rounded-2xl border border-gray-800 shadow-xl max-w-lg text-center"
        >
          <FiXCircle className="mx-auto text-slate-500 text-5xl mb-4" />
          <h2 className="text-2xl font-bold mb-2">Zugriff verweigert</h2>
          <p className="text-gray-400">
            Sie sind nicht berechtigt, diese Seite zu sehen. Bitte wenden Sie
            sich an Ihren Administrator.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-slate-950 text-white relative p-4 md:p-6">
      {/* Glow Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-60 h-60 bg-slate-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 md:mb-4"
        >
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3">
            <FaCar className="text-slate-500" />
            Posteingang
          </h1>
        </motion.div>

        {/* Toggle Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex mb-4 bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-lg p-1 max-w-sm"
        >
          <button
            onClick={() => setViewMode("submissions")}
            className={`flex-1 py-1  rounded-md text-sm font-medium transition ${
              viewMode === "submissions"
                ? "bg-slate-600 text-white shadow"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <FiMessageSquare className="inline mr-2" />
            Kontaktanfragen
            {unreadCount > 0 && (
              <span className="ml-2 bg-slate-500 text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode("cars")}
            className={`flex-1 py-1  rounded-md text-sm font-medium transition ${
              viewMode === "cars"
                ? "bg-slate-600 text-white shadow"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <FaCar className="inline mr-2" />
            Fahrzeuge
          </button>
        </motion.div>

        {/* Main Content */}
        {viewMode === "cars" ? (
          <CarsTable />
        ) : (
          <SubmissionsTable setUnreadCount={setUnreadCount} />
        )}
      </div>
    </div>
  );
}
