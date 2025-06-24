"use client";

import { useState, useEffect } from "react";
import { getOrCreateDeviceId } from "@/app/utils/device";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function RegisterDevicePage() {
  const [deviceId, setDeviceId] = useState("");
  const { data: session } = useSession();

  // 1. Sync localStorage with DB
  useEffect(() => {
    const syncDeviceId = async () => {
      const localId = getOrCreateDeviceId();

      if (!session?.user?.id) return;

      const res = await fetch("/api/punch/device-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: localId }),
      });

      const data = await res.json();

      if (data.success) {
        // ✅ Match found → device already registered
        setDeviceId(localId);
      } else {
        // ❌ No match → fetch correct one from DB if available
        const adminRes = await fetch("/api/punch/device-id", {
          headers: { "x-admin-id": session.user.id },
        });

        const adminData = await adminRes.json();
        if (adminData.deviceId) {
          localStorage.setItem("deviceId", adminData.deviceId);
          setDeviceId(adminData.deviceId);
        } else {
          // No device in DB yet → use local one
          setDeviceId(localId);
        }
      }
    };

    syncDeviceId();
  }, [session]);

  const handleRegister = async () => {
    if (!session?.user?.id) {
      toast.error("❌ Not logged in");
      return;
    }

    const res = await fetch("/api/punch/register-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        adminId: session.user.id,
      }),
    });

    const result = await res.json();
    if (result.success) toast.success("✅ Device registered!");
    else toast.error(result.error || "❌ Registration failed.");
  };

  return (
    <div className="p-4 text-center">
      <p className="mb-2">Device ID: {deviceId}</p>
      <button
        onClick={handleRegister}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Register This Device
      </button>
    </div>
  );
}
