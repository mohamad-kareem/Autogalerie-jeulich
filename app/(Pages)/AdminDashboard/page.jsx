"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DashboardContent from "./DashboardContent";
import ProfileEditModal from "@/app/(components)/admin/ProfileEditModal";

export default function Dashboard() {
  const { data: session, status } = useSession(); // add status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!session?.user?.id) return;

        const response = await fetch(`/api/admins?id=${session.user.id}`);
        if (!response.ok) {
          throw new Error("Admin-Daten konnten nicht geladen werden");
        }

        const adminData = await response.json();
        setUser({ ...adminData, role: "Administrator" });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchAdminData();
    }
  }, [session, status]);

  const handleSaveProfile = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

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
    <>
      <DashboardContent
        user={user}
        onProfileClick={() => setShowProfileModal(true)}
      />

      {showProfileModal && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}
