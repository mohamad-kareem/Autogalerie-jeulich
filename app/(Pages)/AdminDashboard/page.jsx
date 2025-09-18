"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DashboardContent from "./DashboardContent";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

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
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [session?.user?.id, status]);

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 md:h-12 md:w-12 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-700">
            Dashboard wird geladen...
          </p>
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
