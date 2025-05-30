"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import * as turf from "@turf/turf";

// Define dealership polygon
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");

  useEffect(() => {
    // Block access if no ?code=... in URL
    if (!codeParam) {
      toast.error("❌ Ungültiger Zugriff. Bitte scannen Sie den QR-Code.");
      router.push("/");
      return;
    }

    // Wait until session is loaded
    if (status === "loading") return;

    // Redirect to login if not authenticated
    if (status === "unauthenticated" || !session?.user?.id) {
      router.push("/login?callbackUrl=/punch-qr?code=" + codeParam);
      return;
    }

    const autoPunch = async () => {
      try {
        // Check last punch type
        const latestRes = await fetch("/api/punch/latest", {
          headers: { "x-admin-id": session.user.id },
        });
        const latest = await latestRes.json();
        const nextType = latest?.type === "in" ? "out" : "in";

        // Get GPS location
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        const { latitude: lat, longitude: lng } = pos.coords;
        const point = turf.point([lng, lat]);
        const isInside = turf.booleanPointInPolygon(point, dealershipCoords);

        if (!isInside) {
          toast.error("❌ Sie befinden sich außerhalb des erlaubten Bereichs.");
          return router.push("/");
        }

        // Submit punch
        const res = await fetch("/api/punch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-id": session.user.id,
          },
          body: JSON.stringify({
            type: nextType,
            location: { lat, lng, verified: true },
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
        toast.error("📍 Standort konnte nicht ermittelt werden.");
      } finally {
        router.push("/");
      }
    };

    autoPunch();
  }, [status, session, router, codeParam]);

  return (
    <div className="flex items-center justify-center h-screen text-white bg-gray-900 px-4 text-center">
      <p className="animate-pulse text-lg">
        Standort wird überprüft... Bitte Ortungsdienste aktivieren.
      </p>
    </div>
  );
}
