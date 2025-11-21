"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { setDeviceId, getDeviceId } from "@/app/utils/device";
import {
  FiLogIn,
  FiLogOut,
  FiUser,
  FiClock,
  FiCalendar,
  FiSmartphone,
  FiShield,
  FiMapPin,
  FiHelpCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import * as turf from "@turf/turf";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-slate-950">
        <div className="animate-pulse text-gray-400">
          Authentifizierung läuft...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-slate-950 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Kopfbereich */}
        <motion.header
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-200">
                Zeiterfassungssystem
              </h1>
              <p className="text-gray-400">Erfassen Sie Ihre Arbeitszeiten</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-800/60 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-800">
                <FiUser className="text-slate-400" />
                <span className="font-medium text-gray-200">
                  {session.user.name}
                </span>
              </div>

              <div
                className={`px-3 py-2 rounded-lg font-medium border ${
                  statusZeiterfassung === "eingestempelt"
                    ? "bg-green-900/40 text-green-300 border-green-800/50"
                    : "bg-gray-800/60 text-gray-300 border-gray-800"
                }`}
              >
                {statusZeiterfassung === "eingestempelt"
                  ? "Im Dienst"
                  : "Außer Dienst"}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Hauptinhalt */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stempelungsfunktionen */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stempelkarte */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-gray-800"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-200">
                Stempelaktionen
              </h2>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleStempelung("Einstempeln")}
                  disabled={
                    statusZeiterfassung === "eingestempelt" || wirdGeladen
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors border ${
                    statusZeiterfassung === "eingestempelt" || wirdGeladen
                      ? "bg-gray-800/40 text-gray-500 cursor-not-allowed border-gray-800"
                      : "bg-slate-700 hover:bg-slate-900 text-white border-slate-500"
                  }`}
                >
                  <FiLogIn />
                  Einstempeln
                </button>

                <button
                  onClick={() => handleStempelung("Ausstempeln")}
                  disabled={
                    statusZeiterfassung !== "eingestempelt" || wirdGeladen
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors border ${
                    statusZeiterfassung !== "eingestempelt" || wirdGeladen
                      ? "bg-gray-800/40 text-gray-500 cursor-not-allowed border-gray-800"
                      : "bg-slate-800 hover:bg-slate-900 text-white border-slate-700"
                  }`}
                >
                  <FiLogOut />
                  Ausstempeln
                </button>
              </div>
            </motion.div>

            {/* Statuskarte */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-gray-800"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-200">
                Aktueller Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3 text-gray-300">
                    <FiClock className="text-slate-400" />
                    <span>Stempelstatus</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      statusZeiterfassung === "eingestempelt"
                        ? "bg-green-900/40 text-green-300 border-green-800/50"
                        : "bg-gray-800/60 text-gray-300 border-gray-800"
                    }`}
                  >
                    {statusZeiterfassung === "eingestempelt"
                      ? "Eingestempelt"
                      : "Ausgestempelt"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3 text-gray-300">
                    <FiSmartphone className="text-slate-400" />
                    <span>Gerätestatus</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {gerätRegistriert ? "Registriert" : "Nicht registriert"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Seitenleiste */}
          <div className="space-y-6">
            {zeigeGerätePanel ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-slate-800/50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                    <FiSmartphone className="text-slate-400" />
                    Geräteregistrierung
                  </h2>
                  <button
                    onClick={() => setZeigeGerätePanel(false)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/20 p-4 rounded-lg border border-slate-800/30">
                    <div className="flex items-start gap-3">
                      <FiShield className="text-slate-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-200">
                          Sicherheit
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Ihre Gerätekennung wird sicher gespeichert und nur mit
                          Ihrem Konto verknüpft.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-800">
                    <div className="flex items-start gap-3">
                      <FiMapPin className="text-slate-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-200">Standort</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Die Standortüberprüfung bleibt auch mit registriertem
                          Gerät aktiv.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGerätRegistrierung}
                    disabled={wirdGeladen}
                    className={`w-full py-3 rounded-lg font-medium text-white transition-colors border ${
                      wirdGeladen
                        ? "bg-slate-800/40 text-slate-300 border-slate-700 cursor-not-allowed"
                        : "bg-slate-700 hover:bg-slate-900 border-slate-500"
                    }`}
                  >
                    {wirdGeladen ? "Wird registriert..." : "Gerät registrieren"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-gray-800"
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200">
                  <FiSmartphone className="text-slate-400" />
                  Schnellstempelung
                </h2>

                <p className="text-gray-400 mb-4">
                  Registrieren Sie dieses Gerät für schnellere Stempelungen ohne
                  erneute Anmeldung.
                </p>

                <button
                  onClick={() => setZeigeGerätePanel(true)}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-900 text-white rounded-lg font-medium border border-slate-500 transition-colors"
                >
                  {gerätRegistriert ? "Gerät verwalten" : "Gerät registrieren"}
                </button>
              </motion.div>
            )}

            {/* Hilfe-Karte */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-gray-800"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200">
                <FiHelpCircle className="text-slate-400" />
                Hinweis
              </h2>
              <p className="text-gray-400 mb-3">
                Die Standortüberprüfung stellt sicher, dass Stempelungen nur im
                Autohaus möglich sind.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-60 h-60 bg-slate-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />
      </div>
    </div>
  );
}
