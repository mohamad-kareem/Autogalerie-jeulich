"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { getDeviceId } from "@/app/utils/device";
import * as turf from "@turf/turf";

const dealershipCoords = turf.polygon([
  [
    [6.3764938345583175, 50.912415760190726],
    [6.377960846434831, 50.923183094335855],
    [6.368560587095885, 50.92339127289719],
    [6.365209080618683, 50.921269439217184],
    [6.364661629832824, 50.91805250497035],
    [6.364546662636997, 50.91544344413916],
    [6.371516877014798, 50.912499940115154],
    [6.3764938345583175, 50.912415760190726],
  ],
]);

export default function PunchQRPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    const handlePunch = async () => {
      try {
        const deviceId = getDeviceId();
        let adminId = session?.user?.id;

        if (!adminId && !deviceId) {
          toast.error(
            "Gerät nicht registriert. Bitte anmelden zur Registrierung."
          );
          return router.push("/register-device");
        }

        let lat = null;
        let lng = null;
        let locationVerified = false;

        // Try GPS first
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
            })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          const point = turf.point([lng, lat]);
          locationVerified = turf.booleanPointInPolygon(
            point,
            dealershipCoords
          );
        } catch (geoError) {
          console.warn("GPS failed, trying local network fallback...");
        }

        // If not verified via GPS, check if inside local WiFi
        if (!locationVerified) {
          const wifiCheck = await fetch("/api/punch/wifi-check");
          const wifiOk = await wifiCheck.json();
          if (!wifiOk.success) {
            toast.error(
              "Standortüberprüfung fehlgeschlagen. Bitte GPS aktivieren oder mit Firmennetzwerk verbinden."
            );
            return router.push("/");
          }
          locationVerified = true;
        }

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
          if (!data.success) throw new Error("Gerät nicht registriert");
          nextType = data.lastType === "in" ? "out" : "in";
          adminId = data.adminId;
        }

        const headers = {
          "Content-Type": "application/json",
        };
        if (adminId) headers["x-admin-id"] = adminId;
        else headers["x-device-id"] = deviceId;

        const punchRes = await fetch("/api/punch", {
          method: "POST",
          headers,
          body: JSON.stringify({
            type: nextType,
            location: { lat, lng, verified: locationVerified },
            method: adminId ? "qr" : "device",
          }),
        });

        const result = await punchRes.json();
        if (result.success) {
          toast.success(
            `Erfolgreich ${
              nextType === "in" ? "eingestempelt" : "ausgestempelt"
            }`
          );
        } else {
          throw new Error(result.error || "Stempelung fehlgeschlagen");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Fehler bei der Stempelung");
      } finally {
        router.push("/");
      }
    };

    handlePunch();
  }, [status, session, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <p className="animate-pulse">Stempelung wird verarbeitet...</p>
    </div>
  );
}
