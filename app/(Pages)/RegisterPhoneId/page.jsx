"use client";

import { useState, useEffect } from "react";
import { getOrCreateDeviceId } from "@/app/utils/device";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react"; //
export default function RegisterDevicePage() {
  const [deviceId, setDeviceId] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

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
