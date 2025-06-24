"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { getDeviceId } from "@/app/utils/device";
import * as turf from "@turf/turf";

const dealershipCoords = turf.polygon([
  [
    [6.508839155528165, 50.90436744713932],
    [6.496115167278077, 51.01498209388092],
    [6.212961992612236, 50.99375130787689],
    [6.228784326778197, 50.84908955286048],
    [6.286733416318782, 50.82919939381566],
    [6.352636188740092, 50.83441157016779],
    [6.47001492912112, 50.855057077203426],
    [6.508839155528165, 50.90436744713932],
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
          toast.error("Sie befinden sich außerhalb des erlaubten Bereichs");
          return router.push("/");
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

        if (adminId) {
          headers["x-admin-id"] = adminId;
        } else {
          headers["x-device-id"] = deviceId;
        }

        const punchRes = await fetch("/api/punch", {
          method: "POST",
          headers,
          body: JSON.stringify({
            type: nextType,
            location: { lat, lng, verified: true },
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
