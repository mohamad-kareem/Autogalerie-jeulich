// app/(components)/Dashboard.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DashboardContent from "./DashboardContent";
import PageLoader from "@/app/(components)/helpers/PageLoader";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ⚠️ Name bleibt "soldScheins", aber Inhalt = ALLE sichtbaren Scheine
  const [soldScheins, setSoldScheins] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!session?.user?.id) return;

    const fetchData = async () => {
      try {
        const [adminRes, submissionsRes, scheinsRes] = await Promise.all([
          fetch(`/api/admins?id=${session.user.id}`),
          fetch(`/api/submissions?userId=${session.user.id}`),
          fetch(`/api/carschein?page=1&limit=200`),
        ]);

        if (!adminRes.ok) {
          throw new Error("Admin-Daten konnten nicht geladen werden");
        }

        const adminData = await adminRes.json();
        setUser(adminData);

        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setUnreadCount(submissionsData.unreadCount || 0);
        }

        if (scheinsRes.ok) {
          const scheinsData = await scheinsRes.json();
          const docs = scheinsData.docs || [];

          // 🔹 WICHTIG: alle Scheine, die NICHT fürs Dashboard ausgeblendet sind
          // (verkauft + nicht verkauft, aber sichtbar)
          const visibleForDashboard = docs.filter((s) => !s.dashboardHidden);

          setSoldScheins(visibleForDashboard);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Ein Fehler ist aufgetreten");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id, status]);

  const handleDismissSchein = (id) => {
    // lokal sofort rausnehmen (optimistisches Update)
    setSoldScheins((prev) => prev.filter((s) => s._id !== id));
  };

  if (loading || status === "loading") {
    return <PageLoader />;
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
      soldScheins={soldScheins} // ➜ enthält jetzt ALLE sichtbaren Scheine
      onDismissSchein={handleDismissSchein}
    />
  );
}
