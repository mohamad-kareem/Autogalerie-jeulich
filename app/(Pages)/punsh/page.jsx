"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { setDeviceId, getDeviceId } from "@/app/utils/device";
import { FiLogIn, FiLogOut, FiSmartphone, FiShield, FiMapPin, FiMenu, FiLoader } from "react-icons/fi";
import * as turf from "@turf/turf";
import { useSidebar } from "@/app/(components)/SidebarContext";
const dealershipCoords = turf.polygon([
  [
    [6.381400250922695, 50.91247701778411],
    [6.380292608667219, 50.924561064113135],
    [6.36700607894096, 50.92562660489435],
    [6.361225653472076, 50.921238815973254],
    [6.359998105366913, 50.91789937746472],
    [6.362263478784342, 50.91323823463944],
    [6.370788201317012, 50.911029722080215],
    [6.381400250922695, 50.91247701778411],
  ],
]);

export default function ZeiterfassungPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [statusZeiterfassung, setStatusZeiterfassung] =
    useState("ausgestempelt");
  const [wirdGeladen, setWirdGeladen] = useState(false);
  const [zeigeGerätePanel, setZeigeGerätePanel] = useState(false);
  const [gerätRegistriert] = useState(!!getDeviceId());

  // Authentifizierungsprüfung
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  // Aktuellen Status abfragen
  const fetchStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/punch/latest", {
        headers: { "x-admin-id": session.user.id },
      });
      const data = await res.json();
      setStatusZeiterfassung(
        data?.type === "in" ? "eingestempelt" : "ausgestempelt"
      );
    } catch (error) {
      console.error("Fehler beim Abrufen des Status:", error);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) fetchStatus();
  }, [session, fetchStatus]);

  // Aktuellen Standort ermitteln
  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const point = turf.point([lng, lat]);
          const isInside = turf.booleanPointInPolygon(point, dealershipCoords);
          resolve({ lat, lng, isInside });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Stempelung verarbeiten
  const handleStempelung = async (typ) => {
    if (statusZeiterfassung === typ || wirdGeladen) return;
    setWirdGeladen(true);

    try {
      const { lat, lng, isInside } = await getLocation();

      if (!isInside) {
        toast.error("Sie müssen sich im Autohaus befinden, um zu stempeln");
        return;
      }

      const res = await fetch("/api/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({
          type: typ === "Einstempeln" ? "in" : "out",
          location: { lat, lng, verified: true },
          method: gerätRegistriert ? "device" : "manual",
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(
          `Erfolgreich ${
            typ === "Einstempeln" ? "eingestempelt" : "ausgestempelt"
          }`
        );
        await fetchStatus();
      } else {
        toast.error(result.error || "Stempelung fehlgeschlagen");
      }
    } catch (err) {
      toast.error(
        "Standort konnte nicht ermittelt werden. Bitte GPS aktivieren."
      );
    } finally {
      setWirdGeladen(false);
    }
  };

  // Gerät registrieren
  const handleGerätRegistrierung = async () => {
    if (!session?.user?.id) {
      toast.error("Bitte zuerst einloggen");
      return;
    }

    setWirdGeladen(true);
    try {
      const deviceId = crypto.randomUUID();

      const res = await fetch("/api/punch/register-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: session.user.id, deviceId }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Registrierung fehlgeschlagen");
      }

      setDeviceId(deviceId);
      setZeigeGerätePanel(false);
      toast.success("Gerät erfolgreich registriert!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Geräteregistrierung fehlgeschlagen");
    } finally {
      setWirdGeladen(false);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-[13px] text-muted">Anmeldung wird geprüft …</div>
      </div>
    );
  }

  const isIn = statusZeiterfassung === "eingestempelt";

  return (
    <div className="min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="ind-plate flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
              <FiMenu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="ind-title">Stempeluhr</h1>
              <p className="text-[12.5px] text-muted">Ein- und Ausstempeln für Ihren Arbeitstag.</p>
            </div>
          </div>
          <p className="text-[13px] text-muted">
            Angemeldet als <span className="font-semibold text-ink">{session.user.name}</span>
          </p>
        </header>

        <div className="card p-5 sm:p-8">
          <LiveClock />

          <div className="mt-8 flex justify-center">
            <span
              className={`chip px-4 py-2 text-sm ${
                isIn ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isIn ? "bg-emerald-500" : "bg-slate-400"}`} />
              {isIn ? "Eingestempelt" : "Ausgestempelt"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleStempelung(isIn ? "Ausstempeln" : "Einstempeln")}
            disabled={wirdGeladen}
            className={`btn btn-lg mx-auto mt-6 flex w-full max-w-sm !rounded-[4px] text-white ${
              isIn ? "!border-rose-800 !bg-rose-600 hover:!bg-rose-700" : "!border-emerald-800 !bg-emerald-600 hover:!bg-emerald-700"
            }`}
          >
            {wirdGeladen ? <FiLoader className="h-5 w-5 animate-spin" /> : isIn ? <FiLogOut className="h-5 w-5" /> : <FiLogIn className="h-5 w-5" />}
            {wirdGeladen ? "Standort wird geprüft …" : isIn ? "Jetzt ausstempeln" : "Jetzt einstempeln"}
          </button>
          <p className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-1.5 text-center text-[12px] text-muted">
            <FiMapPin className="h-3.5 w-3.5" /> Stempeln ist nur im Autohaus möglich (Standort wird geprüft).
          </p>

          <div className="mt-8 grid gap-3 border-t border-[#e3e6ea] pt-6 sm:grid-cols-2">
            <div className="rounded-[4px] bg-[#f3f5f7] p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">Gerät</p>
              <p className="mt-1.5 flex items-center gap-2 text-[15px] font-semibold text-ink">
                <FiSmartphone className="h-4 w-4 text-slate-500" />
                {gerätRegistriert ? "Registriert" : "Nicht registriert"}
              </p>
            </div>
            <div className="rounded-[4px] bg-[#f3f5f7] p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">Schnellstempelung</p>
              <button type="button" onClick={() => setZeigeGerätePanel((v) => !v)} className="btn btn-secondary btn-sm mt-1.5">
                {gerätRegistriert ? "Gerät verwalten" : "Gerät registrieren"}
              </button>
            </div>
          </div>

          {zeigeGerätePanel ? (
            <div className="mt-3 rounded-[4px] border border-[#dfe2e6] p-4">
              <p className="flex items-start gap-2 text-[13px] text-body">
                <FiShield className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                Die Gerätekennung wird sicher gespeichert und nur mit Ihrem Konto verknüpft. Die Standortprüfung bleibt auch mit registriertem Gerät aktiv.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={handleGerätRegistrierung} disabled={wirdGeladen} className="btn btn-primary btn-sm">
                  {wirdGeladen ? "Wird registriert …" : "Dieses Gerät registrieren"}
                </button>
                <button type="button" onClick={() => setZeigeGerätePanel(false)} className="btn btn-secondary btn-sm">
                  Abbrechen
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** big live clock like the Autocenter Stempeluhr */
function LiveClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center">
      <p className="font-mono text-4xl font-bold tracking-tight text-ink tabular-nums sm:text-5xl">{now ? now.toLocaleTimeString("de-DE") : "--:--:--"}</p>
      <p className="mt-2 text-muted">{now ? now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : " "}</p>
    </div>
  );
}
