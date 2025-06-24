"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { getOrCreateDeviceId } from "@/utils/device";
import * as turf from "@turf/turf";

const dealershipCoords = turf.polygon([
  [
    [6.379009764729091, 50.924411558743515],
    [6.371998227581571, 50.924799992683916],
    [6.361472975837103, 50.92194386746149],
    [6.360609655480204, 50.913710824758624],
    [6.372283974680613, 50.90978417030098],
    [6.379176158553946, 50.91291200780827],
    [6.377098417668307, 50.919543414052],
    [6.379009764729091, 50.924411558743515],
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
