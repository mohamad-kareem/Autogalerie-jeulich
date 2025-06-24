"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { getOrCreateDeviceId } from "@/utils/device";
import * as turf from "@turf/turf";

const dealershipCoords = turf.polygon([
  [
    [6.3855, 50.928],
    [6.3755, 50.9283],
    [6.3555, 50.9245],
    [6.3543, 50.9095],
    [6.368, 50.905],
    [6.386, 50.9095],
    [6.3825, 50.9205],
    [6.3855, 50.928],
  ],
]);

export default function PunchQRPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    const handlePunch = async () => {
      try {
        // Check if device is registered (for non-logged in users)
        const deviceId = getOrCreateDeviceId();
        let adminId = session?.user?.id;

        if (!adminId && !deviceId) {
          toast.error("Device not registered. Please login to register.");
          return router.push("/register-device");
        }

        // Get location
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
        );

        const { latitude: lat, longitude: lng } = pos.coords;
        const point = turf.point([lng, lat]);
        const isInside = turf.booleanPointInPolygon(point, dealershipCoords);

        if (!isInside) {
          toast.error("You are outside the allowed area");
          return router.push("/");
        }

        // Determine punch type
        let nextType = "in";
        if (adminId) {
          const res = await fetch("/api/punch/latest", {
            headers: { "x-admin-id": adminId },
          });
          const latest = await res.json();
          nextType = latest?.type === "in" ? "out" : "in";
        } else {
          const res = await fetch("/api/punch/device-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId }),
          });
          const data = await res.json();
          if (!data.success) throw new Error("Device not registered");
          nextType = data.lastType === "in" ? "out" : "in";
          adminId = data.adminId;
        }

        // Send punch request
        const punchRes = await fetch("/api/punch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-id": adminId,
          },
          body: JSON.stringify({
            type: nextType,
            location: { lat, lng, verified: true },
            method: session?.user?.id ? "qr" : "device",
          }),
        });

        const result = await punchRes.json();
        if (result.success) {
          toast.success(`Successfully punched ${nextType}`);
        } else {
          throw new Error(result.error || "Punch failed");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Punch failed");
      } finally {
        router.push("/");
      }
    };

    handlePunch();
  }, [status, session, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p className="animate-pulse">Processing punch request...</p>
    </div>
  );
}
