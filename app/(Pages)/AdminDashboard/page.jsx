"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DashboardContent from "./DashboardContent";
import { quotes } from "@/lib/quotes";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);

  // Fetch user + submissions data
  useEffect(() => {
    if (status === "authenticated") {
      const fetchData = async () => {
        if (!session?.user?.id) return;
        const startTime = Date.now();

        try {
          const [adminRes, submissionsRes] = await Promise.all([
            fetch(`/api/admins?id=${session.user.id}`),
            fetch(`/api/submissions?userId=${session.user.id}`),
          ]);

          if (!adminRes.ok)
            throw new Error("Admin-Daten konnten nicht geladen werden");

          const adminData = await adminRes.json();
          const { unreadCount } = await submissionsRes.json();

          setUser(adminData);
          setUnreadCount(unreadCount || 0);
        } catch (error) {
          toast.error(error.message || "Ein Fehler ist aufgetreten");
        } finally {
          // ⏳ Ensure loader shows for at least 1.2s
          const elapsed = Date.now() - startTime;
          const delay = Math.max(0, 2000 - elapsed);
          setTimeout(() => setLoading(false), delay);
        }
      };
      fetchData();
    }
  }, [session?.user?.id, status]);

  // Pick a random quote once when component mounts
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 to-red-950">
        <div className="text-center max-w-2xl mx-auto px-4">
          {/* Loading spinner */}
          <div className="mb-8">
            <div className="mx-auto h-10 w-10 md:h-12 md:w-12 animate-spin rounded-full border-t-2 border-b-2 border-amber-500"></div>
          </div>

          {/* Quote display */}
          {quote && (
            <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-amber-700/30 shadow-lg">
              {/* Arabic text */}
              <div className="mb-3">
                <p className="text-lg md:text-xl text-white text-center leading-relaxed">
                  {quote.text}
                </p>
              </div>

              {/* German Translation */}
              <div className="mb-4">
                <p className="text-lg md:text-xl text-amber-100 text-center italic leading-relaxed">
                  "{quote.translation}"
                </p>
              </div>

              {/* Source */}
              <div className="pt-4 border-t border-amber-700/30">
                <p className="text-sm text-amber-300 text-center">
                  {quote.source}
                </p>
              </div>

              {/* Decorative bottom element */}
              <div className="mt-6 flex justify-center">
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user && status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <p className="text-sm md:text-base text-gray-700">
            Admin-Daten konnten nicht geladen werden
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContent
      user={user}
      unreadCount={unreadCount}
      setUnreadCount={setUnreadCount}
    />
  );
}
