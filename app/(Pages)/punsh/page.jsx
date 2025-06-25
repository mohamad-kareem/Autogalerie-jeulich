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
} from "react-icons/fi";
import { FaUserClock, FaBusinessTime } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
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

export default function PunchClockPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStatus, setCurrentStatus] = useState("out");
  const [isLoading, setIsLoading] = useState(false);
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    setDeviceRegistered(!!getDeviceId());
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!session?.user?.id) return;
    const res = await fetch("/api/punch/latest", {
      headers: { "x-admin-id": session.user.id },
    });
    const data = await res.json();
    setCurrentStatus(data?.type || "out");
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) fetchStatus();
  }, [session, fetchStatus]);

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

  const handlePunch = async (type) => {
    if (currentStatus === type || isLoading) return;
    setIsLoading(true);

    try {
      const { lat, lng, isInside } = await getLocation();

      if (!isInside) {
        toast.error(
          "Sie befinden sich außerhalb des erlaubten Bereichs des Autohauses."
        );
        return;
      }

      const res = await fetch("/api/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-id": session.user.id,
        },
        body: JSON.stringify({
          type,
          location: { lat, lng, verified: true },
          method: deviceRegistered ? "device" : "manual",
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(
          `Erfolgreich ${type === "in" ? "eingestempelt" : "ausgestempelt"}`
        );
        await fetchStatus();
      } else {
        toast.error(result.error || "Fehler bei der Stempelung");
      }
    } catch (err) {
      toast.error(
        "Standort konnte nicht ermittelt werden. Bitte GPS aktivieren."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterDevice = async () => {
    if (!session?.user?.id) {
      toast.error("Bitte zuerst einloggen");
      return;
    }

    setIsLoading(true);
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
      setDeviceRegistered(true);
      setShowDevicePanel(false);
      toast.success("Gerät erfolgreich registriert!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Geräteregistrierung fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => new Date(d).toLocaleDateString();

  if (status !== "authenticated")
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-gray-600 text-sm md:text-base">
          Authentifizierung wird geladen...
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-2 md:p-4 lg:p-8">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        {/* Header Section */}
        <header className="mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <FaUserClock className="text-xl md:text-2xl text-emerald-400" />
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                Mitarbeiter Zeiterfassung
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-gray-800/50 rounded-lg p-2 text-xs md:text-sm">
              <div className="flex items-center gap-1">
                <FiUser className="text-emerald-400" />
                <span className="truncate max-w-[100px] md:max-w-none">
                  {session.user.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FiCalendar className="text-emerald-400" />
                <span>{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <IoMdTime className="text-emerald-400" />
                <span>{formatTime(currentTime)}</span>
              </div>
              <div
                className={`px-2 py-0.5 rounded-full text-xs ${
                  currentStatus === "in"
                    ? "bg-emerald-900 text-emerald-200"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {currentStatus === "in" ? "Eingestempelt" : "Ausgestempelt"}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Punch Controls - Left Column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Punch Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <FaBusinessTime className="text-emerald-400" />
                Stempelaktionen
              </h2>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={() => handlePunch("in")}
                  disabled={currentStatus === "in" || isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-3 rounded-lg text-sm md:text-base ${
                    currentStatus === "in" || isLoading
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-emerald-500/20"
                  }`}
                >
                  <FiLogIn className="text-base md:text-lg" />
                  Einstempeln
                </button>

                <button
                  onClick={() => handlePunch("out")}
                  disabled={currentStatus !== "in" || isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base ${
                    currentStatus !== "in" || isLoading
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:shadow-rose-500/20"
                  }`}
                >
                  <FiLogOut className="text-base md:text-lg" />
                  Ausstempeln
                </button>
              </div>

              <div className="mt-4 md:mt-6 flex justify-between">
                {!deviceRegistered && (
                  <button
                    onClick={() => setShowDevicePanel(true)}
                    className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs md:text-sm transition-colors"
                  >
                    <FiSmartphone className="text-indigo-200" />
                    Gerät registrieren
                  </button>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <FiClock className="text-emerald-400" />
                Aktueller Status
              </h2>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-700/50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs text-gray-400">Letzte Aktion</p>
                  <p className="text-sm md:text-base font-medium mt-1">
                    {currentStatus === "in" ? "Eingestempelt" : "Ausgestempelt"}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs text-gray-400">Gerätestatus</p>
                  <p className="text-sm md:text-base font-medium mt-1">
                    {deviceRegistered ? "Registriert" : "Nicht registriert"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Device Panel */}
          <div className="space-y-4 md:space-y-6">
            {showDevicePanel ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg border border-indigo-500/30">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <FiSmartphone className="text-indigo-400" />
                    Geräteregistrierung
                  </h2>
                  <button
                    onClick={() => setShowDevicePanel(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-700/50">
                    <div className="flex items-start gap-2">
                      <FiShield className="text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium">Sicherheit</h3>
                        <p className="text-xs text-indigo-200 mt-1">
                          Ihre Gerätekennung wird verschlüsselt gespeichert und
                          ist nur mit Ihrem Konto verknüpft.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                    <div className="flex items-start gap-2">
                      <FiMapPin className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium">Standort</h3>
                        <p className="text-xs text-gray-300 mt-1">
                          Auch mit registriertem Gerät bleibt die
                          Standortüberprüfung aktiv.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRegisterDevice}
                    disabled={isLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-all ${
                      isLoading
                        ? "bg-indigo-400"
                        : "bg-indigo-600 hover:bg-indigo-500"
                    } flex items-center justify-center text-sm`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Wird registriert...
                      </>
                    ) : (
                      "Jetzt registrieren"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
                <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                  <FiSmartphone className="text-indigo-400" />
                  Schnellstempelung
                </h2>

                <p className="text-xs md:text-sm text-gray-400 mb-3">
                  Registrieren Sie dieses Gerät für schnelle Stempelungen ohne
                  erneute Anmeldung.
                </p>

                <button
                  onClick={() => setShowDevicePanel(true)}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {deviceRegistered
                    ? "Geräteinformationen"
                    : "Gerät registrieren"}
                </button>
              </div>
            )}

            {/* Help Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
                <FiShield className="text-emerald-400" />
                Sicherheitshinweis
              </h2>
              <p className="text-xs md:text-sm text-gray-400">
                Die Standortüberprüfung stellt sicher, dass Stempelungen nur
                innerhalb des Autohauses möglich sind. Ihre Daten werden
                verschlüsselt übertragen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
