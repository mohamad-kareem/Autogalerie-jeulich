"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function PunchQRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("👤 SESSION:", session);
    console.log("📶 STATUS:", status);
    if (status === "loading" || !session?.user?.id) return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/punch-qr");
      return;
    }

    const autoPunch = async () => {
      try {
        const latestRes = await fetch("/api/punch/latest", {
          headers: { "x-admin-id": session.user.id },
        });
        const latest = await latestRes.json();
        const nextType = latest?.type === "in" ? "out" : "in";

        const res = await fetch("/api/punch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-id": session.user.id,
          },
          body: JSON.stringify({
            type: nextType,
            location: { lat: 0, lng: 0, verified: false }, // No GPS
          }),
        });

        const result = await res.json();
        if (result.success) {
          toast.success(
            `Erfolgreich ${
              nextType === "in" ? "eingestempelt" : "ausgestempelt"
            }`
          );
        } else {
          toast.error(result.error || "Fehler beim Einstempeln");
        }
      } catch (err) {
        toast.error("Stempelung fehlgeschlagen. Bitte erneut versuchen.");
      } finally {
        router.push("/dashboard");
      }
    };

    autoPunch();
  }, [status]);

  return (
    <div className="flex items-center justify-center h-screen text-white bg-gray-900">
      <p className="animate-pulse">Zeiterfassung wird verarbeitet...</p>
    </div>
  );
}
