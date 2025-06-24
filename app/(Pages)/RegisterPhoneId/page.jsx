"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { setDeviceId } from "@/app/utils/device";

export default function RegisterDevicePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!session?.user?.id) {
      toast.error("Please login first");
      return;
    }

    setLoading(true);
    try {
      // Generate new device ID
      const deviceId = crypto.randomUUID();

      // Save to database
      const res = await fetch("/api/punch/register-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id, deviceId }),
      });

      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Registration failed");

      // Save to local storage
      setDeviceId(deviceId);
      toast.success("Device registered successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Device registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Register Device</h1>
      <p className="mb-6">
        Register this device to enable punch functionality without login.
      </p>
      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register This Device"}
      </button>
    </div>
  );
}
