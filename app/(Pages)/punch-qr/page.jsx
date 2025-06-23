"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import * as turf from "@turf/turf";

// Utility: Get or create device ID
function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// Your polygon
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasPunched = useRef(false);
  const [codeParam, setCodeParam] = useState(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      setCodeParam(code);
    }
  }, []);

  useEffect(() => {
    if (codeParam === undefined || status === "loading") return;
    if (!codeParam) {
      toast.error("❌ Ungültiger Zugriff. Bitte scannen Sie den QR-Code.");
      router.push("/");
      return;
    }

    if (hasPunched.current) return;
    hasPunched.current = true;

    const autoPunch = async () => {
      try {
        // Determine next punch type if logged in
        let adminId = session?.user?.id ?? null;
        let nextType = "in";

        if (!adminId) {
          const deviceId = getOrCreateDeviceId();
          const response = await fetch("/api/device-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deviceId }),
          });
          const data = await response.json();
          if (!data.success) {
            toast.error("❌ Gerät nicht registriert. Bitte beim Admin melden.");
            return router.push("/");
          }
          adminId = data.adminId;
          nextType = data.lastType === "in" ? "out" : "in";
        } else {
          const latestRes = await fetch("/api/punch/latest", {
            headers: { "x-admin-id": adminId },
          });
          const latest = await latestRes.json();
          nextType = latest?.type === "in" ? "out" : "in";
        }

        // Get GPS position
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
          toast.error("❌ Sie befinden sich außerhalb des erlaubten Bereichs.");
          return router.push("/");
        }

        // Send punch request
        const res = await fetch("/api/punch", {
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

        const result = await res.json();
        if (result.success) {
          toast.success(
            `✅ Erfolgreich ${
              nextType === "in" ? "eingestempelt" : "ausgestempelt"
            }`
          );
        } else {
          toast.error(result.error || "❌ Fehler beim Einstempeln");
        }
      } catch (err) {
        console.error(err);
        toast.error("📍 Standort konnte nicht ermittelt werden.");
      } finally {
        router.push("/");
      }
    };

    autoPunch();
  }, [codeParam, status, session, router]);

  return (
    <div className="flex items-center justify-center h-screen text-white bg-gray-900 px-4 text-center">
      <p className="animate-pulse text-lg">
        Standort wird überprüft... Bitte Ortungsdienste aktivieren.
      </p>
    </div>
  );
}
